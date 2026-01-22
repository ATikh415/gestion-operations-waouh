
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

/**
 * Type de retour pour les actions
 */
type ActionResponse<T = any> = {
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
 * Récupérer les demandes d'achat de l'utilisateur connecté
 */
export async function getPurchaseRequestsAction(): Promise<ActionResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Non authentifié" };
    }

    // Filtrer selon le rôle
    const where: any = {};

    if (session.user.role === Role.USER) {
      // Les USER ne voient que leurs propres demandes
      where.userId = session.user.id;
    }
    // Les autres rôles (ACHAT, COMPTABLE, DIRECTEUR) voient toutes les demandes

    const requests = await prisma.purchaseRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        items: true,
        _count: {
          select: {
            quotes: true,
            approvals: true,
            documents: true,
          },
        },
      },
    });

    return { success: true, data: requests };
  } catch (error) {
    console.error("Erreur getPurchaseRequestsAction:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des demandes",
    };
  }
}

/**
 * Récupérer une demande d'achat par son ID
 */
export async function getPurchaseRequestByIdAction(
  id: string
): Promise<ActionResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Non authentifié" };
    }

    // Import dynamique de Prisma

    const request = await prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        items: true,
        quotes: true,
        approvals: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        documents: true,
        selectedQuote: true,
      },
    });

    if (!request) {
      return { success: false, error: "Demande non trouvée" };
    }

    // Vérifier les permissions
    if (
      session.user.role === Role.USER &&
      request.userId !== session.user.id
    ) {
      return { success: false, error: "Accès refusé" };
    }

    return { success: true, data: request };
  } catch (error) {
    console.error("Erreur getPurchaseRequestByIdAction:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération de la demande",
    };
  }
}

/**
 * Créer une nouvelle demande d'achat (DRAFT)
 */
export async function createPurchaseRequestAction(
  input: CreatePurchaseRequestInput
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
        error: "Vous devez être associé à un département pour créer une demande",
      };
    }

    // Valider les données
    const validated = createPurchaseRequestSchema.parse(input);

    // Import dynamique de Prisma

    // Calculer le total estimé
    const totalEstimated = validated.items.reduce(
      (sum, item) => sum + item.quantity * item.estimatedPrice,
      0
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
  input: UpdatePurchaseRequestInput
): Promise<ActionResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Non authentifié" };
    }

    // Valider les données
    const validated = updatePurchaseRequestSchema.parse(input);

    // Import dynamique de Prisma

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
      0
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
 */
export async function submitPurchaseRequestAction(
  input: SubmitPurchaseRequestInput
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
      include: { items: true },
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
  input: DeletePurchaseRequestInput
): Promise<ActionResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Non authentifié" };
    }

    // Valider les données
    const validated = deletePurchaseRequestSchema.parse(input);

    // Import dynamique de Prisma

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