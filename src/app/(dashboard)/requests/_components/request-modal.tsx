
"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import {
  createPurchaseRequestSchema,
  updatePurchaseRequestSchema,
  type CreatePurchaseRequestInput,
  type UpdatePurchaseRequestInput,
} from "@/lib/validations/purchase-request";
import {
  createPurchaseRequestAction,
  updatePurchaseRequestAction,
} from "@/lib/actions/purchase-request";

type PurchaseRequest = {
  id: string;
  title: string;
  description: string | null;
  items: {
    id: string;
    name: string;
    description: string | null;
    quantity: number;
    estimatedPrice: number;
  }[];
};

type RequestModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: PurchaseRequest | null;
  onSuccess: (request?: any) => void;
};

export default function RequestModal({
  open,
  onOpenChange,
  request,
  onSuccess,
}: RequestModalProps) {
  const isEditing = !!request;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    watch,
  } = useForm<CreatePurchaseRequestInput | UpdatePurchaseRequestInput>({
    resolver: zodResolver(isEditing ? updatePurchaseRequestSchema : createPurchaseRequestSchema),
    defaultValues: {
      title: "",
      description: "",
      items: [{ name: "", description: "", quantity: 1, estimatedPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");

  // Calculer le total estimé
  const totalEstimated = items?.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.estimatedPrice || 0),
    0
  ) || 0;

  // Formater le montant
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Charger les données de la demande à modifier
  useEffect(() => {
    if (request) {
      reset({
        title: request.title,
        description: request.description || "",
        items: request.items.map((item) => ({
          name: item.name,
          description: item.description || "",
          quantity: item.quantity,
          estimatedPrice: item.estimatedPrice,
        })),
      });
    } else {
      reset({
        title: "",
        description: "",
        items: [{ name: "", description: "", quantity: 1, estimatedPrice: 0 }],
      });
    }
  }, [request, reset]);

  // Soumettre le formulaire
  const onSubmit = async (data: CreatePurchaseRequestInput | UpdatePurchaseRequestInput) => {
    try {
      let result;

      if (isEditing && request) {
        // Modification
        result = await updatePurchaseRequestAction({
          ...data,
          id: request.id,
        } as UpdatePurchaseRequestInput);
      } else {
        // Création
        result = await createPurchaseRequestAction(data as CreatePurchaseRequestInput);
      }

      if (result.success) {
        toast.success(
          isEditing
            ? "Demande modifiée avec succès"
            : "Demande créée avec succès"
        );
        onSuccess(result.data);
        onOpenChange(false);
        reset();
      } else {
        toast.error(result.error || "Une erreur est survenue");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    }
  };

  // Ajouter un item
  const handleAddItem = () => {
    append({ name: "", description: "", quantity: 1, estimatedPrice: 0 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-225 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isEditing ? "Modifier la demande" : "Nouvelle demande d'achat"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de votre demande"
              : "Créez une nouvelle demande d'achat pour votre département"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informations générales */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Informations générales</h3>
            <Separator />

            {/* Titre */}
            <div className="grid gap-2">
              <Label htmlFor="title">
                Titre de la demande <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Ex: Matériel informatique pour le service RH"
                {...register("title")}
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                placeholder="Décrivez le contexte ou les besoins spécifiques..."
                rows={3}
                {...register("description")}
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Liste des articles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                Articles demandés ({fields.length})
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                disabled={isSubmitting || fields.length >= 50}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un article
              </Button>
            </div>
            <Separator />

            {/* Items */}
            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Article #{index + 1}</span>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Nom de l'article */}
                      <div className="sm:col-span-2 grid gap-2">
                        <Label htmlFor={`items.${index}.name`}>
                          Nom de l'article <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`items.${index}.name`}
                          placeholder="Ex: Ordinateur portable"
                          {...register(`items.${index}.name`)}
                          disabled={isSubmitting}
                        />
                        {errors.items?.[index]?.name && (
                          <p className="text-sm text-destructive">
                            {errors.items[index]?.name?.message}
                          </p>
                        )}
                      </div>

                      {/* Description */}
                      <div className="sm:col-span-2 grid gap-2">
                        <Label htmlFor={`items.${index}.description`}>
                          Description (optionnel)
                        </Label>
                        <Textarea
                          id={`items.${index}.description`}
                          placeholder="Spécifications, marque, modèle..."
                          rows={2}
                          {...register(`items.${index}.description`)}
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Quantité */}
                      <div className="grid gap-2">
                        <Label htmlFor={`items.${index}.quantity`}>
                          Quantité <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`items.${index}.quantity`}
                          type="number"
                          min="1"
                          {...register(`items.${index}.quantity`, {
                            valueAsNumber: true,
                          })}
                          disabled={isSubmitting}
                        />
                        {errors.items?.[index]?.quantity && (
                          <p className="text-sm text-destructive">
                            {errors.items[index]?.quantity?.message}
                          </p>
                        )}
                      </div>

                      {/* Prix estimé */}
                      <div className="grid gap-2">
                        <Label htmlFor={`items.${index}.estimatedPrice`}>
                          Prix unitaire estimé <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`items.${index}.estimatedPrice`}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          {...register(`items.${index}.estimatedPrice`, {
                            valueAsNumber: true,
                          })}
                          disabled={isSubmitting}
                        />
                        {errors.items?.[index]?.estimatedPrice && (
                          <p className="text-sm text-destructive">
                            {errors.items[index]?.estimatedPrice?.message}
                          </p>
                        )}
                      </div>

                      {/* Sous-total */}
                      <div className="sm:col-span-2 flex justify-end">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Sous-total : </span>
                          <span className="font-medium">
                            {formatCurrency(
                              (items[index]?.quantity || 0) *
                                (items[index]?.estimatedPrice || 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Total estimé */}
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">Total estimé :</span>
                <span className="text-2xl font-bold">{formatCurrency(totalEstimated)}</span>
              </div>
            </Card>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}