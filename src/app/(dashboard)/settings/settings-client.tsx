// src/app/(dashboard)/settings/settings-client.tsx

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Mail, Phone, Globe, MapPin, CreditCard, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  companySettingsSchema,
  currencies,
  type CompanySettingsInput,
} from "@/lib/validations/settings";
import { updateCompanySettingsAction } from "@/lib/actions/settings";

type CompanySettings = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxId: string | null;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
};

type SettingsClientProps = {
  initialSettings: CompanySettings;
};

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<CompanySettingsInput>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      name: initialSettings.name,
      address: initialSettings.address || "",
      phone: initialSettings.phone || "",
      email: initialSettings.email || "",
      website: initialSettings.website || "",
      taxId: initialSettings.taxId || "",
      currency: initialSettings.currency,
    },
  });

  const selectedCurrency = watch("currency");

  // Soumettre le formulaire
  const onSubmit = async (data: CompanySettingsInput) => {
    try {
      const result = await updateCompanySettingsAction(data);

      if (result.success) {
        toast.success("Paramètres mis à jour avec succès");
        setIsEditing(false);
        reset(data); // Réinitialiser avec les nouvelles valeurs
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    }
  };

  // Annuler les modifications
  const handleCancel = () => {
    reset({
      name: initialSettings.name,
      address: initialSettings.address || "",
      phone: initialSettings.phone || "",
      email: initialSettings.email || "",
      website: initialSettings.website || "",
      taxId: initialSettings.taxId || "",
      currency: initialSettings.currency,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec boutons d'action */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations de l'entreprise
              </CardTitle>
              <CardDescription>
                Gérez les informations générales de votre entreprise
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting || !isDirty}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Modifier
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Informations générales */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informations générales</h3>
              <Separator />

              {/* Nom de l'entreprise */}
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Nom de l'entreprise <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: ACME Corporation"
                  {...register("name")}
                  disabled={!isEditing || isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Adresse */}
              <div className="grid gap-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Adresse
                </Label>
                <Textarea
                  id="address"
                  placeholder="Adresse complète de l'entreprise"
                  rows={3}
                  {...register("address")}
                  disabled={!isEditing || isSubmitting}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address.message}</p>
                )}
              </div>

              {/* Téléphone et Email */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+221 33 123 45 67"
                    {...register("phone")}
                    disabled={!isEditing || isSubmitting}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@entreprise.sn"
                    {...register("email")}
                    disabled={!isEditing || isSubmitting}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Site web */}
              <div className="grid gap-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Site web
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://www.entreprise.sn"
                  {...register("website")}
                  disabled={!isEditing || isSubmitting}
                />
                {errors.website && (
                  <p className="text-sm text-destructive">{errors.website.message}</p>
                )}
              </div>
            </div>

            {/* Informations fiscales */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informations fiscales et financières</h3>
              <Separator />

              {/* NIF/NINEA */}
              <div className="grid gap-2">
                <Label htmlFor="taxId" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  NIF / NINEA
                </Label>
                <Input
                  id="taxId"
                  placeholder="Numéro d'identification fiscale"
                  {...register("taxId")}
                  disabled={!isEditing || isSubmitting}
                />
                {errors.taxId && (
                  <p className="text-sm text-destructive">{errors.taxId.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Numéro d'identification fiscale de votre entreprise
                </p>
              </div>

              {/* Devise */}
              <div className="grid gap-2">
                <Label htmlFor="currency">
                  Devise <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedCurrency}
                  onValueChange={(value) => setValue("currency", value, { shouldDirty: true })}
                  disabled={!isEditing || isSubmitting}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Sélectionner une devise" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <span className="font-medium">{currency.code}</span>
                            <span className="text-muted-foreground"> - {currency.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {currency.country}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currency && (
                  <p className="text-sm text-destructive">{errors.currency.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Devise utilisée pour les transactions et les rapports
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Informations supplémentaires */}
      <Card>
        <CardHeader>
          <CardTitle>Informations système</CardTitle>
          <CardDescription>
            Détails techniques sur les paramètres de l'entreprise
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Dernière modification :</span>
            <span className="font-medium">
              {new Date(initialSettings.updatedAt).toLocaleString("fr-FR", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Création :</span>
            <span className="font-medium">
              {new Date(initialSettings.createdAt).toLocaleString("fr-FR", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}