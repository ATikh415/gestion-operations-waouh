// src/app/(dashboard)/internal-requests/_components/internal-requests-server-table.tsx

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { InternalCategory, InternalStatus } from "@prisma/client";
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
import InternalStatusBadge from "./internal-status-badge";
import {
  internalCategoryLabels,
  internalCategoryIcons,
} from "@/lib/validations/internal-request";

type InternalRequest = {
  id: string;
  reference: string;
  title: string;
  description: string | null;
  category: InternalCategory;
  amount: number;
  status: InternalStatus;
  createdAt: Date;
  requestedBy: {
    name: string;
  };
  documents: any[];
};

type InternalRequestsServerTableProps = {
  requests: InternalRequest[];
  totalCount: number;
  currentPage: number;
  perPage: number;
  totalPages: number;
};

export default function InternalRequestsServerTable({
  requests,
  totalCount,
  currentPage,
  perPage,
  totalPages,
}: InternalRequestsServerTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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
              Aucune demande ne correspond à vos critères de recherche
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Compteur de résultats */}
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
                <TableHead>Catégorie</TableHead>
                <TableHead>Demandeur</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Docs</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow
                  key={request.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell>
                    <Link
                      href={`/internal-requests/${request.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {request.reference}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/internal-requests/${request.id}`}
                      className="hover:underline"
                    >
                      <div className="font-medium">{request.title}</div>
                      {request.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {request.description}
                        </div>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {internalCategoryIcons[request.category]}
                      </span>
                      <span className="text-sm">
                        {internalCategoryLabels[request.category]}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {request.requestedBy.name}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(request.amount)}
                  </TableCell>
                  <TableCell>
                    {request.documents.length > 0 ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        <span>{request.documents.length}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <InternalStatusBadge status={request.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(request.createdAt)}
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
  );
}