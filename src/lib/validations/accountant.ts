import { z } from "zod";
import { DocumentType } from "@prisma/client";

/**
 * Schéma de validation pour ajouter un document
 */
export const addDocumentSchema = z.object({
  purchaseRequestId: z.string().optional(),
  type: z.enum(DocumentType),
  name: z
    .string()
    .min(1, "Le nom du document est requis")
    .max(200, "Le nom ne peut pas dépasser 200 caractères")
    .trim(),
  fileUrl: z
    .string()
    .min(1, "L'URL du fichier est requise"),
});

/**
 * Schéma de validation pour supprimer un document
 */
export const deleteDocumentSchema = z.object({
  documentId: z.string().optional(),
});

/**
 * Schéma de validation pour finaliser une demande
 */
export const finalizeRequestSchema = z.object({
  purchaseRequestId: z.string().optional(),
});

/**
 * Types TypeScript inférés des schémas
 */
export type AddDocumentInput = z.infer<typeof addDocumentSchema>;
export type DeleteDocumentInput = z.infer<typeof deleteDocumentSchema>;
export type FinalizeRequestInput = z.infer<typeof finalizeRequestSchema>;

/**
 * Labels des types de documents en français
 */
export const documentTypeLabels: Record<DocumentType, string> = {
  RECEIPT: "Reçu de paiement",
  DELIVERY_NOTE: "Bordereau de livraison",
  INVOICE: "Facture",
  OTHER: "Autre",
};