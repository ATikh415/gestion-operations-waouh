import { Role } from "@prisma/client";

// Permissions par fonctionnalité
export const permissions = {
  // Gestion des utilisateurs
  canManageUsers: (role: Role): boolean => {
    return role === Role.DIRECTEUR;
  },

  // Gestion des départements
  canManageDepartments: (role: Role): boolean => {
    return role === Role.DIRECTEUR;
  },

  // Gestion des paramètres
  canManageSettings: (role: Role): boolean => {
    return role === Role.DIRECTEUR;
  },

  // Créer une demande d'achat
  canCreateRequest: (role: Role): boolean => {
    return role === Role.USER;
  },

  // Gérer les devis
  canManageQuotes: (role: Role): boolean => {
    return role === Role.ACHAT;
  },

  // Approuver en tant que ACHAT
  canApproveAsAchat: (role: Role): boolean => {
    return role === Role.ACHAT;
  },

  // Valider en tant que DIRECTEUR
  canValidateAsDirecteur: (role: Role): boolean => {
    return role === Role.DIRECTEUR;
  },

  // Finaliser une demande (COMPTABLE)
  canFinalizeRequest: (role: Role): boolean => {
    return role === Role.COMPTABLE;
  },

  // Voir les rapports
  canViewReports: (role: Role): boolean => {
    return ([Role.DIRECTEUR, Role.COMPTABLE] as Role[]).includes(role);
  },

  // Voir toutes les demandes
  canViewAllRequests: (role: Role): boolean => {
  return ([Role.DIRECTEUR, Role.ACHAT, Role.COMPTABLE] as Role[]).includes(role);
  },
};

// Helper pour obtenir les actions possibles selon le rôle et le statut
export function getAvailableActions(
  role: Role,
  status: string
): string[] {
  const actions: string[] = [];

  switch (role) {
    case Role.USER:
      if (status === "DRAFT") {
        actions.push("edit", "submit", "delete");
      }
      break;

    case Role.ACHAT:
      if (status === "PENDING") {
        actions.push("add_quote", "reject");
      }
      if (status === "QUOTED") {
        actions.push("add_quote", "select_quote", "approve", "reject");
      }
      break;

    case Role.DIRECTEUR:
      if (status === "APPROVED") {
        actions.push("validate", "reject");
      }
      break;

    case Role.COMPTABLE:
      if (status === "VALIDATED") {
        actions.push("add_document", "finalize");
      }
      break;
  }

  return actions;
}

// Labels des rôles en français
export const roleLabels: Record<Role, string> = {
  DIRECTEUR: "Directeur",
  ACHAT: "Service Achats",
  COMPTABLE: "Comptable",
  USER: "Utilisateur",
};

// Couleurs des badges par rôle
export const roleColors: Record<Role, string> = {
  DIRECTEUR: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  ACHAT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  COMPTABLE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  USER: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};