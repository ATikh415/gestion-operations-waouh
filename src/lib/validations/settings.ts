
import { z } from "zod";

/**
 * Schéma de validation pour les paramètres de l'entreprise
 */
export const companySettingsSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom de l'entreprise est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(200, "Le nom ne peut pas dépasser 200 caractères")
    .trim(),
  address: z
    .string()
    .max(500, "L'adresse ne peut pas dépasser 500 caractères")
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(50, "Le numéro de téléphone ne peut pas dépasser 50 caractères")
    .optional()
    .nullable(),
  email: z
    .email(),
  website: z
    .string()
    .max(200, "L'URL ne peut pas dépasser 200 caractères")
    .optional()
    .nullable()
    .or(z.literal("")),
  taxId: z
    .string()
    .max(50, "Le NIF/NINEA ne peut pas dépasser 50 caractères")
    .optional()
    .nullable(),
  currency: z
    .string()
    .min(1, "La devise est requise")
    .length(3, "La devise doit être un code ISO de 3 lettres (ex: XOF, USD)")
    .toUpperCase()
    .trim(),
});

/**
 * Type TypeScript inféré du schéma
 */
export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;

/**
 * Devises courantes
 */
export const currencies = [
  { code: "XOF", name: "Franc CFA (BCEAO)", symbol: "CFA", country: "Sénégal, Mali, etc." },
  { code: "XAF", name: "Franc CFA (BEAC)", symbol: "FCFA", country: "Cameroun, Gabon, etc." },
  { code: "EUR", name: "Euro", symbol: "€", country: "France, Europe" },
  { code: "USD", name: "Dollar américain", symbol: "$", country: "États-Unis" },
  { code: "GBP", name: "Livre sterling", symbol: "£", country: "Royaume-Uni" },
  { code: "MAD", name: "Dirham marocain", symbol: "DH", country: "Maroc" },
  { code: "TND", name: "Dinar tunisien", symbol: "TND", country: "Tunisie" },
  { code: "DZD", name: "Dinar algérien", symbol: "DZD", country: "Algérie" },
] as const;