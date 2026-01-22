
import { z } from "zod";
import { InternalCategory } from "@prisma/client";

/**
 * Schéma de validation pour créer une demande interne
 */
export const createInternalRequestSchema = z.object({
  title: z
    .string()
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(200, "Le titre ne peut pas dépasser 200 caractères")
    .trim(),
  description: z
    .string()
    .max(1000, "La description ne peut pas dépasser 1000 caractères")
    .trim()
    .optional()
    .nullable(),
  category: z.enum(InternalCategory),
  amount: z
    .number()
    .positive("Le montant doit être positif")
    .max(999999999, "Le montant ne peut pas dépasser 999,999,999 XOF"),
});

/**
 * Schéma de validation pour approuver une demande
 */
export const approveInternalRequestSchema = z.object({
  internalRequestId: z.string().optional(),
  comment: z
    .string()
    .max(500, "Le commentaire ne peut pas dépasser 500 caractères")
    .trim()
    .optional()
    .nullable(),
});

/**
 * Schéma de validation pour rejeter une demande
 */
export const rejectInternalRequestSchema = z.object({
  internalRequestId: z.string().optional(),
  comment: z
    .string()
    .min(10, "Le motif doit contenir au moins 10 caractères")
    .max(500, "Le motif ne peut pas dépasser 500 caractères")
    .trim(),
});

/**
 * Schéma de validation pour finaliser une demande
 */
export const finalizeInternalRequestSchema = z.object({
  internalRequestId: z.string().optional(),
});

/**
 * Schéma de validation pour ajouter un document
 */
export const addInternalDocumentSchema = z.object({
  internalRequestId: z.string().optional(),
  name: z
    .string()
    .min(1, "Le nom du document est requis")
    .max(200, "Le nom ne peut pas dépasser 200 caractères")
    .trim(),
  fileUrl: z.string()
});

/**
 * Schéma de validation pour supprimer un document
 */
export const deleteInternalDocumentSchema = z.object({
  documentId: z.string().optional(),
});

/**
 * Types TypeScript inférés des schémas
 */
export type CreateInternalRequestInput = z.infer<typeof createInternalRequestSchema>;
export type ApproveInternalRequestInput = z.infer<typeof approveInternalRequestSchema>;
export type RejectInternalRequestInput = z.infer<typeof rejectInternalRequestSchema>;
export type FinalizeInternalRequestInput = z.infer<typeof finalizeInternalRequestSchema>;
export type AddInternalDocumentInput = z.infer<typeof addInternalDocumentSchema>;
export type DeleteInternalDocumentInput = z.infer<typeof deleteInternalDocumentSchema>;

/**
 * Labels des catégories en français
 */
export const internalCategoryLabels: Record<InternalCategory, string> = {
  INTERNET: "Internet",
  ELECTRICITY: "Électricité",
  WATER: "Eau",
  PHONE: "Téléphone",
  COFFEE: "Café / Thé",
  OFFICE_SUPPLIES: "Fournitures bureau",
  MAINTENANCE: "Maintenance",
  CLEANING: "Nettoyage",
  OTHER: "Autre",
};

/**
 * Icônes des catégories (pour l'UI)
 */
export const internalCategoryIcons: Record<InternalCategory, string> = {
  INTERNET: "🌐",
  ELECTRICITY: "⚡",
  WATER: "💧",
  PHONE: "📱",
  COFFEE: "☕",
  OFFICE_SUPPLIES: "📎",
  MAINTENANCE: "🔧",
  CLEANING: "🧹",
  OTHER: "📋",
};