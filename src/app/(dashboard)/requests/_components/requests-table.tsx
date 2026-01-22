
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Eye, Pencil, Send, Trash2, FileText } from "lucide-react";
import { RequestStatus, Role } from "@prisma/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  submitPurchaseRequestAction,
  deletePurchaseRequestAction,
} from "@/lib/actions/purchase-request";
import { statusLabels, statusColors } from "@/lib/validations/purchase-request";

type PurchaseRequest = {
  id: string;
  reference: string;
  title: string;
  status: RequestStatus;
  totalEstimated: number;
  createdAt: Date;
  userId: string;
  department: {
    name: string;
    code: string;
  };
  user: {
    name: string;
  };
  items: any[];
  _count: {
    quotes: number;
  };
};

type RequestsTableProps = {
  requests: PurchaseRequest[];
  currentUserId: string;
  userRole: string;
  onEdit: (request: PurchaseRequest) => void;
  onRefresh: () => void;
};

export default function RequestsTable({
  requests,
  currentUserId,
  userRole,
  onEdit,
  onRefresh,
}: RequestsTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Formater le montant
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Gérer la soumission
  const handleSubmit = async (id: string) => {
    setSubmittingId(id);

    try {
      const result = await submitPurchaseRequestAction({ id });

      if (result.success) {
        toast.success("Demande soumise avec succès");
        onRefresh();
      } else {
        toast.error(result.error || "Erreur lors de la soumission");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setSubmittingId(null);
    }
  };

  // Gérer la suppression
  const handleDelete = async (id: string) => {
    try {
      const result = await deletePurchaseRequestAction({ id });

      if (result.success) {
        toast.success("Demande supprimée avec succès");
        onRefresh();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setDeletingId(null);
    }
  };

  // Vérifier si l'utilisateur peut modifier
  const canEdit = (request: PurchaseRequest) => {
    return (
      userRole === Role.USER &&
      request.userId === currentUserId &&
      request.status === RequestStatus.DRAFT
    );
  };

  // Vérifier si l'utilisateur peut soumettre
  const canSubmit = (request: PurchaseRequest) => {
    return (
      userRole === Role.USER &&
      request.userId === currentUserId &&
      request.status === RequestStatus.DRAFT &&
      request.items.length > 0
    );
  };

  // Vérifier si l'utilisateur peut supprimer
  const canDelete = (request: PurchaseRequest) => {
    return (
      userRole === Role.USER &&
      request.userId === currentUserId &&
      request.status === RequestStatus.DRAFT
    );
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-2">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Aucune demande trouvée</p>
            <p className="text-sm text-muted-foreground">
              {userRole === Role.USER
                ? "Créez votre première demande d'achat"
                : "Aucune demande n'a encore été créée"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Titre</TableHead>
                {userRole !== Role.USER && <TableHead>Demandeur</TableHead>}
                <TableHead>Département</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead className="text-right">Total estimé</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <code className="font-mono text-xs font-semibold">
                      {request.reference}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium max-w-xs">
                    <p className="truncate">{request.title}</p>
                  </TableCell>
                  {userRole !== Role.USER && (
                    <TableCell>
                      <p className="text-sm">{request.user.name}</p>
                    </TableCell>
                  )}
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{request.department.name}</p>
                      <code className="text-xs text-muted-foreground">
                        {request.department.code}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{request.items.length}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(request.totalEstimated)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[request.status]}>
                      {statusLabels[request.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(request.createdAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => router.push(`/requests/${request.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </DropdownMenuItem>
                        {canEdit(request) && (
                          <DropdownMenuItem onClick={() => onEdit(request)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                        )}
                        {canSubmit(request) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleSubmit(request.id)}
                              disabled={submittingId === request.id}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Soumettre
                            </DropdownMenuItem>
                          </>
                        )}
                        {canDelete(request) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingId(request.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette demande ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
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