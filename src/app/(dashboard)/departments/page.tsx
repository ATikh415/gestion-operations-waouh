
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { getDepartmentsAction } from "@/lib/actions/department";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DepartmentsClient from "./_components/departments-client";

/**
 * Page de gestion des départements
 * Réservée aux DIRECTEURS
 */
export default async function DepartmentsPage() {
  // Vérifier l'authentification et les permissions
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== Role.DIRECTEUR) {
    redirect("/dashboard");
  }

  // Récupérer les départements
  const result = await getDepartmentsAction();

  if (!result.success) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-destructive">{result.error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Départements</h1>
          <p className="text-muted-foreground">
            Gérez les départements de votre entreprise
          </p>
        </div>
      </div>

      <Suspense fallback={<DepartmentsSkeleton />}>
        <DepartmentsClient initialDepartments={result.data} />
      </Suspense>
    </div>
  );
}

/**
 * Skeleton de chargement
 */
function DepartmentsSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}