

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { Role, RequestStatus } from "@prisma/client";
import {
  createPurchaseRequestSchema,
  updatePurchaseRequestSchema,
  submitPurchaseRequestSchema,
  deletePurchaseRequestSchema,
  type CreatePurchaseRequestInput,
  type UpdatePurchaseRequestInput,
  type SubmitPurchaseRequestInput,
  type DeletePurchaseRequestInput,
} from "@/lib/validations/purchase-request";
import { prisma } from "../prisma";
import { sendEmail } from "../email/nodemailer";
import { getSubmittedRequestEmail } from "../email/purchase-request-templates";

/**
 * Type de retour pour les actions
 */
export type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Générer une référence unique pour la demande
 */
function generateReference(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DA-${year}${month}-${random}`;
}

/**
 * Créer une nouvelle demande d'achat (DRAFT)
 */
export async function createPurchaseRequestAction(
  input: CreatePurchaseRequestInput,
): Promise<ActionResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Non authentifié" };
    }

    // Vérifier que l'utilisateur a un département
    if (!session.user.departmentId) {
      return {
        success: false,
        error:
          "Vous devez être associé à un département pour créer une demande",
      };
    }

    // Valider les données
    const validated = createPurchaseRequestSchema.parse(input);

    // Calculer le total estimé
    const totalEstimated = validated.items.reduce(
      (sum, item) => sum + item.quantity * item.estimatedPrice,
      0,
    );

    // Créer la demande avec ses items
    const request = await prisma.purchaseRequest.create({
      data: {
        reference: generateReference(),
        title: validated.title,
        description: validated.description || null,
        status: RequestStatus.DRAFT,
        totalEstimated,
        userId: session.user.id,
        departmentId: session.user.departmentId,
        items: {
          create: validated.items.map((item) => ({
            name: item.name,
            description: item.description || null,
            quantity: item.quantity,
            estimatedPrice: item.estimatedPrice,
          })),
        },
      },
      include: {
        items: true,
        department: true,
      },
    });

    // Logger l'activité
    await prisma.activityLog.create({
      data: {
        action: "CREATE",
        entityType: "PurchaseRequest",
        entityId: request.id,
        userId: session.user.id,
        userName: session.user.name,
        details: {
          reference: request.reference,
          title: request.title,
          itemsCount: validated.items.length,
        },
      },
    });

    revalidatePath("/requests");

    return { success: true, data: request };
  } catch (error: any) {
    console.error("Erreur createPurchaseRequestAction:", error);

    if (error.name === "ZodError") {
      return { success: false, error: "Données invalides" };
    }

    return {
      success: false,
      error: "Erreur lors de la création de la demande",
    };
  }
}

/**
 * Modifier une demande d'achat (uniquement en DRAFT)
 */
export async function updatePurchaseRequestAction(
  input: UpdatePurchaseRequestInput,
): Promise<ActionResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Non authentifié" };
    }

    // Valider les données
    const validated = updatePurchaseRequestSchema.parse(input);

    // Vérifier que la demande existe et est modifiable
    const existingRequest = await prisma.purchaseRequest.findUnique({
      where: { id: validated.id },
      include: { items: true },
    });

    if (!existingRequest) {
      return { success: false, error: "Demande non trouvée" };
    }

    // Vérifier les permissions
    if (existingRequest.userId !== session.user.id) {
      return { success: false, error: "Accès refusé" };
    }

    // Vérifier que la demande est en DRAFT
    if (existingRequest.status !== RequestStatus.DRAFT) {
      return {
        success: false,
        error: "Seules les demandes en brouillon peuvent être modifiées",
      };
    }

    // Calculer le nouveau total estimé
    const totalEstimated = validated.items.reduce(
      (sum, item) => sum + item.quantity * item.estimatedPrice,
      0,
    );

    // Supprimer les anciens items
    await prisma.purchaseItem.deleteMany({
      where: { purchaseRequestId: validated.id },
    });

    // Mettre à jour la demande et créer les nouveaux items
    const request = await prisma.purchaseRequest.update({
      where: { id: validated.id },
      data: {
        title: validated.title,
        description: validated.description || null,
        totalEstimated,
        items: {
          create: validated.items.map((item) => ({
            name: item.name,
            description: item.description || null,
            quantity: item.quantity,
            estimatedPrice: item.estimatedPrice,
          })),
        },
      },
      include: {
        items: true,
        department: true,
      },
    });

    // Logger l'activité
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "PurchaseRequest",
        entityId: request.id,
        userId: session.user.id,
        userName: session.user.name,
        details: {
          reference: request.reference,
          title: request.title,
        },
      },
    });

    revalidatePath("/requests");
    revalidatePath(`/requests/${request.id}`);

    return { success: true, data: request };
  } catch (error: any) {
    console.error("Erreur updatePurchaseRequestAction:", error);

    if (error.name === "ZodError") {
      return { success: false, error: "Données invalides" };
    }

    return {
      success: false,
      error: "Erreur lors de la modification de la demande",
    };
  }
}

/**
 * Soumettre une demande d'achat (DRAFT → PENDING)
 * ✅ ENVOIE EMAIL AU SERVICE ACHAT
 */
export async function submitPurchaseRequestAction(
  input: SubmitPurchaseRequestInput,
): Promise<ActionResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Non authentifié" };
    }

    // Valider les données
    const validated = submitPurchaseRequestSchema.parse(input);

    // Vérifier que la demande existe
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: validated.id },
      include: {
        items: true,
        department: true,
        user: true,
      },
    });

    if (!request) {
      return { success: false, error: "Demande non trouvée" };
    }

    // Vérifier les permissions
    if (request.userId !== session.user.id) {
      return { success: false, error: "Accès refusé" };
    }

    // Vérifier que la demande est en DRAFT
    if (request.status !== RequestStatus.DRAFT) {
      return {
        success: false,
        error: "Cette demande a déjà été soumise",
      };
    }

    // Vérifier qu'il y a au moins un item
    if (request.items.length === 0) {
      return {
        success: false,
        error: "La demande doit contenir au moins un article",
      };
    }

    // Mettre à jour le statut
    const updatedRequest = await prisma.purchaseRequest.update({
      where: { id: validated.id },
      data: { status: RequestStatus.PENDING },
    });

    // Logger l'activité
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "PurchaseRequest",
        entityId: updatedRequest.id,
        userId: session.user.id,
        userName: session.user.name,
        details: {
          action: "submitted",
          reference: updatedRequest.reference,
          status: RequestStatus.PENDING,
        },
      },
    });

    // ✅ ENVOYER EMAIL AU SERVICE ACHAT
    try {
      // Récupérer les emails du service ACHAT
      const achatUsers = await prisma.user.findMany({
        where: { role: Role.ACHAT, isActive: true },
        select: { email: true },
      });

      if (achatUsers.length > 0) {
        const requestUrl = `${process.env.NEXT_PUBLIC_APP_URL}/requests/${request.id}`;

        const emailTemplate = getSubmittedRequestEmail({
          reference: request.reference,
          title: request.title,
          requesterName: request.user.name,
          department: request.department.name,
          itemsCount: request.items.length,
          totalEstimated: request.totalEstimated,
          requestUrl,
        });

        // Envoyer à tous les utilisateurs ACHAT
        await Promise.all(
          achatUsers.map((user) =>
            sendEmail({
              to: user.email,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
            })
          )
        );

        console.log(
          `✅ Email envoyé à ${achatUsers.length} utilisateur(s) ACHAT`
        );
      }
    } catch (emailError) {
      console.error("❌ Erreur envoi email:", emailError);
      // Ne pas bloquer la soumission si l'email échoue
    }

    revalidatePath("/requests");
    revalidatePath(`/requests/${updatedRequest.id}`);

    return { success: true, data: updatedRequest };
  } catch (error) {
    console.error("Erreur submitPurchaseRequestAction:", error);
    return {
      success: false,
      error: "Erreur lors de la soumission de la demande",
    };
  }
}

/**
 * Supprimer une demande d'achat (uniquement en DRAFT)
 */
export async function deletePurchaseRequestAction(
  input: DeletePurchaseRequestInput,
): Promise<ActionResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Non authentifié" };
    }

    // Valider les données
    const validated = deletePurchaseRequestSchema.parse(input);

    // Vérifier que la demande existe
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: validated.id },
    });

    if (!request) {
      return { success: false, error: "Demande non trouvée" };
    }

    // Vérifier les permissions
    if (request.userId !== session.user.id) {
      return { success: false, error: "Accès refusé" };
    }

    // Vérifier que la demande est en DRAFT
    if (request.status !== RequestStatus.DRAFT) {
      return {
        success: false,
        error: "Seules les demandes en brouillon peuvent être supprimées",
      };
    }

    // Supprimer la demande (cascade sur les items)
    await prisma.purchaseRequest.delete({
      where: { id: validated.id },
    });

    // Logger l'activité
    await prisma.activityLog.create({
      data: {
        action: "DELETE",
        entityType: "PurchaseRequest",
        entityId: validated.id!,
        userId: session.user.id,
        userName: session.user.name,
        details: {
          reference: request.reference,
          title: request.title,
        },
      },
    });

    revalidatePath("/requests");

    return { success: true };
  } catch (error) {
    console.error("Erreur deletePurchaseRequestAction:", error);
    return {
      success: false,
      error: "Erreur lors de la suppression de la demande",
    };
  }
}