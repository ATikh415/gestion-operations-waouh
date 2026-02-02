
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Role, InternalStatus, InternalCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import InternalRequestsFilters from "./_components/internal-requests-filters";
import InternalRequestsServerTable from "./_components/internal-requests-server-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Demandes Internes | Gestion des Achats",
  description: "Liste des demandes internes",
};

type SearchParams = {
  search?: string;
  status?: string;
  category?: string;
  page?: string;
  perPage?: string;
};

export default async function InternalRequestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Vérifier l'authentification
  const session = await auth();
  const { search, status, category, page, perPage} = await searchParams

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

  // ✅ Paramètres de recherche et pagination
  const searchFilter = search || "";
  const statusFilter = status || "all";
  const categoryFilter = category || "all";
  const pageFilter = parseInt(page || "1");
  const perPageFilter = parseInt(perPage || "10");

  // ✅ Construire les filtres Prisma
  const where: any = {};

  // Filtre recherche
  if (search) {
    where.OR = [
      { reference: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
      { requestedBy: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Filtre statut
  if (statusFilter !== "all") {
    where.status = statusFilter as InternalStatus;
  }

  // Filtre catégorie
  if (categoryFilter !== "all") {
    where.category = categoryFilter as InternalCategory;
  }

  // ✅ Compter le total (pour pagination)
  const totalCount = await prisma.internalRequest.count({ where });

  // ✅ Récupérer SEULEMENT les demandes de la page actuelle
  const internalRequests = await prisma.internalRequest.findMany({
    where,
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
    skip: (pageFilter - 1) * perPageFilter,
    take: perPageFilter,
  });

  // ✅ Statistiques (sans filtres pour avoir le total global)
  const stats = await prisma.internalRequest.groupBy({
    by: ["status"],
    _count: true,
  });

  const statsFormatted = {
    total: await prisma.internalRequest.count(),
    pending: stats.find((s) => s.status === InternalStatus.PENDING)?._count || 0,
    approved: stats.find((s) => s.status === InternalStatus.APPROVED)?._count || 0,
    completed: stats.find((s) => s.status === InternalStatus.COMPLETED)?._count || 0,
  };

  // Calcul pagination
  const totalPages = Math.ceil(totalCount / perPageFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Demandes Internes</h1>
        <p className="text-muted-foreground mt-1">
          Gestion des dépenses courantes (internet, électricité, etc.)
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
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {statsFormatted.pending}
            </div>
            <p className="text-xs text-muted-foreground">à valider</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsFormatted.approved}
            </div>
            <p className="text-xs text-muted-foreground">à finaliser</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalisées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statsFormatted.completed}
            </div>
            <p className="text-xs text-muted-foreground">terminées</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres (Client Component) */}
      <InternalRequestsFilters
        userRole={session.user.role}
        currentSearch={searchFilter}
        currentStatus={statusFilter}
        currentCategory={categoryFilter}
      />

      {/* Tableau avec pagination (Server Component) */}
      <InternalRequestsServerTable
        requests={internalRequests}
        totalCount={totalCount}
        currentPage={pageFilter}
        perPage={perPageFilter}
        totalPages={totalPages}
      />
    </div>
  );
}