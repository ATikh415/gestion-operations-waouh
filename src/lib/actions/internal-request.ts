
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { Role, InternalStatus } from "@prisma/client";
import {
  createInternalRequestSchema,
  approveInternalRequestSchema,
  rejectInternalRequestSchema,
  finalizeInternalRequestSchema,
  addInternalDocumentSchema,
  deleteInternalDocumentSchema,
  type CreateInternalRequestInput,
  type ApproveInternalRequestInput,
  type RejectInternalRequestInput,
  type FinalizeInternalRequestInput,
  type AddInternalDocumentInput,
  type DeleteInternalDocumentInput,
} from "@/lib/validations/internal-request";
import { sendEmail } from "@/lib/email/nodemailer";
import {
  newInternalRequestEmail,
  approvedInternalRequestEmail,
  rejectedInternalRequestEmail,
} from "@/lib/email/internal-request-templates";
import { prisma } from "@/lib/prisma";

/**
 * Type de retour pour les actions
 */
type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Générer une référence unique pour une demande interne
 */
async function generateInternalRequestReference(): Promise<string> {

  const now = new Date();
  const year = now.getFullYear();

  // Compter le nombre de demandes internes cette année
  const count = await prisma.internalRequest.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
  });

  const number = (count + 1).toString().padStart(4, "0");
  return `INT-${year}-${number}`;
}

/**
 * 1. Créer une demande interne (ACHAT)
 */
export async function createInternalRequestAction(
  input: CreateInternalRequestInput
): Promise<ActionResponse> {
  try {
    // Vérifier l'authentification
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Non authentifié" };
    }

    // Vérifier le rôle (ACHAT uniquement)
    if (session.user.role !== Role.ACHAT) {
      return {
        success: false,
        error: "Accès refusé. Réservé aux responsables achats.",
      };
    }

    // Valider les données
    const validated = createInternalRequestSchema.parse(input);

    // Générer la référence
    const reference = await generateInternalRequestReference();

    // Créer la demande interne
    const internalRequest = await prisma.internalRequest.create({
      data: {
        reference,
        title: validated.title,
        description: validated.description,
        category: validated.category,
        amount: validated.amount,
        status: InternalStatus.PENDING,
        requestedById: session.user.id,
      },
      include: {
        requestedBy: true,
      },
    });

    // Logger l'activité
    await prisma.activityLog.create({
      data: {
        action: "CREATE",
        entityType: "InternalRequest",
        entityId: internalRequest.id,
        userId: session.user.id,
        userName: session.user.name,
        details: {
          reference: internalRequest.reference,
          title: internalRequest.title,
          category: internalRequest.category,
          amount: internalRequest.amount,
        },
      },
    });

    // Récupérer l'email du directeur
    const director = await prisma.user.findFirst({
      where: { role: Role.DIRECTEUR },
      select: { email: true },
    });

    // Envoyer email de notification au directeur
    if (director?.email) {
      const emailData = newInternalRequestEmail(internalRequest, director.email);
      await sendEmail(emailData);
    }

    revalidatePath("/internal-requests");

    return { success: true, data: internalRequest };
  } catch (error: any) {
    console.error("Erreur createInternalRequestAction:", error);

    if (error.name === "ZodError") {
      return { success: false, error: "Données invalides" };
    }

    return { success: false, error: "Erreur lors de la création de la demande" };
  }
}

/**
 * 2. Approuver une demande interne (DIRECTEUR)
 */
export async function approveInternalRequestAction(
  input: ApproveInternalRequestInput
): Promise<ActionResponse> {
  try {
    // Vérifier l'authentification
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Non authentifié" };
    }

    // Vérifier le rôle (DIRECTEUR uniquement)
    if (session.user.role !== Role.DIRECTEUR) {
      return {
        success: false,
        error: "Accès refusé. Réservé au directeur.",
      };
    }

    // Valider les données
    const validated = approveInternalRequestSchema.parse(input);

    // Vérifier que la demande existe
    const internalRequest = await prisma.internalRequest.findUnique({
      where: { id: validated.internalRequestId },
      include: { requestedBy: true },
    });

    if (!internalRequest) {
      return { success: false, error: "Demande non trouvée" };
    }

    // Vérifier le statut (doit être PENDING)
    if (internalRequest.status !== InternalStatus.PENDING) {
      return {
        success: false,
        error: "Seules les demandes en attente peuvent être approuvées",
      };
    }

    // Mettre à jour le statut
    const updatedRequest = await prisma.internalRequest.update({
      where: { id: validated.internalRequestId },
      data: { status: InternalStatus.APPROVED },
      include: { requestedBy: true },
    });

  

    // Créer l'approbation
    await prisma.internalApproval.create({
      data: {
        action: "APPROVE",
        comment: validated.comment,
        userId: session.user.id,
        internalRequestId: validated.internalRequestId || "",
      },
    });

    // Logger l'activité
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "InternalRequest",
        entityId: updatedRequest.id,
        userId: session.user.id,
        userName: session.user.name,
        details: {
          action: "approved",
          reference: updatedRequest.reference,
          comment: validated.comment,
        },
      },
    });

    // Envoyer email de notification à l'ACHAT
    const emailData = approvedInternalRequestEmail(
      updatedRequest,
      {
        id: session.user.id,
        name: session.user.name || "",
        email: session.user.email || "",
      } as any,
      validated.comment || undefined
    );
    await sendEmail(emailData);

    revalidatePath("/internal-requests");
    revalidatePath(`/internal-requests/${validated.internalRequestId}`);

    return { success: true, data: updatedRequest };
  } catch (error: any) {
    console.error("Erreur approveInternalRequestAction:", error);

    if (error.name === "ZodError") {
      return { success: false, error: "Données invalides" };
    }

    return { success: false, error: "Erreur lors de l'approbation" };
  }
}

/**
 * 3. Rejeter une demande interne (DIRECTEUR)
 */
export async function rejectInternalRequestAction(
  input: RejectInternalRequestInput
): Promise<ActionResponse> {
  try {
    // Vérifier l'authentification
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Non authentifié" };
    }

    // Vérifier le rôle (DIRECTEUR uniquement)
    if (session.user.role !== Role.DIRECTEUR) {
      return {
        success: false,
        error: "Accès refusé. Réservé au directeur.",
      };
    }

    // Valider les données
    const validated = rejectInternalRequestSchema.parse(input);

    // Vérifier que la demande existe
    const internalRequest = await prisma.internalRequest.findUnique({
      where: { id: validated.internalRequestId },
      include: { requestedBy: true },
    });

    if (!internalRequest) {
      return { success: false, error: "Demande non trouvée" };
    }

    // Vérifier le statut (doit être PENDING)
    if (internalRequest.status !== InternalStatus.PENDING) {
      return {
        success: false,
        error: "Seules les demandes en attente peuvent être rejetées",
      };
    }

    // Mettre à jour le statut
    const updatedRequest = await prisma.internalRequest.update({
      where: { id: validated.internalRequestId },
      data: { status: InternalStatus.REJECTED },
      include: { requestedBy: true },
    });

    // Créer l'approbation (rejet)
    await prisma.internalApproval.create({
      data: {
        action: "REJECT",
        comment: validated.comment,
        userId: session.user.id,
        internalRequestId: validated.internalRequestId || "",
      },
    });

    // Logger l'activité
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "InternalRequest",
        entityId: updatedRequest.id,
        userId: session.user.id,
        userName: session.user.name,
        details: {
          action: "rejected",
          reference: updatedRequest.reference,
          comment: validated.comment,
        },
      },
    });

    // Envoyer email de notification à l'ACHAT
    const emailData = rejectedInternalRequestEmail(
      updatedRequest,
      {
        id: session.user.id,
        name: session.user.name || "",
        email: session.user.email || "",
      } as any,
      validated.comment
    );
    await sendEmail(emailData);

    revalidatePath("/internal-requests");
    revalidatePath(`/internal-requests/${validated.internalRequestId}`);

    return { success: true, data: updatedRequest };
  } catch (error: any) {
    console.error("Erreur rejectInternalRequestAction:", error);

    if (error.name === "ZodError") {
      return { success: false, error: "Données invalides" };
    }

    return { success: false, error: "Erreur lors du rejet" };
  }
}

/**
 * 4. Finaliser une demande interne (ACHAT)
 */
export async function finalizeInternalRequestAction(
  input: FinalizeInternalRequestInput
): Promise<ActionResponse> {
  try {
    // Vérifier l'authentification
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Non authentifié" };
    }

    // Vérifier le rôle (ACHAT uniquement)
    if (session.user.role !== Role.ACHAT) {
      return {
        success: false,
        error: "Accès refusé. Réservé aux responsables achats.",
      };
    }

    // Valider les données
    const validated = finalizeInternalRequestSchema.parse(input);

    // Vérifier que la demande existe
    const internalRequest = await prisma.internalRequest.findUnique({
      where: { id: validated.internalRequestId },
    });

    if (!internalRequest) {
      return { success: false, error: "Demande non trouvée" };
    }

    // Vérifier le statut (doit être APPROVED)
    if (internalRequest.status !== InternalStatus.APPROVED) {
      return {
        success: false,
        error: "Seules les demandes approuvées peuvent être finalisées",
      };
    }

    // Mettre à jour le statut
    const updatedRequest = await prisma.internalRequest.update({
      where: { id: validated.internalRequestId },
      data: { status: InternalStatus.COMPLETED },
    });

    // Logger l'activité
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "InternalRequest",
        entityId: updatedRequest.id,
        userId: session.user.id,
        userName: session.user.name,
        details: {
          action: "finalized",
          reference: updatedRequest.reference,
          status: InternalStatus.COMPLETED,
        },
      },
    });

    revalidatePath("/internal-requests");
    revalidatePath(`/internal-requests/${validated.internalRequestId}`);

    return { success: true, data: updatedRequest };
  } catch (error: any) {
    console.error("Erreur finalizeInternalRequestAction:", error);

    if (error.name === "ZodError") {
      return { success: false, error: "Données invalides" };
    }

    return { success: false, error: "Erreur lors de la finalisation" };
  }
}

/**
 * 5. Ajouter un document (ACHAT)
 */
export async function addInternalDocumentAction(
  input: AddInternalDocumentInput
): Promise<ActionResponse> {
  try {
    // Vérifier l'authentification
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Non authentifié" };
    }

    // Vérifier le rôle (ACHAT uniquement)
    if (session.user.role !== Role.ACHAT) {
      return {
        success: false,
        error: "Accès refusé. Réservé aux responsables achats.",
      };
    }

    // Valider les données
    const validated = addInternalDocumentSchema.parse(input);

    // Vérifier que la demande existe et est en APPROVED
    const internalRequest = await prisma.internalRequest.findUnique({
      where: { id: validated.internalRequestId },
    });

    if (!internalRequest) {
      return { success: false, error: "Demande non trouvée" };
    }

    if (internalRequest.status !== InternalStatus.APPROVED) {
      return {
        success: false,
        error: "Seules les demandes approuvées peuvent recevoir des documents",
      };
    }

    // Créer le document
    const document = await prisma.internalDocument.create({
      data: {
        name: validated.name,
        fileUrl: validated.fileUrl,
        uploadedById: session.user.id,
        internalRequestId: validated.internalRequestId || "",
      },
    });

    // Logger l'activité
    await prisma.activityLog.create({
      data: {
        action: "CREATE",
        entityType: "InternalDocument",
        entityId: document.id,
        userId: session.user.id,
        userName: session.user.name,
        details: {
          internalRequestId: internalRequest.id,
          reference: internalRequest.reference,
          documentName: document.name,
        },
      },
    });

    revalidatePath("/internal-requests");
    revalidatePath(`/internal-requests/${validated.internalRequestId}`);

    return { success: true, data: document };
  } catch (error: any) {
    console.error("Erreur addInternalDocumentAction:", error);

    if (error.name === "ZodError") {
      return { success: false, error: "Données invalides" };
    }

    return { success: false, error: "Erreur lors de l'ajout du document" };
  }
}

/**
 * 6. Supprimer un document (ACHAT)
 */
export async function deleteInternalDocumentAction(
  input: DeleteInternalDocumentInput
): Promise<ActionResponse> {
  try {
    // Vérifier l'authentification
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Non authentifié" };
    }

    // Vérifier le rôle (ACHAT uniquement)
    if (session.user.role !== Role.ACHAT) {
      return {
        success: false,
        error: "Accès refusé. Réservé aux responsables achats.",
      };
    }

    // Valider les données
    const validated = deleteInternalDocumentSchema.parse(input);

    // Vérifier que le document existe
    const document = await prisma.internalDocument.findUnique({
      where: { id: validated.documentId },
      include: { internalRequest: true },
    });

    if (!document) {
      return { success: false, error: "Document non trouvé" };
    }

    // Vérifier que la demande est encore en APPROVED
    if (document.internalRequest.status !== InternalStatus.APPROVED) {
      return {
        success: false,
        error: "Impossible de supprimer un document d'une demande finalisée",
      };
    }

    // Supprimer le document
    await prisma.internalDocument.delete({
      where: { id: validated.documentId },
    });

    // Logger l'activité
    await prisma.activityLog.create({
      data: {
        action: "DELETE",
        entityType: "InternalDocument",
        entityId: validated.documentId || "",
        userId: session.user.id,
        userName: session.user.name,
        details: {
          internalRequestId: document.internalRequestId,
          documentName: document.name,
        },
      },
    });

    revalidatePath("/internal-requests");
    revalidatePath(`/internal-requests/${document.internalRequestId}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur deleteInternalDocumentAction:", error);
    return {
      success: false,
      error: "Erreur lors de la suppression du document",
    };
  }
}