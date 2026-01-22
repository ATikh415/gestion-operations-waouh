
"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { RequestStatus, Role } from "@prisma/client";
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
  validateRequestAction,
  rejectRequestDirectorAction,
} from "@/lib/actions/director";

type DirectorSectionProps = {
  request: any;
  userRole: string;
};

export default function DirectorSection({ request, userRole }: DirectorSectionProps) {
  const [isValidateModalOpen, setIsValidateModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [validateComment, setValidateComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vérifier si on peut afficher la section
  if (
    userRole !== Role.DIRECTEUR ||
    request.status !== RequestStatus.APPROVED
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

  // Valider la demande
  const handleValidate = async () => {
    setIsSubmitting(true);
    try {
      const result = await validateRequestAction({
        purchaseRequestId: request.id,
        comment: validateComment || null,
      });

      if (result.success) {
        toast.success("Demande validée avec succès");
        window.location.reload();
      } else {
        toast.error(result.error || "Erreur lors de la validation");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
      setIsValidateModalOpen(false);
      setValidateComment("");
    }
  };

  // Rejeter la demande
  const handleReject = async () => {
    if (!rejectComment.trim() || rejectComment.length < 10) {
      toast.error("Le commentaire doit contenir au moins 10 caractères");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await rejectRequestDirectorAction({
        purchaseRequestId: request.id,
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
              Cette demande a été approuvée par le service Achats et attend votre validation.
            </p>
            
            {request.selectedQuote && (
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm font-medium mb-2">Devis sélectionné :</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{request.selectedQuote.supplierName}</p>
                    {request.selectedQuote.supplierContact && (
                      <p className="text-sm text-muted-foreground">
                        {request.selectedQuote.supplierContact}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {formatCurrency(request.selectedQuote.amount)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              onClick={() => setIsValidateModalOpen(true)}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Valider la demande
            </Button>
            <Button
              onClick={() => setIsRejectModalOpen(true)}
              disabled={isSubmitting}
              variant="destructive"
              className="flex-1"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Rejeter la demande
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog validation */}
      <AlertDialog open={isValidateModalOpen} onOpenChange={setIsValidateModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Valider la demande</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de valider cette demande d'achat. Le service Comptable
              pourra ensuite finaliser l'achat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="validateComment">Commentaire (optionnel)</Label>
            <Textarea
              id="validateComment"
              placeholder="Ajoutez un commentaire si nécessaire..."
              rows={4}
              value={validateComment}
              onChange={(e) => setValidateComment(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setValidateComment("")}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleValidate}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              Valider
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
            <Label htmlFor="rejectComment">Commentaire *</Label>
            <Textarea
              id="rejectComment"
              placeholder="Expliquez les raisons du rejet..."
              rows={4}
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              className="mt-2"
            />
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