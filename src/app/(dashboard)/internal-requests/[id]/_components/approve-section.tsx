
"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { InternalStatus, Role } from "@prisma/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  approveInternalRequestAction,
  rejectInternalRequestAction,
} from "@/lib/actions/internal-request";

type ApproveSectionProps = {
  request: any;
  userRole: string;
};

export default function ApproveSection({ request, userRole }: ApproveSectionProps) {
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [approveComment, setApproveComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vérifier si on peut afficher la section
  if (
    userRole !== Role.DIRECTEUR ||
    request.status !== InternalStatus.PENDING
  ) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Approuver la demande
  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const result = await approveInternalRequestAction({
        internalRequestId: request.id,
        comment: approveComment || null,
      });

      if (result.success) {
        toast.success("Demande approuvée avec succès");
        window.location.reload();
      } else {
        toast.error(result.error || "Erreur lors de l'approbation");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
      setIsApproveModalOpen(false);
      setApproveComment("");
    }
  };

  // Rejeter la demande
  const handleReject = async () => {
    if (!rejectComment.trim() || rejectComment.length < 10) {
      toast.error("Le motif doit contenir au moins 10 caractères");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await rejectInternalRequestAction({
        internalRequestId: request.id,
        comment: rejectComment,
      });

      if (result.success) {
        toast.success("Demande rejetée");
        window.location.reload();
      } else {
        toast.error(result.error || "Erreur lors du rejet");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
      setIsRejectModalOpen(false);
      setRejectComment("");
    }
  };

  return (
    <>
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <CheckCircle className="h-5 w-5" />
            Validation Directeur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informations */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Cette demande nécessite votre validation.
            </p>

            <div className="bg-white p-4 rounded-lg border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Montant demandé :</span>
                <span className="text-2xl font-bold">
                  {formatCurrency(request.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Demandeur :</span>
                <span className="font-medium">{request.requestedBy.name}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              onClick={() => setIsApproveModalOpen(true)}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approuver
            </Button>
            <Button
              onClick={() => setIsRejectModalOpen(true)}
              disabled={isSubmitting}
              variant="destructive"
              className="flex-1"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Rejeter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog approbation */}
      <AlertDialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approuver la demande</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point d'approuver cette demande interne. Le responsable
              achats pourra ensuite la finaliser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="approveComment">Commentaire (optionnel)</Label>
            <Textarea
              id="approveComment"
              placeholder="Ajoutez un commentaire si nécessaire..."
              rows={4}
              value={approveComment}
              onChange={(e) => setApproveComment(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setApproveComment("")}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              Approuver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog rejet */}
      <AlertDialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter la demande</AlertDialogTitle>
            <AlertDialogDescription>
              Veuillez indiquer la raison du rejet (minimum 10 caractères).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectComment">Motif *</Label>
            <Textarea
              id="rejectComment"
              placeholder="Expliquez les raisons du rejet..."
              rows={4}
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Minimum 10 caractères requis
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectComment("")}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={rejectComment.trim().length < 10 || isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Rejeter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}