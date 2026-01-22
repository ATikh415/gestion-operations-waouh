// src/app/(dashboard)/departments/departments-client.tsx

"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DepartmentsTable from "./departments-table";
import DepartmentModal from "./department-modal";


type Department = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    users: number;
    purchaseRequests: number;
  };
};

type DepartmentsClientProps = {
  initialDepartments: Department[];
};

export default function DepartmentsClient({ initialDepartments }: DepartmentsClientProps) {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  // Filtrer les départements par recherche
  const filteredDepartments = departments.filter((dept) => {
    const query = searchQuery.toLowerCase();
    return (
      dept.name.toLowerCase().includes(query) ||
      dept.code.toLowerCase().includes(query) ||
      dept.description?.toLowerCase().includes(query)
    );
  });

  // Statistiques
  const stats = {
    total: departments.length,
    active: departments.filter((d) => d.isActive).length,
    inactive: departments.filter((d) => !d.isActive).length,
  };

  // Ouvrir le modal pour créer un département
  const handleCreate = () => {
    setEditingDepartment(null);
    setIsModalOpen(true);
  };

  // Ouvrir le modal pour modifier un département
  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setIsModalOpen(true);
  };

  // Rafraîchir la liste après une action
  const handleRefresh = (updatedDepartment?: Department) => {
    if (updatedDepartment) {
      setDepartments((prev) => {
        const index = prev.findIndex((d) => d.id === updatedDepartment.id);
        if (index >= 0) {
          const newDepartments = [...prev];
          newDepartments[index] = updatedDepartment;
          return newDepartments;
        }
        return [updatedDepartment, ...prev];
      });
    } else {
      // Recharger la page pour rafraîchir les données
      window.location.reload();
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Départements</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">En service</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
              <p className="text-xs text-muted-foreground">Désactivés</p>
            </CardContent>
          </Card>
        </div>

        {/* Barre d'actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Recherche */}
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un département..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Bouton créer */}
              <Button onClick={handleCreate} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau département
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tableau */}
        <DepartmentsTable
          departments={filteredDepartments}
          onEdit={handleEdit}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Modal de création/modification */}
      <DepartmentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        department={editingDepartment}
        onSuccess={handleRefresh}
      />
    </>
  );
}