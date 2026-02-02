

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Role, RequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import RequestsFilters from "./_components/requests-filters";
import RequestsServerTable from "./_components/requests-server-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Demandes d'Achat | Gestion des Achats",
  description: "Liste des demandes d'achat",
};

type SearchParams = {
  search?: string;
  status?: string;
  page?: string;
  perPage?: string;
};

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Vérifier l'authentification
  const session = await auth();

  const { search, status, page, perPage} = await searchParams

  if (!session?.user) {
    redirect("/login");
  }

  // ✅ Paramètres de recherche et pagination
  const searchFilter = search || "";
  const statusFilter =status || "all";
  const pageFilter = parseInt(page || "1");
  const perPageFilter = parseInt(perPage || "10");

  // ✅ Construire les filtres Prisma
  const where: any = {};

  // Filtre par rôle
  if (session.user.role === Role.USER) {
    where.userId = session.user.id; // USER voit seulement ses demandes
  }
  // Autres rôles voient toutes les demandes

  // Filtre recherche
  if (searchFilter) {
    where.OR = [
      { reference: { contains: searchFilter, mode: "insensitive" } },
      { title: { contains: searchFilter, mode: "insensitive" } },
      { department: { name: { contains: searchFilter, mode: "insensitive" } } },
      { user: { name: { contains: searchFilter, mode: "insensitive" } } },
    ];
  }

  // Filtre statut
  if (statusFilter !== "all") {
    where.status = statusFilter as RequestStatus;
  }

  // ✅ Compter le total (pour pagination)
  const totalCount = await prisma.purchaseRequest.count({ where });

  // ✅ Récupérer SEULEMENT les demandes de la page actuelle
  const purchaseRequests = await prisma.purchaseRequest.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      items: true,
      _count: {
        select: {
          quotes: true,
          approvals: true,
          documents: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip: (pageFilter - 1) * perPageFilter,
    take: perPageFilter,
  });

  // ✅ Statistiques globales (sans filtres pour avoir le total)
  const statsWhere = session.user.role === Role.USER ? { userId: session.user.id } : {};
  
  const stats = await prisma.purchaseRequest.groupBy({
    by: ["status"],
    where: statsWhere,
    _count: true,
  });

  const statsFormatted = {
    total: await prisma.purchaseRequest.count({ where: statsWhere }),
    draft: stats.find((s) => s.status === RequestStatus.DRAFT)?._count || 0,
    pending: stats.find((s) => s.status === RequestStatus.PENDING)?._count || 0,
    completed: stats.find((s) => s.status === RequestStatus.COMPLETED)?._count || 0,
  };

  // Calcul pagination
  const totalPages = Math.ceil(totalCount / perPageFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Demandes d'achat</h1>
        <p className="text-muted-foreground mt-1">
          {session.user.role === Role.USER
            ? "Gérez vos demandes d'achat de matériels"
            : "Consultez et gérez les demandes d'achat"}
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsFormatted.total}</div>
            <p className="text-xs text-muted-foreground">demandes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brouillons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {statsFormatted.draft}
            </div>
            <p className="text-xs text-muted-foreground">non soumises</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {statsFormatted.pending}
            </div>
            <p className="text-xs text-muted-foreground">en traitement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalisées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsFormatted.completed}
            </div>
            <p className="text-xs text-muted-foreground">terminées</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres (Client Component) */}
      <RequestsFilters
        userRole={session.user.role}
        currentSearch={searchFilter}
        currentStatus={statusFilter}
      />

      {/* Tableau avec pagination (Client Component) */}
      <RequestsServerTable
        requests={purchaseRequests}
        totalCount={totalCount}
        currentPage={pageFilter}
        perPage={perPageFilter}
        totalPages={totalPages}
        currentUserId={session.user.id}
        userRole={session.user.role}
      />
    </div>
  );
}