// src/lib/actions/department.ts

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  toggleDepartmentStatusSchema,
  deleteDepartmentSchema,
  type CreateDepartmentInput,
  type UpdateDepartmentInput,
  type ToggleDepartmentStatusInput,
  type DeleteDepartmentInput,
} from "@/lib/validations/department";
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
 * Récupérer tous les départements
 */
export async function getDepartmentsAction(): Promise<ActionResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Non authentifié" };
    }



    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            users: true,
            purchaseRequests: true,
          },
        },
      },
    });

    return { success: true, data: departments };
  } catch (error) {
    console.error("Erreur getDepartmentsAction:", error);
    return { success: false, error: "Erreur lors de la récupération des départements" };
  }
}

/**
 * Créer un nouveau département
 */
export async function createDepartmentAction(
  input: CreateDepartmentInput
): Promise<ActionResponse> {
  try {
    // Vérifier les permissions
    const permissionError = await checkDirecteurPermission();
    if (permissionError) return permissionError;

    // Valider les données
    const validated = createDepartmentSchema.parse(input);



    // Vérifier l'unicité du code
    const existingDepartment = await prisma.department.findUnique({
      where: { code: validated.code },
    });

    if (existingDepartment) {
      return { success: false, error: "Un département avec ce code existe déjà" };
    }

    // Créer le département
    const department = await prisma.department.create({
      data: {
        name: validated.name,
        code: validated.code,
        description: validated.description || null,
        isActive: true,
      },
    });

    // Logger l'activité
    await prisma.activityLog.create({
      data: {
        action: "CREATE",
        entityType: "Department",
        entityId: department.id,
        details: {
          name: department.name,
          code: department.code,
        },
      },
    });

    revalidatePath("/departments");

    return { success: true, data: department };
  } catch (error: any) {
    console.error("Erreur createDepartmentAction:", error);

    if (error.name === "ZodError") {
      return { success: false, error: "Données invalides" };
    }

    return { success: false, error: "Erreur lors de la création du département" };
  }
}

/**
 * Modifier un département existant
 */
export async function updateDepartmentAction(
  input: UpdateDepartmentInput
): Promise<ActionResponse> {
  try {
    // Vérifier les permissions
    const permissionError = await checkDirecteurPermission();
    if (permissionError) return permissionError;

    // Valider les données
    const validated = updateDepartmentSchema.parse(input);



    // Vérifier que le département existe
    const existingDepartment = await prisma.department.findUnique({
      where: { id: validated.id },
    });

    if (!existingDepartment) {
      return { success: false, error: "Département non trouvé" };
    }

    // Vérifier l'unicité du code (si modifié)
    if (validated.code !== existingDepartment.code) {
      const codeExists = await prisma.department.findUnique({
        where: { code: validated.code },
      });

      if (codeExists) {
        return { success: false, error: "Un département avec ce code existe déjà" };
      }
    }

    // Mettre à jour le département
    const department = await prisma.department.update({
      where: { id: validated.id },
      data: {
        name: validated.name,
        code: validated.code,
        description: validated.description || null,
        isActive: validated.isActive ?? existingDepartment.isActive,
      },
    });

    // Logger l'activité
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "Department",
        entityId: department.id,
        details: {
          name: department.name,
          code: department.code,
        },
      },
    });

    revalidatePath("/departments");

    return { success: true, data: department };
  } catch (error: any) {
    console.error("Erreur updateDepartmentAction:", error);

    if (error.name === "ZodError") {
      return { success: false, error: "Données invalides" };
    }

    return { success: false, error: "Erreur lors de la modification du département" };
  }
}

/**
 * Basculer le statut actif/inactif d'un département
 */
export async function toggleDepartmentStatusAction(
  input: ToggleDepartmentStatusInput
): Promise<ActionResponse> {
  try {
    // Vérifier les permissions
    const permissionError = await checkDirecteurPermission();
    if (permissionError) return permissionError;

    // Valider les données
    const validated = toggleDepartmentStatusSchema.parse(input);


    // Mettre à jour le statut
    const department = await prisma.department.update({
      where: { id: validated.id },
      data: { isActive: validated.isActive },
    });

    // Logger l'activité
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "Department",
        entityId: department.id,
        details: {
          action: validated.isActive ? "activated" : "deactivated",
          name: department.name,
        },
      },
    });

    revalidatePath("/departments");

    return { success: true, data: department };
  } catch (error) {
    console.error("Erreur toggleDepartmentStatusAction:", error);
    return { success: false, error: "Erreur lors du changement de statut" };
  }
}

/**
 * Supprimer un département
 */
export async function deleteDepartmentAction(
  input: DeleteDepartmentInput
): Promise<ActionResponse> {
  try {
    // Vérifier les permissions
    const permissionError = await checkDirecteurPermission();
    if (permissionError) return permissionError;

    // Valider les données
    const validated = deleteDepartmentSchema.parse(input);



    // Vérifier que le département existe
    const department = await prisma.department.findUnique({
      where: { id: validated.id },
      include: {
        _count: {
          select: {
            users: true,
            purchaseRequests: true,
          },
        },
      },
    });

    if (!department) {
      return { success: false, error: "Département non trouvé" };
    }

    // Empêcher la suppression si des utilisateurs sont associés
    if (department._count.users > 0) {
      return {
        success: false,
        error: `Impossible de supprimer. ${department._count.users} utilisateur(s) sont associés à ce département.`,
      };
    }

    // Empêcher la suppression si des demandes d'achat existent
    if (department._count.purchaseRequests > 0) {
      return {
        success: false,
        error: `Impossible de supprimer. ${department._count.purchaseRequests} demande(s) d'achat sont associées à ce département.`,
      };
    }

    // Supprimer le département
    await prisma.department.delete({
      where: { id: validated.id },
    });

    // Logger l'activité
    await prisma.activityLog.create({
      data: {
        action: "DELETE",
        entityType: "Department",
        entityId: validated.id,
        details: {
          name: department.name,
          code: department.code,
        },
      },
    });

    revalidatePath("/departments");

    return { success: true };
  } catch (error) {
    console.error("Erreur deleteDepartmentAction:", error);
    return { success: false, error: "Erreur lors de la suppression du département" };
  }
}