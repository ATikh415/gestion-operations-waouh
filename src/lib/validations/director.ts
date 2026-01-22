
import { z } from "zod";

/**
 * Schéma de validation pour valider une demande (DIRECTEUR)
 */
export const validateRequestSchema = z.object({
  purchaseRequestId: z.string().optional(),
  comment: z
    .string()
    .max(1000, "Le commentaire ne peut pas dépasser 1000 caractères")
    .optional()
    .nullable(),
});

/**
 * Schéma de validation pour rejeter une demande (DIRECTEUR)
 */
export const rejectRequestDirectorSchema = z.object({
  purchaseRequestId: z.string().optional(),
  comment: z
    .string()
    .min(1, "Un commentaire est requis pour le rejet")
    .min(10, "Le commentaire doit contenir au moins 10 caractères")
    .max(1000, "Le commentaire ne peut pas dépasser 1000 caractères")
    .trim(),
});

/**
 * Types TypeScript inférés des schémas
 */
export type ValidateRequestInput = z.infer<typeof validateRequestSchema>;
export type RejectRequestDirectorInput = z.infer<typeof rejectRequestDirectorSchema>;