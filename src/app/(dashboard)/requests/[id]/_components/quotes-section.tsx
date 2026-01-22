
"use client";

import { useState } from "react";
import { Plus, Check, Trash2, DollarSign, Calendar, CheckCircle2, ThumbsUp, ThumbsDown } from "lucide-react";
import { RequestStatus, Role } from "@prisma/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AddQuoteModal from "./add-quote-modal";
import {
  selectQuoteAction,
  deleteQuoteAction,
  approveRequestAction,
  rejectRequestAction,
} from "@/lib/actions/quote";

type Quote = {
  id: string;
  supplierName: string;
  supplierContact: string | null;
  amount: number;
  validUntil: Date;
  notes: string | null;
  createdAt: Date;
};

type QuotesSectionProps = {
  request: any;
  userRole: string;
};

export default function QuotesSection({ request, userRole }: QuotesSectionProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log(request.quotes);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Trouver le devis le moins cher
  const cheapestQuote = request.quotes.length > 0
    ? request.quotes.reduce((min: Quote, q: Quote) =>
        q.amount < min.amount ? q : min
      )
    : null;

  // Vérifier si on peut approuver
  const canApprove =
    userRole === Role.ACHAT &&
    request.status === RequestStatus.PENDING &&
    request.quotes.length >= 2 &&
    request.selectedQuoteId !== null;

    console.log({canApprove});
    

  // Sélectionner un devis
  const handleSelectQuote = async (quoteId: string) => {
    try {
      const result = await selectQuoteAction({
        purchaseRequestId: request.id,
        quoteId,
      });

      if (result.success) {
        toast.success("Devis sélectionné avec succès");
        window.location.reload();
      } else {
        toast.error(result.error || "Erreur lors de la sélection");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    }
  };

  // Supprimer un devis
  const handleDeleteQuote = async (quoteId: string) => {
    try {
      const result = await deleteQuoteAction({ quoteId });

      if (result.success) {
        toast.success("Devis supprimé avec succès");
        window.location.reload();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setDeletingQuoteId(null);
    }
  };

  // Approuver la demande
  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const result = await approveRequestAction({
        purchaseRequestId: request.id,
        comment: null,
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
      const result = await rejectRequestAction({
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Devis ({request.quotes.length})
            </CardTitle>
            {userRole === Role.ACHAT && request.status === RequestStatus.PENDING && (
              <Button onClick={() => setIsAddModalOpen(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un devis
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {request.quotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucun devis ajouté</p>
              {userRole === Role.ACHAT && request.status === RequestStatus.PENDING && (
                <p className="text-sm mt-2">Ajoutez au moins 2 devis pour approuver la demande</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {request.quotes.map((quote: Quote) => {
                const isSelected = quote.id === request.selectedQuoteId;
                const isCheapest = cheapestQuote?.id === quote.id;

                return (
                  <Card key={quote.id} className={isSelected ? "border-primary" : ""}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          {/* Nom fournisseur */}
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-lg">{quote.supplierName}</h4>
                            {isSelected && (
                              <Badge className="bg-primary">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Sélectionné
                              </Badge>
                            )}
                            {isCheapest && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                💰 Moins cher
                              </Badge>
                            )}
                          </div>

                          {/* Contact */}
                          {quote.supplierContact && (
                            <p className="text-sm text-muted-foreground">
                              Contact : {quote.supplierContact}
                            </p>
                          )}

                          {/* Montant et date */}
                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xl font-bold">
                                {formatCurrency(quote.amount)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                Valide jusqu'au {formatDate(quote.validUntil)}
                              </span>
                            </div>
                          </div>

                          {/* Notes */}
                          {quote.notes && (
                            <p className="text-sm text-muted-foreground italic">
                              Note : {quote.notes}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        {userRole === Role.ACHAT && request.status === RequestStatus.PENDING && (
                          <div className="flex flex-col gap-2">
                            {!isSelected ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSelectQuote(quote.id)}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Sélectionner
                              </Button>
                            ) : (
                              <Button size="sm" disabled>
                                <Check className="mr-2 h-4 w-4" />
                                Sélectionné
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeletingQuoteId(quote.id)}
                              disabled={isSelected}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Actions d'approbation/rejet */}
              {userRole === Role.ACHAT && request.status === RequestStatus.PENDING && (
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    onClick={handleApprove}
                    disabled={!canApprove || isSubmitting}
                    className="flex-1"
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Approuver la demande
                  </Button>
                  <Button
                    onClick={() => setIsRejectModalOpen(true)}
                    disabled={isSubmitting}
                    variant="destructive"
                    className="flex-1"
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Rejeter la demande
                  </Button>
                </div>
              )}

              {!canApprove && userRole === Role.ACHAT && request.status === RequestStatus.PENDING && (
                <div className="text-sm text-amber-600 bg-amber-50 p-4 rounded-md">
                  Pour approuver cette demande :
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Au moins 2 devis doivent être ajoutés ({request.quotes.length}/2)</li>
                    <li>Un devis doit être sélectionné {request.selectedQuoteId ? "✓" : "✗"}</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal ajout devis */}
      <AddQuoteModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        purchaseRequestId={request.id}
        onSuccess={() => window.location.reload()}
      />

      {/* Dialog suppression devis */}
      <AlertDialog open={!!deletingQuoteId} onOpenChange={() => setDeletingQuoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingQuoteId && handleDeleteQuote(deletingQuoteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
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