"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { Role, RequestStatus } from "@prisma/client";
import {
  addDocumentSchema,
  deleteDocumentSchema,
  finalizeRequestSchema,
  type AddDocumentInput,
  type DeleteDocumentInput,
  type FinalizeRequestInput,
} from "@/lib/validations/accountant";
import { prisma } from "../prisma";
import { sendEmail } from "../email/nodemailer";
import { getFinalizedRequestEmail } from "../email/purchase-request-templates";

/**
 * Type de retour pour les actions
 */
type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Vérifier que l'utilisateur est un COMPTABLE
 */
async function checkComptablePermission(): Promise<ActionResponse | null> {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Non authentifié" };
  }

  if (session.user.role !== Role.COMPTABLE && session.user.role !== Role.DIRECTEUR) {
    return { success: false, error: "Accès refusé. Réservé aux comptables." };
  }

  return null;
}

/**
 * Ajouter un document à une demande d'achat
 */
export async function addDocumentAction(
  input: AddDocumentInput
): Promise<ActionResponse> {
  try {
    // Vérifier les permissions
    const permissionError = await checkComptablePermission();
    if (permissionError) return permissionError;

    // Valider les données
    const validated = addDocumentSchema.parse(input);

    // Vérifier que la demande existe et est en VALIDATED
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: validated.purchaseRequestId },
    });

    if (!request) {
      return { success: false, error: "Demande non trouvée" };
    }

    if (request.status !== RequestStatus.VALIDATED) {
      return {
        success: false,
        error: "Seules les demandes validées peuvent recevoir des documents",
      };
    }

    const session = await auth();

    // Créer le document
    const document = await prisma.document.create({
      data: {
        type: validated.type,
        name: validated.name,
        fileUrl: validated.fileUrl,
        purchaseRequestId: validated.purchaseRequestId || "",
        uploadedById: session?.user?.id || "",
      },
    });

    // Logger l'activité
    await prisma.activityLog.create({
      data: {
        action: "CREATE",
        entityType: "Document",
        entityId: document.id,
        userId: session?.user?.id,
        userName: session?.user?.name,
        details: {
          purchaseRequestId: request.id,
          reference: request.reference,
          documentType: document.type,
          documentName: document.name,
        },
      },
    });

    revalidatePath("/requests");
    revalidatePath(`/requests/${validated.purchaseRequestId}`);

    return { success: true, data: document };
  } catch (error: any) {
    console.error("Erreur addDocumentAction:", error);

    if (error.name === "ZodError") {
      return { success: false, error: "Données invalides" };
    }

    return { success: false, error: "Erreur lors de l'ajout du document" };
  }
}

/**
 * Supprimer un document
 */
export async function deleteDocumentAction(
  input: DeleteDocumentInput
): Promise<ActionResponse> {
  try {
    // Vérifier les permissions
    const permissionError = await checkComptablePermission();
    if (permissionError) return permissionError;

    // Valider les données
    const validated = deleteDocumentSchema.parse(input);

    // Vérifier que le document existe
    const document = await prisma.document.findUnique({
      where: { id: validated.documentId },
      include: { purchaseRequest: true },
    });

    if (!document) {
      return { success: false, error: "Document non trouvé" };
    }

    // Vérifier que la demande est encore en VALIDATED
    if (document.purchaseRequest.status !== RequestStatus.VALIDATED) {
      return {
        success: false,
        error: "Impossible de supprimer un document d'une demande finalisée",
      };
    }

    // Supprimer le document
    await prisma.document.delete({
      where: { id: validated.documentId },
    });

    // Logger l'activité
    const session = await auth();
    await prisma.activityLog.create({
      data: {
        action: "DELETE",
        entityType: "Document",
        entityId: validated.documentId || "",
        userId: session?.user?.id,
        userName: session?.user?.name,
        details: {
          purchaseRequestId: document.purchaseRequestId,
          documentType: document.type,
          documentName: document.name,
        },
      },
    });

    revalidatePath("/requests");
    revalidatePath(`/requests/${document.purchaseRequestId}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur deleteDocumentAction:", error);
    return { success: false, error: "Erreur lors de la suppression du document" };
  }
}

/**
 * Finaliser une demande d'achat (VALIDATED → COMPLETED)
 * ✅ ENVOIE EMAIL AU USER + ACHAT + DIRECTEUR
 */
export async function finalizeRequestAction(
  input: FinalizeRequestInput
): Promise<ActionResponse> {
  try {
    // Vérifier les permissions
    const permissionError = await checkComptablePermission();
    if (permissionError) return permissionError;

    // Valider les données
    const validated = finalizeRequestSchema.parse(input);

    // Vérifier que la demande existe
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: validated.purchaseRequestId },
      include: {
        documents: true,
        selectedQuote: true,
        user: true,
        department: true,
      },
    });

    if (!request) {
      return { success: false, error: "Demande non trouvée" };
    }

    if (request.status !== RequestStatus.VALIDATED) {
      return {
        success: false,
        error: "Seules les demandes validées peuvent être finalisées",
      };
    }

    // Vérifier qu'au moins un document a été ajouté
    if (request.documents.length === 0) {
      return {
        success: false,
        error: "Au moins un document doit être ajouté avant de finaliser",
      };
    }

    if (!request.selectedQuote) {
      return {
        success: false,
        error: "Aucun devis sélectionné",
      };
    }

    const session = await auth();

    // Mettre à jour le statut de la demande
    const updatedRequest = await prisma.purchaseRequest.update({
      where: { id: validated.purchaseRequestId },
      data: { status: RequestStatus.COMPLETED },
    });

    // Créer une approbation
    await prisma.approval.create({
      data: {
        action: "APPROVE",
        comment: "Achat finalisé",
        role: Role.COMPTABLE,
        userId: session?.user?.id || "",
        purchaseRequestId: validated.purchaseRequestId || "",
      },
    });

    // Logger l'activité
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "PurchaseRequest",
        entityId: updatedRequest.id,
        userId: session?.user?.id,
        userName: session?.user?.name,
        details: {
          action: "finalized",
          reference: updatedRequest.reference,
          status: RequestStatus.COMPLETED,
        },
      },
    });

    // ✅ ENVOYER EMAIL À TOUS (USER + ACHAT + DIRECTEUR)
    try {
      const requestUrl = `${process.env.NEXT_PUBLIC_APP_URL}/requests/${request.id}`;

      const emailTemplate = getFinalizedRequestEmail({
        reference: request.reference,
        title: request.title,
        requesterName: request.user.name,
        department: request.department.name,
        selectedSupplier: request.selectedQuote.supplierName,
        totalFinal: request.totalFinal || request.totalEstimated,
        documentsCount: request.documents.length,
        finalizerName: session?.user?.name || "Comptable",
        requestUrl,
      });

      // Liste des destinataires
      const recipients: string[] = [];

      // 1. USER (demandeur)
      recipients.push(request.user.email);

      // 2. Service ACHAT
      const achatUsers = await prisma.user.findMany({
        where: { role: Role.ACHAT, isActive: true },
        select: { email: true },
      });
      recipients.push(...achatUsers.map((u) => u.email));

      // 3. DIRECTEURS
      const directeurs = await prisma.user.findMany({
        where: { role: Role.DIRECTEUR, isActive: true },
        select: { email: true },
      });
      recipients.push(...directeurs.map((d) => d.email));

      // Envoyer à tous
      if (recipients.length > 0) {
        await Promise.all(
          recipients.map((email) =>
            sendEmail({
              to: email,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
            })
          )
        );

        console.log(
          `✅ Email de finalisation envoyé à ${recipients.length} destinataire(s)`
        );
      }
    } catch (emailError) {
      console.error("❌ Erreur envoi email:", emailError);
      // Ne pas bloquer la finalisation si l'email échoue
    }

    revalidatePath("/requests");
    revalidatePath(`/requests/${validated.purchaseRequestId}`);

    return { success: true, data: updatedRequest };
  } catch (error: any) {
    console.error("Erreur finalizeRequestAction:", error);

    if (error.name === "ZodError") {
      return { success: false, error: "Données invalides" };
    }

    return { success: false, error: "Erreur lors de la finalisation" };
  }
}