// src/lib/actions/user.ts

"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  toggleUserStatusSchema,
  deleteUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type ChangePasswordInput,
  type ToggleUserStatusInput,
  type DeleteUserInput,
} from "@/lib/validations/user";
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

  return null; // Pas d'erreur
}

/**
 * Récupérer tous les utilisateurs
 */
export async function getUsersAction(): Promise<ActionResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Non authentifié" };
    }

    // Seul le DIRECTEUR peut voir tous les utilisateurs
    if (session.user.role !== Role.DIRECTEUR) {
      return { success: false, error: "Accès refusé" };
    }

    // Import dynamique de Prisma

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            purchaseRequests: true,
            approvals: true,
          },
        },
      },
    });

    // Masquer les mots de passe
    const usersWithoutPassword = users.map(({ password, ...user }) => user);

    return { success: true, data: usersWithoutPassword };
  } catch (error) {
    console.error("Erreur getUsersAction:", error);
    return { success: false, error: "Erreur lors de la récupération des utilisateurs" };
  }
}

/**
 * Récupérer les départements (pour le formulaire)
 */
export async function getDepartmentsForSelectAction(): Promise<ActionResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Non authentifié" };
    }

    // Import dynamique de Prisma

    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    return { success: true, data: departments };
  } catch (error) {
    console.error("Erreur getDepartmentsForSelectAction:", error);
    return { success: false, error: "Erreur lors de la récupération des départements" };
  }
}

/**
 * Créer un nouveau utilisateur
 */
export async function createUserAction(input: CreateUserInput): Promise<ActionResponse> {
  try {
    // Vérifier les permissions
    const permissionError = await checkDirecteurPermission();
    if (permissionError) return permissionError;

    // Valider les données
    const validated = createUserSchema.parse(input);



    // Vérifier l'unicité de l'email
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return { success: false, error: "Un utilisateur avec cet email existe déjà" };
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(validated.password, 12);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        name: validated.name,
        password: hashedPassword,
        role: validated.role,
        departmentId: validated.departmentId || null,
        isActive: validated.isActive ?? true,
      },
      include: {
        department: true,
      },
    });

    // Logger l'activité
    const session = await auth();
    await prisma.activityLog.create({
      data: {
        action: "CREATE",
        entityType: "User",
        entityId: user.id,
        userId: session?.user?.id,
        userName: session?.user?.name,
        details: {
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });

    revalidatePath("/users");

    // Retourner sans le mot de passe
    const { password, ...userWithoutPassword } = user;
    return { success: true, data: userWithoutPassword };
  } catch (error: any) {
    console.error("Erreur createUserAction:", error);

    if (error.name === "ZodError") {
      return { success: false, error: "Données invalides" };
    }

    return { success: false, error: "Erreur lors de la création de l'utilisateur" };
  }
}

/**
 * Modifier un utilisateur existant
 */
export async function updateUserAction(input: UpdateUserInput): Promise<ActionResponse> {
  try {
    // Vérifier les permissions
    const permissionError = await checkDirecteurPermission();
    if (permissionError) return permissionError;

    // Valider les données
    const validated = updateUserSchema.parse(input);

    // Import dynamique de Prisma

    // Récupérer la session pour empêcher l'auto-modification
    const session = await auth();

    // Empêcher le directeur de se désactiver lui-même
    if (
      validated.id === session?.user?.id &&
      validated.isActive === false
    ) {
      return {
        success: false,
        error: "Vous ne pouvez pas désactiver votre propre compte",
      };
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: validated.id },
    });

    if (!existingUser) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    // Vérifier l'unicité de l'email (si modifié)
    if (validated.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validated.email },
      });

      if (emailExists) {
        return { success: false, error: "Un utilisateur avec cet email existe déjà" };
      }
    }

    // Mettre à jour l'utilisateur
    const user = await prisma.user.update({
      where: { id: validated.id },
      data: {
        email: validated.email,
        name: validated.name,
        role: validated.role,
        departmentId: validated.departmentId || null,
        isActive: validated.isActive ?? existingUser.isActive,
      },
      include: {
        department: true,
      },
    });

    // Logger l'activité
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "User",
        entityId: user.id,
        userId: session?.user?.id,
        userName: session?.user?.name,
        details: {
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });

    revalidatePath("/users");

    // Retourner sans le mot de passe
    const { password, ...userWithoutPassword } = user;
    return { success: true, data: userWithoutPassword };
  } catch (error: any) {
    console.error("Erreur updateUserAction:", error);

    if (error.name === "ZodError") {
      return { success: false, error: "Données invalides" };
    }

    return { success: false, error: "Erreur lors de la modification de l'utilisateur" };
  }
}

/**
 * Changer le mot de passe d'un utilisateur
 */
export async function changePasswordAction(
  input: ChangePasswordInput
): Promise<ActionResponse> {
  try {
    // Vérifier les permissions
    const permissionError = await checkDirecteurPermission();
    if (permissionError) return permissionError;

    // Valider les données
    const validated = changePasswordSchema.parse(input);

    // Import dynamique de Prisma

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(validated.newPassword, 12);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: validated.id },
      data: { password: hashedPassword },
    });

    // Logger l'activité
    const session = await auth();
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "User",
        entityId: validated.id,
        userId: session?.user?.id,
        userName: session?.user?.name,
        details: {
          action: "password_changed",
        },
      },
    });

    revalidatePath("/users");

    return { success: true };
  } catch (error: any) {
    console.error("Erreur changePasswordAction:", error);

    if (error.name === "ZodError") {
      return { success: false, error: "Données invalides" };
    }

    return { success: false, error: "Erreur lors du changement de mot de passe" };
  }
}

/**
 * Basculer le statut actif/inactif d'un utilisateur
 */
export async function toggleUserStatusAction(
  input: ToggleUserStatusInput
): Promise<ActionResponse> {
  try {
    // Vérifier les permissions
    const permissionError = await checkDirecteurPermission();
    if (permissionError) return permissionError;

    // Valider les données
    const validated = toggleUserStatusSchema.parse(input);

    // Récupérer la session
    const session = await auth();

    // Empêcher l'auto-désactivation
    if (validated.id === session?.user?.id && !validated.isActive) {
      return {
        success: false,
        error: "Vous ne pouvez pas désactiver votre propre compte",
      };
    }

    // Import dynamique de Prisma

    // Mettre à jour le statut
    const user = await prisma.user.update({
      where: { id: validated.id },
      data: { isActive: validated.isActive },
    });

    // Logger l'activité
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "User",
        entityId: user.id,
        userId: session?.user?.id,
        userName: session?.user?.name,
        details: {
          action: validated.isActive ? "activated" : "deactivated",
          email: user.email,
        },
      },
    });

    revalidatePath("/users");

    return { success: true, data: user };
  } catch (error) {
    console.error("Erreur toggleUserStatusAction:", error);
    return { success: false, error: "Erreur lors du changement de statut" };
  }
}

/**
 * Supprimer un utilisateur
 */
export async function deleteUserAction(input: DeleteUserInput): Promise<ActionResponse> {
  try {
    // Vérifier les permissions
    const permissionError = await checkDirecteurPermission();
    if (permissionError) return permissionError;

    // Valider les données
    const validated = deleteUserSchema.parse(input);

    // Récupérer la session
    const session = await auth();

    // Empêcher l'auto-suppression
    if (validated.id === session?.user?.id) {
      return {
        success: false,
        error: "Vous ne pouvez pas supprimer votre propre compte",
      };
    }

    // Import dynamique de Prisma

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: validated.id },
      include: {
        _count: {
          select: {
            purchaseRequests: true,
            approvals: true,
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    // Empêcher la suppression si des demandes d'achat existent
    if (user._count.purchaseRequests > 0) {
      return {
        success: false,
        error: `Impossible de supprimer. ${user._count.purchaseRequests} demande(s) d'achat sont associées à cet utilisateur.`,
      };
    }

    // Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id: validated.id },
    });

    // Logger l'activité
    await prisma.activityLog.create({
      data: {
        action: "DELETE",
        entityType: "User",
        entityId: validated.id,
        userId: session?.user?.id,
        userName: session?.user?.name,
        details: {
          email: user.email,
          name: user.name,
        },
      },
    });

    revalidatePath("/users");

    return { success: true };
  } catch (error) {
    console.error("Erreur deleteUserAction:", error);
    return { success: false, error: "Erreur lors de la suppression de l'utilisateur" };
  }
}