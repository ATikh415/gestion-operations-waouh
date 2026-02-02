// src/app/(dashboard)/requests/_components/requests-filters.tsx

"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Filter } from "lucide-react";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { statusLabels } from "@/lib/validations/purchase-request";
import RequestModal from "./request-modal";

type RequestsFiltersProps = {
  userRole: string;
  currentSearch: string;
  currentStatus: string;
};

export default function RequestsFilters({
  userRole,
  currentSearch,
  currentStatus,
}: RequestsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchValue, setSearchValue] = useState(currentSearch);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mettre à jour les paramètres URL
  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset page à 1 quand on change les filtres
    params.set("page", "1");

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  // Recherche
  const handleSearch = (value: string) => {
    setSearchValue(value);
    updateFilters({ search: value });
  };

  // Réinitialiser
  const handleReset = () => {
    setSearchValue("");
    startTransition(() => {
      router.push("/requests");
    });
  };

  const hasActiveFilters = currentSearch !== "" || currentStatus !== "all";

  return (
    <>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Recherche */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par référence, titre, département..."
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Bouton créer (si USER) */}
            {userRole === Role.USER && (
              <Button onClick={() => setIsModalOpen(true)} className="sm:w-auto">
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
            <Select
              value={currentStatus}
              onValueChange={(value) => updateFilters({ status: value })}
              disabled={isPending}
            >
              <SelectTrigger className="w-45">
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
                onClick={handleReset}
                disabled={isPending}
                className="h-9"
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal création (si USER) */}
      {userRole === Role.USER && (
        <RequestModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          request={null}
          onSuccess={() => {
            setIsModalOpen(false);
            router.refresh(); // ✅ Rafraîchir les données serveur
          }}
        />
      )}
    </>
  );
}