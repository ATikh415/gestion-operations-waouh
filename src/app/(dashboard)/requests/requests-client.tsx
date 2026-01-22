
"use client";

import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { RequestStatus, Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { statusLabels } from "@/lib/validations/purchase-request";
import RequestsTable from "./_components/requests-table";
import RequestModal from "./_components/request-modal";

type PurchaseRequest = {
  id: string;
  reference: string;
  title: string;
  description: string | null;
  status: RequestStatus;
  totalEstimated: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  departmentId: string;
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

type RequestsClientProps = {
  initialRequests: PurchaseRequest[];
  currentUserId: string;
  userRole: string;
};

export default function RequestsClient({
  initialRequests,
  currentUserId,
  userRole,
}: RequestsClientProps) {
  const [requests, setRequests] = useState<PurchaseRequest[]>(initialRequests);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<PurchaseRequest | null>(null);

  // Filtrer les demandes
  const filteredRequests = requests.filter((request) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      request.reference.toLowerCase().includes(query) ||
      request.title.toLowerCase().includes(query) ||
      request.department.name.toLowerCase().includes(query);

    const matchesStatus = statusFilter === "all" || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Statistiques
  const stats = {
    total: requests.length,
    draft: requests.filter((r) => r.status === RequestStatus.DRAFT).length,
    pending: requests.filter((r) => r.status === RequestStatus.PENDING).length,
    completed: requests.filter((r) => r.status === RequestStatus.COMPLETED).length,
  };

  // Ouvrir le modal pour créer une demande
  const handleCreate = () => {
    setEditingRequest(null);
    setIsModalOpen(true);
  };

  // Ouvrir le modal pour modifier une demande
  const handleEdit = (request: PurchaseRequest) => {
    setEditingRequest(request);
    setIsModalOpen(true);
  };

  // Rafraîchir la liste après une action
  const handleRefresh = (updatedRequest?: PurchaseRequest) => {
    if (updatedRequest) {
      setRequests((prev) => {
        const index = prev.findIndex((r) => r.id === updatedRequest.id);
        if (index >= 0) {
          const newRequests = [...prev];
          newRequests[index] = updatedRequest;
          return newRequests;
        }
        return [updatedRequest, ...prev];
      });
    } else {
      // Recharger la page pour rafraîchir les données
      window.location.reload();
    }
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all";

  return (
    <>
      <div className="space-y-6">
        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Demandes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Brouillons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
              <p className="text-xs text-muted-foreground">Non soumises</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">En traitement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Finalisées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">Terminées</p>
            </CardContent>
          </Card>
        </div>

        {/* Barre de recherche et filtres */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Recherche */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par référence, titre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Bouton créer (seulement pour USER) */}
              {userRole === Role.USER && (
                <Button onClick={handleCreate} className="sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle demande
                </Button>
              )}
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtres :</span>
              </div>

              {/* Filtre Statut */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-50">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Bouton réinitialiser */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-9"
                >
                  Réinitialiser
                </Button>
              )}
            </div>

            {/* Résultats */}
            <div className="text-sm text-muted-foreground">
              {filteredRequests.length} résultat(s) sur {requests.length} demande(s)
            </div>
          </CardContent>
        </Card>

        {/* Tableau */}
        <RequestsTable
          requests={filteredRequests}
          currentUserId={currentUserId}
          userRole={userRole}
          onEdit={handleEdit}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Modal de création/modification */}
      {userRole === Role.USER && (
        <RequestModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          request={editingRequest}
          onSuccess={handleRefresh}
        />
      )}
    </>
  );
}