
import { z } from "zod";

/**
 * Schéma de validation pour la création d'un département
 */
export const createDepartmentSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .trim(),
  code: z
    .string()
    .min(1, "Le code est requis")
    .min(2, "Le code doit contenir au moins 2 caractères")
    .max(10, "Le code ne peut pas dépasser 10 caractères")
    .toUpperCase()
    .regex(/^[A-Z0-9]+$/, "Le code ne peut contenir que des lettres majuscules et des chiffres")
    .trim(),
  description: z
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional()
    .nullable(),
});

/**
 * Schéma de validation pour la modification d'un département
 */
export const updateDepartmentSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, "Le nom est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .trim(),
  code: z
    .string()
    .min(1, "Le code est requis")
    .min(2, "Le code doit contenir au moins 2 caractères")
    .max(10, "Le code ne peut pas dépasser 10 caractères")
    .toUpperCase()
    .regex(/^[A-Z0-9]+$/, "Le code ne peut contenir que des lettres majuscules et des chiffres")
    .trim(),
  description: z
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});

/**
 * Schéma de validation pour basculer le statut actif/inactif
 */
export const toggleDepartmentStatusSchema = z.object({
  id: z.string().optional(),
  isActive: z.boolean(),
});

/**
 * Schéma de validation pour la suppression
 */
export const deleteDepartmentSchema = z.object({
  id: z.string().optional(),
});

/**
 * Types TypeScript inférés des schémas
 */
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type ToggleDepartmentStatusInput = z.infer<typeof toggleDepartmentStatusSchema>;
export type DeleteDepartmentInput = z.infer<typeof deleteDepartmentSchema>;