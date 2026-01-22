// src/app/(dashboard)/requests/[id]/components/add-quote-modal.tsx

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Building2 } from "lucide-react";
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
import { addQuoteSchema, type AddQuoteInput } from "@/lib/validations/quote";
import { addQuoteAction } from "@/lib/actions/quote";

type AddQuoteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseRequestId: string;
  onSuccess: () => void;
};

export default function AddQuoteModal({
  open,
  onOpenChange,
  purchaseRequestId,
  onSuccess,
}: AddQuoteModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddQuoteInput>({
    resolver: zodResolver(addQuoteSchema),
    defaultValues: {
      purchaseRequestId,
      supplierName: "",
      supplierContact: "",
      totalAmount: 0,
      validUntil: "",
      notes: "",
    },
  });

  // Obtenir la date minimale (aujourd'hui)
  const today = new Date().toISOString().split("T")[0];

  const onSubmit = async (data: AddQuoteInput) => {
    try {
      const result = await addQuoteAction({
        ...data,
        purchaseRequestId,
      });

      if (result.success) {
        toast.success("Devis ajouté avec succès");
        onSuccess();
        onOpenChange(false);
        reset();
      } else {
        toast.error(result.error || "Une erreur est survenue");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Ajouter un devis
          </DialogTitle>
          <DialogDescription>
            Ajoutez un devis d'un fournisseur pour cette demande d'achat
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nom du fournisseur */}
          <div className="grid gap-2">
            <Label htmlFor="supplierName">
              Nom du fournisseur <span className="text-destructive">*</span>
            </Label>
            <Input
              id="supplierName"
              placeholder="Ex: ACME Corporation"
              {...register("supplierName")}
              disabled={isSubmitting}
            />
            {errors.supplierName && (
              <p className="text-sm text-destructive">{errors.supplierName.message}</p>
            )}
          </div>

          {/* Contact du fournisseur */}
          <div className="grid gap-2">
            <Label htmlFor="supplierContact">Contact du fournisseur (optionnel)</Label>
            <Input
              id="supplierContact"
              placeholder="Email ou téléphone"
              {...register("supplierContact")}
              disabled={isSubmitting}
            />
            {errors.supplierContact && (
              <p className="text-sm text-destructive">{errors.supplierContact.message}</p>
            )}
          </div>

          {/* Montant total */}
          <div className="grid gap-2">
            <Label htmlFor="totalAmount">
              Montant total (XOF) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="totalAmount"
              type="number"
              min="0"
              step="1"
              placeholder="500000"
              {...register("totalAmount", { valueAsNumber: true })}
              disabled={isSubmitting}
            />
            {errors.totalAmount && (
              <p className="text-sm text-destructive">{errors.totalAmount.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Montant total proposé par le fournisseur pour tous les articles
            </p>
          </div>

          {/* Date de validité */}
          <div className="grid gap-2">
            <Label htmlFor="validUntil">
              Date de validité <span className="text-destructive">*</span>
            </Label>
            <Input
              id="validUntil"
              type="date"
              min={today}
              {...register("validUntil")}
              disabled={isSubmitting}
            />
            {errors.validUntil && (
              <p className="text-sm text-destructive">{errors.validUntil.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Jusqu'à quelle date ce devis est-il valable ?
            </p>
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Informations complémentaires sur ce devis..."
              rows={3}
              {...register("notes")}
              disabled={isSubmitting}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
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
              Ajouter le devis
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}