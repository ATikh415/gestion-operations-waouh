// // src/app/(dashboard)/requests/[id]/components/accountant-section.tsx

// "use client";

// import { useState } from "react";
// import { FileText, Upload, Trash2, CheckCircle, Download } from "lucide-react";
// import { RequestStatus, Role, DocumentType } from "@prisma/client";
// import { toast } from "sonner";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import {
//   deleteDocumentAction,
//   finalizeRequestAction,
// } from "@/lib/actions/accountant";
// import { documentTypeLabels } from "@/lib/validations/accountant";
// import AddDocumentModal from "./add-document-modal";

// type Document = {
//   id: string;
//   type: DocumentType;
//   name: string;
//   fileUrl: string;
//   createdAt: Date;
//   uploadedBy: {
//     name: string;
//   };
// };

// type AccountantSectionProps = {
//   request: any;
//   userRole: string;
// };

// export default function AccountantSection({ request, userRole }: AccountantSectionProps) {
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
//   const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Vérifier si on peut afficher la section
//   if (
//     userRole !== Role.COMPTABLE ||
//     request.status !== RequestStatus.VALIDATED
//   ) {
//     return null;
//   }

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat("fr-FR", {
//       style: "currency",
//       currency: "XOF",
//       minimumFractionDigits: 0,
//     }).format(amount);
//   };

//   const formatDate = (date: Date) => {
//     return new Date(date).toLocaleDateString("fr-FR", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   // Supprimer un document
//   const handleDeleteDocument = async (documentId: string) => {
//     try {
//       const result = await deleteDocumentAction({ documentId });

//       if (result.success) {
//         toast.success("Document supprimé avec succès");
//         window.location.reload();
//       } else {
//         toast.error(result.error || "Erreur lors de la suppression");
//       }
//     } catch (error) {
//       toast.error("Une erreur est survenue");
//     } finally {
//       setDeletingDocId(null);
//     }
//   };

//   // Finaliser la demande
//   const handleFinalize = async () => {
//     setIsSubmitting(true);
//     try {
//       const result = await finalizeRequestAction({
//         purchaseRequestId: request.id,
//       });

//       if (result.success) {
//         toast.success("Achat finalisé avec succès");
//         window.location.reload();
//       } else {
//         toast.error(result.error || "Erreur lors de la finalisation");
//       }
//     } catch (error) {
//       toast.error("Une erreur est survenue");
//     } finally {
//       setIsSubmitting(false);
//       setIsFinalizeModalOpen(false);
//     }
//   };

//   const canFinalize = request.documents && request.documents.length > 0;

//   console.log(request.documents);
  

//   return (
//     <>
//       <Card className="border-blue-200 bg-blue-50/50">
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <CardTitle className="flex items-center gap-2 text-blue-900">
//               <FileText className="h-5 w-5" />
//               Finalisation Comptable ({request.documents?.length || 0} documents)
//             </CardTitle>
//             <Button
//               onClick={() => setIsAddModalOpen(true)}
//               size="sm"
//               variant="outline"
//             >
//               <Upload className="mr-2 h-4 w-4" />
//               Ajouter un document
//             </Button>
//           </div>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {/* Informations */}
//           <div className="space-y-2">
//             <p className="text-sm text-muted-foreground">
//               Cette demande a été validée par le Directeur. Ajoutez les documents
//               nécessaires (factures, reçus, etc.) puis finalisez l'achat.
//             </p>

//             {request.totalFinal && (
//               <div className="bg-white p-4 rounded-lg border">
//                 <p className="text-sm font-medium mb-2">Montant final :</p>
//                 <p className="text-2xl font-bold">
//                   {formatCurrency(request.totalFinal)}
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* Liste des documents */}
//           {request.documents && request.documents.length > 0 ? (
//             <div className="space-y-2">
//               <h4 className="text-sm font-medium">Documents ajoutés :</h4>
//               <div className="space-y-2">
//                 {request.documents.map((doc: Document) => (
//                   <Card key={doc.id}>
//                     <CardContent className="p-4">
//                       <div className="flex items-start justify-between gap-4">
//                         <div className="flex-1 space-y-1">
//                           <div className="flex items-center gap-2">
//                             <FileText className="h-4 w-4 text-muted-foreground" />
//                             <p className="font-medium">{doc.name}</p>
//                             <Badge variant="secondary">
//                               {documentTypeLabels[doc.type]}
//                             </Badge>
//                           </div>
//                           <p className="text-xs text-muted-foreground">
//                             Ajouté par {doc.uploadedBy?.name} le {formatDate(doc.createdAt)}
//                           </p>
//                         </div>
//                         <div className="flex gap-2">
//                           <Button
//                             size="sm"
//                             variant="ghost"
//                             onClick={() => window.open(doc.fileUrl, "_blank")}
//                           >
//                             <Download className="h-4 w-4" />
//                           </Button>
//                           <Button
//                             size="sm"
//                             variant="ghost"
//                             onClick={() => setDeletingDocId(doc.id)}
//                             className="text-destructive hover:text-destructive"
//                           >
//                             <Trash2 className="h-4 w-4" />
//                           </Button>
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             </div>
//           ) : (
//             <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
//               <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
//               <p>Aucun document ajouté</p>
//               <p className="text-sm mt-2">
//                 Ajoutez au moins un document pour finaliser l'achat
//               </p>
//             </div>
//           )}

//           {/* Bouton finaliser */}
//           <div className="pt-4">
//             <Button
//               onClick={() => setIsFinalizeModalOpen(true)}
//               disabled={!canFinalize || isSubmitting}
//               className="w-full bg-green-600 hover:bg-green-700"
//             >
//               <CheckCircle className="mr-2 h-4 w-4" />
//               Finaliser l'achat
//             </Button>
//             {!canFinalize && (
//               <p className="text-sm text-amber-600 mt-2 text-center">
//                 Au moins un document doit être ajouté avant de finaliser
//               </p>
//             )}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Modal ajout document */}
//       <AddDocumentModal
//         open={isAddModalOpen}
//         onOpenChange={setIsAddModalOpen}
//         purchaseRequestId={request.id}
//         onSuccess={() => window.location.reload()}
//       />

//       {/* Dialog suppression document */}
//       <AlertDialog open={!!deletingDocId} onOpenChange={() => setDeletingDocId(null)}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
//             <AlertDialogDescription>
//               Êtes-vous sûr de vouloir supprimer ce document ? Cette action est
//               irréversible.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Annuler</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={() => deletingDocId && handleDeleteDocument(deletingDocId)}
//               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
//             >
//               Supprimer
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>

//       {/* Dialog finalisation */}
//       <AlertDialog open={isFinalizeModalOpen} onOpenChange={setIsFinalizeModalOpen}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Finaliser l'achat</AlertDialogTitle>
//             <AlertDialogDescription>
//               Vous êtes sur le point de finaliser cet achat. Cette action marquera la
//               demande comme terminée et aucune modification ne sera possible.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Annuler</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={handleFinalize}
//               disabled={isSubmitting}
//               className="bg-green-600 hover:bg-green-700"
//             >
//               Finaliser
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </>
//   );
// }

// src/app/(dashboard)/requests/[id]/components/accountant-section.tsx

"use client";

import { useState } from "react";
import { FileText, Upload, CheckCircle } from "lucide-react";
import { RequestStatus, Role } from "@prisma/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import AddDocumentModal from "./add-document-modal";
import { finalizeRequestAction } from "@/lib/actions/accountant";

type AccountantSectionProps = {
  request: any;
  userRole: string;
};

export default function AccountantSection({ request, userRole }: AccountantSectionProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vérifier si on peut afficher la section
  if (
    userRole !== Role.COMPTABLE ||
    request.status !== RequestStatus.VALIDATED
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

  // Finaliser la demande
  const handleFinalize = async () => {
    setIsSubmitting(true);
    try {
      const result = await finalizeRequestAction({
        purchaseRequestId: request.id,
      });

      if (result.success) {
        toast.success("Achat finalisé avec succès");
        window.location.reload();
      } else {
        toast.error(result.error || "Erreur lors de la finalisation");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
      setIsFinalizeModalOpen(false);
    }
  };

  const canFinalize = request.documents && request.documents.length > 0;

  return (
    <>
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <FileText className="h-5 w-5" />
              Finalisation Comptable
            </CardTitle>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              size="sm"
              variant="outline"
            >
              <Upload className="mr-2 h-4 w-4" />
              Ajouter un document
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informations */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Cette demande a été validée par le Directeur. Ajoutez les documents
              nécessaires (factures, reçus, etc.) puis finalisez l'achat.
            </p>

            {request.totalFinal && (
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm font-medium mb-2">Montant final :</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(request.totalFinal)}
                </p>
              </div>
            )}
          </div>

          {/* Compteur documents */}
          <div className="bg-white p-3 rounded-lg border">
            <p className="text-sm">
              <span className="font-medium">
                {request.documents?.length || 0} document(s)
              </span>{" "}
              ajouté(s)
            </p>
            {!canFinalize && (
              <p className="text-xs text-amber-600 mt-1">
                Au moins un document requis pour finaliser
              </p>
            )}
          </div>

          {/* Bouton finaliser */}
          <div className="pt-2">
            <Button
              onClick={() => setIsFinalizeModalOpen(true)}
              disabled={!canFinalize || isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Finaliser l'achat
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal ajout document */}
      <AddDocumentModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        purchaseRequestId={request.id}
        onSuccess={() => window.location.reload()}
      />

      {/* Dialog finalisation */}
      <AlertDialog open={isFinalizeModalOpen} onOpenChange={setIsFinalizeModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finaliser l'achat</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de finaliser cet achat. Cette action marquera la
              demande comme terminée et aucune modification ne sera possible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinalize}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              Finaliser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}