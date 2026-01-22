"use client";

import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Role } from "@prisma/client";
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

import { roleLabels } from "@/lib/validations/user";
import UsersTable from "./_components/users-table";
import UserModal from "./_components/user-modal";


type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  departmentId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  _count: {
    purchaseRequests: number;
    approvals: number;
  };
};

type Department = {
  id: string;
  name: string;
  code: string;
};

type UsersClientProps = {
  initialUsers: User[];
  departments: Department[];
  currentUserId: string;
};

export default function UsersClient({
  initialUsers,
  departments,
  currentUserId,
}: UsersClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Filtrer les utilisateurs
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.department?.name.toLowerCase().includes(query);

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.isActive) ||
      (statusFilter === "inactive" && !user.isActive);
    const matchesDepartment =
      departmentFilter === "all" || user.departmentId === departmentFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
  });

  // Statistiques
  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
    byRole: {
      DIRECTEUR: users.filter((u) => u.role === Role.DIRECTEUR).length,
      ACHAT: users.filter((u) => u.role === Role.ACHAT).length,
      COMPTABLE: users.filter((u) => u.role === Role.COMPTABLE).length,
      USER: users.filter((u) => u.role === Role.USER).length,
    },
  };

  // Ouvrir le modal pour créer un utilisateur
  const handleCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  // Ouvrir le modal pour modifier un utilisateur
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  // Rafraîchir la liste après une action
  const handleRefresh = (updatedUser?: User) => {
    if (updatedUser) {
      setUsers((prev) => {
        const index = prev.findIndex((u) => u.id === updatedUser.id);
        if (index >= 0) {
          const newUsers = [...prev];
          newUsers[index] = updatedUser;
          return newUsers;
        }
        return [updatedUser, ...prev];
      });
    } else {
      // Recharger la page pour rafraîchir les données
      window.location.reload();
    }
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
    setDepartmentFilter("all");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    roleFilter !== "all" ||
    statusFilter !== "all" ||
    departmentFilter !== "all";

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
              <p className="text-xs text-muted-foreground">Utilisateurs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Comptes actifs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
              <p className="text-xs text-muted-foreground">Comptes désactivés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Directeurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.byRole.DIRECTEUR}
              </div>
              <p className="text-xs text-muted-foreground">Administrateurs</p>
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
                  placeholder="Rechercher un utilisateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Bouton créer */}
              <Button onClick={handleCreate} className="sm:w-auto cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                Nouvel utilisateur
              </Button>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtres :</span>
              </div>

              {/* Filtre Rôle */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-45">
                  <SelectValue placeholder="Tous les rôles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtre Statut */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-45">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtre Département */}
              <Select value={departmentFilter}  onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-50">
                  <SelectValue placeholder="Tous les départements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les départements</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
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
              {filteredUsers.length} résultat(s) sur {users.length} utilisateur(s)
            </div>
          </CardContent>
        </Card>

        {/* Tableau */}
        <UsersTable
          users={filteredUsers}
          currentUserId={currentUserId}
          onEdit={handleEdit}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Modal de création/modification */}
      <UserModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        user={editingUser}
        departments={departments}
        onSuccess={handleRefresh}
      />
    </>
  );
}