
import { z } from "zod";
import { Role } from "@prisma/client";

/**
 * Schéma de validation pour la création d'un utilisateur
 */
export const createUserSchema = z.object({
  email: z
    .email(),
  name: z
    .string()
    .min(1, "Le nom est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .trim(),
  password: z
    .string()
    .min(1, "Le mot de passe est requis")
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(100, "Le mot de passe ne peut pas dépasser 100 caractères"),
  role: z.enum(Role,{ message: "Rôle invalide" }),
  departmentId: z
    .string()
    .optional()
    .nullable(),
  isActive: z.boolean(),
});

/**
 * Schéma de validation pour la modification d'un utilisateur
 */
export const updateUserSchema = z.object({
  id: z.string().optional(),
  email: z
    .email(),
  name: z
    .string()
    .min(1, "Le nom est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .trim(),
    
  role: z.enum(Role,{ message: "Rôle invalide" }),
  departmentId: z
    .string()
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});

/**
 * Schéma de validation pour le changement de mot de passe
 */
export const changePasswordSchema = z
  .object({
    id: z.string().optional(),
    newPassword: z
      .string()
      .min(1, "Le nouveau mot de passe est requis")
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .max(100, "Le mot de passe ne peut pas dépasser 100 caractères"),
    confirmPassword: z.string().min(1, "Veuillez confirmer le mot de passe"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

/**
 * Schéma de validation pour basculer le statut actif/inactif
 */
export const toggleUserStatusSchema = z.object({
  id: z.string().optional(),
  isActive: z.boolean(),
});

/**
 * Schéma de validation pour la suppression
 */
export const deleteUserSchema = z.object({
  id: z.string().optional(),
});

/**
 * Types TypeScript inférés des schémas
 */
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ToggleUserStatusInput = z.infer<typeof toggleUserStatusSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;

/**
 * Labels des rôles en français
 */
export const roleLabels: Record<Role, string> = {
  DIRECTEUR: "Directeur",
  ACHAT: "Service Achats",
  COMPTABLE: "Comptable",
  USER: "Utilisateur",
};

/**
 * Descriptions des rôles
 */
export const roleDescriptions: Record<Role, string> = {
  DIRECTEUR: "Accès complet : gestion des utilisateurs, départements, validation finale des achats",
  ACHAT: "Gestion des devis et validation des demandes d'achat",
  COMPTABLE: "Finalisation des achats et gestion des pièces comptables",
  USER: "Création et suivi des demandes d'achat pour son département",
};