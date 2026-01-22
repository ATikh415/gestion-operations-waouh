
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { InternalCategory } from "@prisma/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createInternalRequestSchema,
  type CreateInternalRequestInput,
  internalCategoryLabels,
  internalCategoryIcons,
} from "@/lib/validations/internal-request";
import { createInternalRequestAction } from "@/lib/actions/internal-request";

export default function CreateInternalModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CreateInternalRequestInput>({
    resolver: zodResolver(createInternalRequestSchema),
    defaultValues: {
      title: "",
      description: "",
      category: InternalCategory.INTERNET,
      amount: 0,
    },
  });

  const selectedCategory = watch("category");

  const onSubmit = async (data: CreateInternalRequestInput) => {
    try {
      const result = await createInternalRequestAction(data);

      if (result.success) {
        toast.success("Demande interne créée avec succès");
        reset();
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Une erreur est survenue");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle demande interne
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-137.5">
        <DialogHeader>
          <DialogTitle>Nouvelle demande interne</DialogTitle>
          <DialogDescription>
            Créer une demande pour les dépenses courantes (internet, électricité, etc.)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Titre */}
          <div className="grid gap-2">
            <Label htmlFor="title">
              Titre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ex: Facture internet janvier 2026"
              {...register("title")}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Catégorie */}
          <div className="grid gap-2">
            <Label htmlFor="category">
              Catégorie <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedCategory}
              onValueChange={(value) => setValue("category", value as InternalCategory)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(internalCategoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <span className="flex items-center gap-2">
                      <span>{internalCategoryIcons[value as InternalCategory]}</span>
                      <span>{label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          {/* Montant */}
          <div className="grid gap-2">
            <Label htmlFor="amount">
              Montant (XOF) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="50000"
              {...register("amount", { valueAsNumber: true })}
              disabled={isSubmitting}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">
              Description <span className="text-muted-foreground">(optionnel)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Ajouter des détails sur cette demande..."
              rows={4}
              {...register("description")}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer la demande
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}