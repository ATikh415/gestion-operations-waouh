
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { Role, RequestStatus } from "@prisma/client";
import {
  addQuoteSchema,
  selectQuoteSchema,
  approveRequestSchema,
  rejectRequestSchema,
  deleteQuoteSchema,
  type AddQuoteInput,
  type SelectQuoteInput,
  type ApproveRequestInput,
  type RejectRequestInput,
  type DeleteQuoteInput,
} from "@/lib/validations/quote";
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
 * Vérifier que l'utilisateur est du service ACHAT
 */
async function checkAchatPermission(): Promise<ActionResponse | null> {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Non authentifié" };
  }

  if (session.user.role !== Role.ACHAT && session.user.role !== Role.DIRECTEUR) {
    return { success: false, error: "Accès refusé. Réservé au service Achats." };
  }

  return null;
}

/**
 * Ajouter un devis à une demande d'achat
 */
export async function addQuoteAction(input: AddQuoteInput): Promise<ActionResponse> {
  try {
    // Vérifier les permissions
    const permissionError = await checkAchatPermission();
    if (permissionError) return permissionError;

    // Valider les données
    const validated = addQuoteSchema.parse(input);

    // Import dynamique de Prisma

    // Vérifier que la demande existe et est en PENDING
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: validated.purchaseRequestId },
      include: { quotes: true },
    });

    if (!request) {
      return { success: false, error: "Demande non trouvée" };
    }

    if (request.status !== RequestStatus.PENDING) {
      return {
        success: false,
        error: "Seules les demandes en attente peuvent recevoir des devis",
      };
    }

    // Créer le devis
    const quote = await prisma.quote.create({
      data: {
        supplierName: validated.supplierName,
        supplierContact: validated.supplierContact || null,
        amount: validated.totalAmount,
        validUntil: new Date(validated.validUntil),
        // : validated.notes || null,
        purchaseRequestId: validated.purchaseRequestId,
      },
    });

    // Logger l'activité
    const session = await auth();
    await prisma.activityLog.create({
      data: {
        action: "CREATE",
        entityType: "Quote",
        entityId: quote.id,
        userId: session?.user?.id,
        userName: session?.user?.name,
        details: {
          purchaseRequestId: request.id,
          reference: request.reference,
          supplierName: quote.supplierName,
          amount: quote.amount,
        },
      },
    });

    revalidatePath("/requests");
    revalidatePath(`/requests/${validated.purchaseRequestId}`);

    return { success: true, data: quote };
  } catch (error: any) {
    console.error("Erreur addQuoteAction:", error);

    if (error.name === "ZodError") {
      return { success: false, error: "Données invalides" };
    }

    return { success: false, error: "Erreur lors de l'ajout du devis" };
  }
}

/**
 * Sélectionner le meilleur devis
 */
export async function selectQuoteAction(
  input: SelectQuoteInput
): Promise<ActionResponse> {
  try {
    // Vérifier les permissions
    const permissionError = await checkAchatPermission();
    if (permissionError) return permissionError;

    // Valider les données
    const validated = selectQuoteSchema.parse(input);

    // Import dynamique de Prisma

    // Vérifier que la demande existe
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: validated.purchaseRequestId },
      include: { quotes: true },
    });

    if (!request) {
      return { success: false, error: "Demande non trouvée" };
    }

    if (request.status !== RequestStatus.PENDING) {
      return {
        success: false,
        error: "Seules les demandes en attente peuvent avoir un devis sélectionné",
      };
    }

    // Vérifier que le devis existe
    const quote = request.quotes.find((q) => q.id === validated.quoteId);
    if (!quote) {
      return { success: false, error: "Devis non trouvé" };
    }

    // Mettre à jour la demande avec le devis sélectionné
    const updatedRequest = await prisma.purchaseRequest.update({
      where: { id: validated.purchaseRequestId },
      data: { selectedQuoteId: validated.quoteId },
    });

    // Logger l'activité
    const session = await auth();
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "PurchaseRequest",
        entityId: updatedRequest.id,
        userId: session?.user?.id,
        userName: session?.user?.name,
        details: {
          action: "quote_selected",
          reference: updatedRequest.reference,
          quoteId: validated.quoteId,
          supplierName: quote.supplierName,
        },
      },
    });

    revalidatePath("/requests");
    revalidatePath(`/requests/${validated.purchaseRequestId}`);

    return { success: true, data: updatedRequest };
  } catch (error: any) {
    console.error("Erreur selectQuoteAction:", error);

    if (error.name === "ZodError") {
      return { success: false, error: "Données invalides" };
    }

    return { success: false, error: "Erreur lors de la sélection du devis" };
  }
}

/**
 * Approuver une demande d'achat (PENDING → APPROVED)
 */
export async function approveRequestAction(
  input: ApproveRequestInput
): Promise<ActionResponse> {
  try {
    // Vérifier les permissions
    const permissionError = await checkAchatPermission();
    if (permissionError) return permissionError;

    // Valider les données
    const validated = approveRequestSchema.parse(input);

    // Import dynamique de Prisma

    // Vérifier que la demande existe
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: validated.purchaseRequestId },
      include: { quotes: true },
    });

    if (!request) {
      return { success: false, error: "Demande non trouvée" };
    }

    if (request.status !== RequestStatus.PENDING) {
      return {
        success: false,
        error: "Seules les demandes en attente peuvent être approuvées",
      };
    }

    // Vérifier qu'au moins 2 devis ont été ajoutés
    if (request.quotes.length < 2) {
      return {
        success: false,
        error: "Au moins 2 devis sont requis avant d'approuver",
      };
    }

    // Vérifier qu'un devis a été sélectionné
    if (!request.selectedQuoteId) {
      return {
        success: false,
        error: "Vous devez sélectionner un devis avant d'approuver",
      };
    }

    const session = await auth();
    console.log({"USER": session?.user.role});
    
    if(!session?.user || !validated.purchaseRequestId){
 return {
        success: false,
        error: "Vous devez sélectionner un devis avant d'approuver",
      };
    }
  // Mettre à jour le statut de la demande
    const updatedRequest = await prisma.purchaseRequest.update({
      where: { id: validated.purchaseRequestId },
      data: { status: RequestStatus.APPROVED },
    });

    // Créer une approbation
    await prisma.approval.create({
      data: {
        action: "APPROVE",
        comment: validated.comment || null,
        userId: session?.user?.id,
        role: session?.user.role,
        purchaseRequestId: validated.purchaseRequestId,
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
          action: "approved",
          reference: updatedRequest.reference,
          status: RequestStatus.APPROVED,
        },
      },
    });

    revalidatePath("/requests");
    revalidatePath(`/requests/${validated.purchaseRequestId}`);

    return { success: true, data: updatedRequest };
    
    
  } catch (error: any) {
    console.error("Erreur approveRequestAction:", error);

    if (error.name === "ZodError") {
      return { success: false, error: "Données invalides" };
    }

    return { success: false, error: "Erreur lors de l'approbation" };
  }
}

/**
 * Rejeter une demande d'achat (PENDING → REJECTED)
 */
export async function rejectRequestAction(
  input: RejectRequestInput
): Promise<ActionResponse> {
  try {
    // Vérifier les permissions
    const permissionError = await checkAchatPermission();
    if (permissionError) return permissionError;

    // Valider les données
    const validated = rejectRequestSchema.parse(input);

    // Import dynamique de Prisma

    // Vérifier que la demande existe
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: validated.purchaseRequestId },
    });

    if (!request) {
      return { success: false, error: "Demande non trouvée" };
    }

    if (request.status !== RequestStatus.PENDING) {
      return {
        success: false,
        error: "Seules les demandes en attente peuvent être rejetées",
      };
    }

    const session = await auth();

    if(!session?.user || !validated.purchaseRequestId){
 return {
        success: false,
        error: "Vous devez sélectionner un devis avant de le rejeter",
      };
    }
    // Mettre à jour le statut de la demande
    const updatedRequest = await prisma.purchaseRequest.update({
      where: { id: validated.purchaseRequestId },
      data: { status: RequestStatus.REJECTED },
    });

    // Créer une approbation avec rejet
    await prisma.approval.create({
      data: {
        action: "REJECT",
        comment: validated.comment,
        userId: session?.user?.id,
        role: session.user.role,
        purchaseRequestId: validated.purchaseRequestId,
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
          action: "rejected",
          reference: updatedRequest.reference,
          status: RequestStatus.REJECTED,
        },
      },
    });

    revalidatePath("/requests");
    revalidatePath(`/requests/${validated.purchaseRequestId}`);

    return { success: true, data: updatedRequest };
  } catch (error: any) {
    console.error("Erreur rejectRequestAction:", error);

    if (error.name === "ZodError") {
      return { success: false, error: "Données invalides" };
    }

    return { success: false, error: "Erreur lors du rejet" };
  }
}

/**
 * Supprimer un devis
 */
export async function deleteQuoteAction(
  input: DeleteQuoteInput
): Promise<ActionResponse> {
  try {
    // Vérifier les permissions
    const permissionError = await checkAchatPermission();
    if (permissionError) return permissionError;

    // Valider les données
    const validated = deleteQuoteSchema.parse(input);

    // Import dynamique de Prisma

    // Vérifier que le devis existe
    const quote = await prisma.quote.findUnique({
      where: { id: validated.quoteId },
      include: { purchaseRequest: true },
    });

    if (!quote) {
      return { success: false, error: "Devis non trouvé" };
    }

    // Vérifier que la demande est encore en PENDING
    if (quote.purchaseRequest.status !== RequestStatus.PENDING) {
      return {
        success: false,
        error: "Impossible de supprimer un devis d'une demande déjà traitée",
      };
    }

    // Vérifier que ce n'est pas le devis sélectionné
    if (quote.purchaseRequest.selectedQuoteId === validated.quoteId) {
      return {
        success: false,
        error: "Impossible de supprimer le devis sélectionné",
      };
    }

    // Supprimer le devis
    await prisma.quote.delete({
      where: { id: validated.quoteId },
    });

    // Logger l'activité
    const session = await auth();
    await prisma.activityLog.create({
      data: {
        action: "DELETE",
        entityType: "Quote",
        entityId: validated.quoteId,
        userId: session?.user?.id,
        userName: session?.user?.name,
        details: {
          purchaseRequestId: quote.purchaseRequestId,
          supplierName: quote.supplierName,
        },
      },
    });

    revalidatePath("/requests");
    revalidatePath(`/requests/${quote.purchaseRequestId}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur deleteQuoteAction:", error);
    return { success: false, error: "Erreur lors de la suppression du devis" };
  }
}