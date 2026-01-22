// src/lib/actions/director.ts

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { Role, RequestStatus } from "@prisma/client";
import {
  validateRequestSchema,
  rejectRequestDirectorSchema,
  type ValidateRequestInput,
  type RejectRequestDirectorInput,
} from "@/lib/validations/director";
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
 * Vérifier que l'utilisateur est un DIRECTEUR
 */
async function checkDirecteurPermission(): Promise<ActionResponse | null> {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Non authentifié" };
  }

  if (session.user.role !== Role.DIRECTEUR) {
    return { success: false, error: "Accès refusé. Réservé aux directeurs." };
  }

  return null;
}

/**
 * Valider une demande d'achat (APPROVED → VALIDATED)
 */
export async function validateRequestAction(
  input: ValidateRequestInput
): Promise<ActionResponse> {
  try {
    // Vérifier les permissions
    const permissionError = await checkDirecteurPermission();
    if (permissionError) return permissionError;

    // Valider les données
    const validated = validateRequestSchema.parse(input);


    // Vérifier que la demande existe
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: validated.purchaseRequestId },
      include: { selectedQuote: true },
    });

    if (!request) {
      return { success: false, error: "Demande non trouvée" };
    }

    if (request.status !== RequestStatus.APPROVED) {
      return {
        success: false,
        error: "Seules les demandes approuvées peuvent être validées",
      };
    }

    // Vérifier qu'un devis a été sélectionné
    if (!request.selectedQuoteId) {
      return {
        success: false,
        error: "Aucun devis sélectionné",
      };
    }

    const session = await auth();

    // Mettre à jour le montant final avec le devis sélectionné
    const totalFinal = request.selectedQuote?.amount || request.totalEstimated;

    // Mettre à jour le statut de la demande
    const updatedRequest = await prisma.purchaseRequest.update({
      where: { id: validated.purchaseRequestId },
      data: {
        status: RequestStatus.VALIDATED,
        totalFinal,
      },
    });

    // Créer une approbation
    await prisma.approval.create({
      data: {
        action: "APPROVE",
        comment: validated.comment || null,
        role: Role.DIRECTEUR,
        userId: session?.user?.id || "",
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
          action: "validated",
          reference: updatedRequest.reference,
          status: RequestStatus.VALIDATED,
        },
      },
    });

    revalidatePath("/requests");
    revalidatePath(`/requests/${validated.purchaseRequestId}`);

    return { success: true, data: updatedRequest };
  } catch (error: any) {
    console.error("Erreur validateRequestAction:", error);

    if (error.name === "ZodError") {
      return { success: false, error: "Données invalides" };
    }

    return { success: false, error: "Erreur lors de la validation" };
  }
}

/**
 * Rejeter une demande d'achat (APPROVED → REJECTED)
 */
export async function rejectRequestDirectorAction(
  input: RejectRequestDirectorInput
): Promise<ActionResponse> {
  try {
    // Vérifier les permissions
    const permissionError = await checkDirecteurPermission();
    if (permissionError) return permissionError;

    // Valider les données
    const validated = rejectRequestDirectorSchema.parse(input);


    // Vérifier que la demande existe
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: validated.purchaseRequestId },
    });

    if (!request) {
      return { success: false, error: "Demande non trouvée" };
    }

    if (request.status !== RequestStatus.APPROVED) {
      return {
        success: false,
        error: "Seules les demandes approuvées peuvent être rejetées",
      };
    }

    const session = await auth();

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
        role: Role.DIRECTEUR,
        userId: session?.user?.id || "",
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
    console.error("Erreur rejectRequestDirectorAction:", error);

    if (error.name === "ZodError") {
      return { success: false, error: "Données invalides" };
    }

    return { success: false, error: "Erreur lors du rejet" };
  }
}