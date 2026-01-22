// src/app/(dashboard)/requests/[id]/components/documents-section.tsx

"use client";

import { useState } from "react";
import { FileText, Download, Trash2, Calendar, User } from "lucide-react";
import { RequestStatus, Role, DocumentType } from "@prisma/client";
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
import { deleteDocumentAction } from "@/lib/actions/accountant";
import { documentTypeLabels } from "@/lib/validations/accountant";

type Document = {
  id: string;
  type: DocumentType;
  name: string;
  fileUrl: string;
  createdAt: Date;
  uploadedBy: {
    name: string;
  };
};

type DocumentsSectionProps = {
  request: any;
  userRole: string;
};

export default function DocumentsSection({ request, userRole }: DocumentsSectionProps) {
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  // Ne rien afficher s'il n'y a pas de documents
  if (!request.documents || request.documents.length === 0) {
    return null;
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Vérifier si l'utilisateur peut supprimer (COMPTABLE + VALIDATED)
  const canDelete =
    userRole === Role.COMPTABLE && request.status === RequestStatus.VALIDATED;

  // Supprimer un document
  const handleDeleteDocument = async (documentId: string) => {
    try {
      const result = await deleteDocumentAction({ documentId });

      if (result.success) {
        toast.success("Document supprimé avec succès");
        window.location.reload();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setDeletingDocId(null);
    }
  };
  

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents ({request.documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {request.documents.map((doc: Document) => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Nom et type */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <p className="font-medium">{doc.name}</p>
                        <Badge variant="secondary">
                          {documentTypeLabels[doc.type]}
                        </Badge>
                      </div>

                      {/* Informations upload */}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{doc.uploadedBy?.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(doc.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0">
                      {/* Bouton Télécharger (tous les rôles) */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(doc.fileUrl, "_blank")}
                        title="Télécharger le document"
                      >
                        <Download className="h-4 w-4" />
                      </Button>

                      {/* Bouton Supprimer (COMPTABLE + VALIDATED seulement) */}
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingDocId(doc.id)}
                          className="text-destructive hover:text-destructive"
                          title="Supprimer le document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog suppression document */}
      <AlertDialog open={!!deletingDocId} onOpenChange={() => setDeletingDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce document ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingDocId && handleDeleteDocument(deletingDocId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}