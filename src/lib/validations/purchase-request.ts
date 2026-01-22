
import { z } from "zod";
import { RequestStatus } from "@prisma/client";

/**
 * Schéma de validation pour un item d'achat
 */
export const purchaseItemSchema = z.object({
  id: z.string().optional(), // Pour l'édition
  name: z
    .string()
    .min(1, "Le nom de l'article est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(200, "Le nom ne peut pas dépasser 200 caractères")
    .trim(),
  description: z
    .string()
    .max(1000, "La description ne peut pas dépasser 1000 caractères")
    .optional()
    .nullable(),
  quantity: z
    .number({
      error: "La quantité est requise",
    //   invalid_type_error: "La quantité doit être un nombre",
    })
    .int("La quantité doit être un nombre entier")
    .positive("La quantité doit être supérieure à 0")
    .max(999999, "La quantité ne peut pas dépasser 999999"),
  estimatedPrice: z
    .number({
      error: "Le prix estimé est requis",
    //   invalid_type_error: "Le prix doit être un nombre",
    })
    .nonnegative("Le prix ne peut pas être négatif")
    .max(999999999, "Le prix ne peut pas dépasser 999999999"),
});

/**
 * Schéma de validation pour créer une demande d'achat
 */
export const createPurchaseRequestSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre est requis")
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(200, "Le titre ne peut pas dépasser 200 caractères")
    .trim(),
  description: z
    .string()
    .max(2000, "La description ne peut pas dépasser 2000 caractères")
    .optional()
    .nullable(),
  items: z
    .array(purchaseItemSchema)
    .min(1, "Au moins un article est requis")
    .max(50, "Maximum 50 articles par demande"),
});

/**
 * Schéma de validation pour modifier une demande d'achat
 */
export const updatePurchaseRequestSchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .min(1, "Le titre est requis")
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(200, "Le titre ne peut pas dépasser 200 caractères")
    .trim(),
  description: z
    .string()
    .max(2000, "La description ne peut pas dépasser 2000 caractères")
    .optional()
    .nullable(),
  items: z
    .array(purchaseItemSchema)
    .min(1, "Au moins un article est requis")
    .max(50, "Maximum 50 articles par demande"),
});

/**
 * Schéma de validation pour soumettre une demande
 */
export const submitPurchaseRequestSchema = z.object({
  id: z.string().optional(),
});

/**
 * Schéma de validation pour supprimer une demande
 */
export const deletePurchaseRequestSchema = z.object({
  id: z.string().optional(),
});

/**
 * Types TypeScript inférés des schémas
 */
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>;
export type CreatePurchaseRequestInput = z.infer<typeof createPurchaseRequestSchema>;
export type UpdatePurchaseRequestInput = z.infer<typeof updatePurchaseRequestSchema>;
export type SubmitPurchaseRequestInput = z.infer<typeof submitPurchaseRequestSchema>;
export type DeletePurchaseRequestInput = z.infer<typeof deletePurchaseRequestSchema>;

/**
 * Labels des statuts en français
 */
export const statusLabels: Record<RequestStatus, string> = {
    DRAFT: "Brouillon",
    PENDING: "En attente",
    APPROVED: "Approuvé",
    VALIDATED: "Validé",
    COMPLETED: "Finalisé",
    REJECTED: "Rejeté",
    QUOTED: "QUOTED"
};

/**
 * Descriptions des statuts
 */
export const statusDescriptions: Record<RequestStatus, string> = {
    DRAFT: "Demande en cours de rédaction, non soumise",
    PENDING: "En attente de validation par le service Achats",
    APPROVED: "Approuvé par le service Achats, en attente du Directeur",
    VALIDATED: "Validé par le Directeur, en attente de finalisation",
    COMPLETED: "Achat finalisé par le Comptable",
    REJECTED: "Demande rejetée",
    QUOTED: ""
};

/**
 * Couleurs des badges par statut
 */
export const statusColors: Record<RequestStatus, string> = {
    DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    VALIDATED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    QUOTED: ""
};

/**
 * Actions possibles selon le statut et le rôle
 */
export const getAvailableActions = (status: RequestStatus, userRole: string) => {
  const actions: string[] = [];

  // Actions pour l'utilisateur (USER)
  if (userRole === "USER") {
    if (status === "DRAFT") {
      actions.push("edit", "submit", "delete");
    }
    // L'utilisateur peut toujours voir les détails
    actions.push("view");
  }

  // Actions pour le service ACHAT
  if (userRole === "ACHAT") {
    if (status === "PENDING") {
      actions.push("add_quotes", "approve", "reject");
    }
    actions.push("view");
  }

  // Actions pour le DIRECTEUR
  if (userRole === "DIRECTEUR") {
    if (status === "APPROVED") {
      actions.push("validate", "reject");
    }
    actions.push("view");
  }

  // Actions pour le COMPTABLE
  if (userRole === "COMPTABLE") {
    if (status === "VALIDATED") {
      actions.push("finalize", "add_documents");
    }
    actions.push("view");
  }

  return actions;
};