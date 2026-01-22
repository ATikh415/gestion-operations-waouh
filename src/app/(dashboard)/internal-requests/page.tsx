// src/app/(dashboard)/internal-requests/page.tsx

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { 
  internalCategoryLabels, 
  internalCategoryIcons 
} from "@/lib/validations/internal-request";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import Link from "next/link";
import { FileText, Calendar, User, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import CreateInternalModal from "./_components/create-internal-modal";
import InternalStatusBadge from "./_components/internal-status-badge";

export const metadata = {
  title: "Demandes Internes | Gestion des Achats",
  description: "Liste des demandes internes",
};

export default async function InternalRequestsPage() {
  // Vérifier l'authentification
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Vérifier les permissions (ACHAT ou DIRECTEUR uniquement)
  if (
    session.user.role !== Role.ACHAT &&
    session.user.role !== Role.DIRECTEUR
  ) {
    redirect("/dashboard");
  }

  // Récupérer les demandes internes
  const internalRequests = await prisma.internalRequest.findMany({
    include: {
      requestedBy: {
        select: {
          name: true,
        },
      },
      documents: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Statistiques
  const stats = {
    total: internalRequests.length,
    pending: internalRequests.filter((r) => r.status === "PENDING").length,
    approved: internalRequests.filter((r) => r.status === "APPROVED").length,
    completed: internalRequests.filter((r) => r.status === "COMPLETED").length,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Demandes Internes</h1>
          <p className="text-muted-foreground mt-1">
            Gestion des dépenses courantes (internet, électricité, etc.)
          </p>
        </div>
        {session.user.role === Role.ACHAT && <CreateInternalModal />}
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">demandes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">à valider</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">à finaliser</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalisées</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">terminées</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des demandes */}
      <Card>
        <CardHeader>
          <CardTitle>Toutes les demandes ({internalRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {internalRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune demande interne</h3>
              <p className="text-muted-foreground mb-4">
                {session.user.role === Role.ACHAT
                  ? "Créez votre première demande interne"
                  : "Aucune demande en attente de validation"}
              </p>
              {session.user.role === Role.ACHAT && <CreateInternalModal />}
            </div>
          ) : (
            <div className="space-y-3">
              {internalRequests.map((request) => (
                <Link
                  key={request.id}
                  href={`/internal-requests/${request.id}`}
                  className="block"
                >
                  <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        {/* Infos principales */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">
                              {internalCategoryIcons[request.category]}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-muted-foreground">
                                  {request.reference}
                                </span>
                                <InternalStatusBadge status={request.status} />
                              </div>
                              <h3 className="font-semibold text-lg">
                                {request.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {internalCategoryLabels[request.category]}
                              </p>
                            </div>
                          </div>

                          {/* Métadonnées */}
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{request.requestedBy.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(request.createdAt)}</span>
                            </div>
                            {request.documents.length > 0 && (
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                <span>{request.documents.length} document(s)</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Montant */}
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {formatCurrency(request.amount)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}