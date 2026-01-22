
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import {
  companySettingsSchema,
  type CompanySettingsInput,
} from "@/lib/validations/settings";
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

  return null; // Pas d'erreur
}

/**
 * Récupérer les paramètres de l'entreprise
 */
export async function getCompanySettingsAction(): Promise<ActionResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Non authentifié" };
    }

    // Import dynamique de Prisma

    // Récupérer ou créer les paramètres par défaut
    let settings = await prisma.companySettings.findFirst();

    if (!settings) {
      // Créer les paramètres par défaut
      settings = await prisma.companySettings.create({
        data: {
          name: "Mon Entreprise",
          currency: "XOF",
        },
      });
    }

    return { success: true, data: settings };
  } catch (error) {
    console.error("Erreur getCompanySettingsAction:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des paramètres",
    };
  }
}

/**
 * Mettre à jour les paramètres de l'entreprise
 */
export async function updateCompanySettingsAction(
  input: CompanySettingsInput
): Promise<ActionResponse> {
  try {
    // Vérifier les permissions
    const permissionError = await checkDirecteurPermission();
    if (permissionError) return permissionError;

    // Valider les données
    const validated = companySettingsSchema.parse(input);

    // Import dynamique de Prisma

    // Nettoyer les valeurs vides
    const data = {
      name: validated.name,
      address: validated.address || null,
      phone: validated.phone || null,
      email: validated.email || null,
      website: validated.website || null,
      taxId: validated.taxId || null,
      currency: validated.currency,
    };

    // Récupérer les paramètres existants
    let settings = await prisma.companySettings.findFirst();

    if (settings) {
      // Mettre à jour
      settings = await prisma.companySettings.update({
        where: { id: settings.id },
        data,
      });
    } else {
      // Créer
      settings = await prisma.companySettings.create({
        data,
      });
    }

    // Logger l'activité
    const session = await auth();
    await prisma.activityLog.create({
      data: {
        action: "UPDATE",
        entityType: "CompanySettings",
        entityId: settings.id,
        userId: session?.user?.id,
        userName: session?.user?.name,
        details: {
          name: settings.name,
          currency: settings.currency,
        },
      },
    });

    revalidatePath("/settings");

    return { success: true, data: settings };
  } catch (error: any) {
    console.error("Erreur updateCompanySettingsAction:", error);

    if (error.name === "ZodError") {
      return { success: false, error: "Données invalides" };
    }

    return {
      success: false,
      error: "Erreur lors de la mise à jour des paramètres",
    };
  }
}