
import { z } from "zod";

/**
 * Schéma de validation pour ajouter un devis
 */
export const addQuoteSchema = z.object({
  purchaseRequestId: z.string().optional(),
  supplierName: z
    .string()
    .min(1, "Le nom du fournisseur est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(200, "Le nom ne peut pas dépasser 200 caractères")
    .trim(),
  supplierContact: z
    .string()
    .max(200, "Le contact ne peut pas dépasser 200 caractères")
    .optional()
    .nullable(),
  totalAmount: z
    .number({
      error: "Le montant total est requis",
    //   invalid_type_error: "Le montant doit être un nombre",
    })
    .positive("Le montant doit être supérieur à 0")
    .max(999999999, "Le montant ne peut pas dépasser 999999999"),
  validUntil: z
    .string()
    .min(1, "La date de validité est requise")
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, "La date de validité doit être dans le futur"),
  notes: z
    .string()
    .max(1000, "Les notes ne peuvent pas dépasser 1000 caractères")
    .optional()
    .nullable(),
});

/**
 * Schéma de validation pour sélectionner un devis
 */
export const selectQuoteSchema = z.object({
  purchaseRequestId: z.string().optional(),
  quoteId: z.string().optional(),
});

/**
 * Schéma de validation pour approuver une demande
 */
export const approveRequestSchema = z.object({
  purchaseRequestId: z.string().optional(),
  comment: z
    .string()
    .max(1000, "Le commentaire ne peut pas dépasser 1000 caractères")
    .optional()
    .nullable(),
});

/**
 * Schéma de validation pour rejeter une demande
 */
export const rejectRequestSchema = z.object({
  purchaseRequestId: z.string().optional(),
  comment: z
    .string()
    .min(1, "Un commentaire est requis pour le rejet")
    .min(10, "Le commentaire doit contenir au moins 10 caractères")
    .max(1000, "Le commentaire ne peut pas dépasser 1000 caractères")
    .trim(),
});

/**
 * Schéma de validation pour supprimer un devis
 */
export const deleteQuoteSchema = z.object({
  quoteId: z.string().optional(),
});

/**
 * Types TypeScript inférés des schémas
 */
export type AddQuoteInput = z.infer<typeof addQuoteSchema>;
export type SelectQuoteInput = z.infer<typeof selectQuoteSchema>;
export type ApproveRequestInput = z.infer<typeof approveRequestSchema>;
export type RejectRequestInput = z.infer<typeof rejectRequestSchema>;
export type DeleteQuoteInput = z.infer<typeof deleteQuoteSchema>;