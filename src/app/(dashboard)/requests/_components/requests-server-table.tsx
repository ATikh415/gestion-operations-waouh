// src/app/(dashboard)/requests/_components/requests-server-table.tsx

"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Pencil,
  Send,
  Trash2,
  FileText,
} from "lucide-react";
import { RequestStatus, Role } from "@prisma/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import {
  submitPurchaseRequestAction,
  deletePurchaseRequestAction,
} from "@/lib/actions/purchase-request";
import { statusLabels, statusColors } from "@/lib/validations/purchase-request";
import RequestModal from "./request-modal";

type PurchaseRequest = {
  id: string;
  reference: string;
  title: string;
  description: string | null;
  status: RequestStatus;
  totalEstimated: number;
  createdAt: Date;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  department: {
    id: string;
    name: string;
    code: string;
  };
  items: any[];
  _count: {
    quotes: number;
    approvals: number;
    documents: number;
  };
};

type RequestsServerTableProps = {
  requests: PurchaseRequest[];
  totalCount: number;
  currentPage: number;
  perPage: number;
  totalPages: number;
  currentUserId: string;
  userRole: string;
};

export default function RequestsServerTable({
  requests,
  totalCount,
  currentPage,
  perPage,
  totalPages,
  currentUserId,
  userRole,
}: RequestsServerTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [editingRequest, setEditingRequest] = useState<PurchaseRequest | null>(null);

  // Changer de page
  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  // Changer items par page
  const changePerPage = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("perPage", value);
    params.set("page", "1"); // Reset à la page 1

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

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
        router.refresh();
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
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setDeletingId(null);
    }
  };

  // Permissions
  const canEdit = (request: PurchaseRequest) => {
    return (
      userRole === Role.USER &&
      request.userId === currentUserId &&
      request.status === RequestStatus.DRAFT
    );
  };

  const canSubmit = (request: PurchaseRequest) => {
    return (
      userRole === Role.USER &&
      request.userId === currentUserId &&
      request.status === RequestStatus.DRAFT &&
      request.items.length > 0
    );
  };

  const canDelete = (request: PurchaseRequest) => {
    return (
      userRole === Role.USER &&
      request.userId === currentUserId &&
      request.status === RequestStatus.DRAFT
    );
  };

  const startIndex = (currentPage - 1) * perPage;

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune demande trouvée</h3>
            <p className="text-muted-foreground">
              {userRole === Role.USER
                ? "Créez votre première demande d'achat"
                : "Aucune demande ne correspond à vos critères"}
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
          {/* Compteur */}
          <div className="p-4 border-b">
            <p className="text-sm text-muted-foreground">
              {totalCount} résultat(s) trouvé(s)
            </p>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto">
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
                            <DropdownMenuItem onClick={() => setEditingRequest(request)}>
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
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t">
            {/* Items par page */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Afficher</span>
              <Select
                value={String(perPage)}
                onValueChange={changePerPage}
                disabled={isPending}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">par page</span>
            </div>

            {/* Info pagination */}
            <div className="text-sm text-muted-foreground">
              {startIndex + 1}-{Math.min(startIndex + perPage, totalCount)} sur{" "}
              {totalCount}
            </div>

            {/* Boutons pagination */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1 || isPending}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>

              {/* Pages */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNum)}
                      disabled={isPending}
                      className="w-9"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || isPending}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal modification */}
      {editingRequest && (
        <RequestModal
          open={!!editingRequest}
          onOpenChange={(open) => !open && setEditingRequest(null)}
          request={editingRequest}
          onSuccess={() => {
            setEditingRequest(null);
            router.refresh();
          }}
        />
      )}

      {/* Dialog suppression */}
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