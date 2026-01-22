
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { getUsersAction, getDepartmentsForSelectAction } from "@/lib/actions/user";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import UsersClient from "./users-client";

/**
 * Page de gestion des utilisateurs
 * Réservée aux DIRECTEURS
 */
export default async function UsersPage() {
  // Vérifier l'authentification et les permissions
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== Role.DIRECTEUR) {
    redirect("/dashboard");
  }

  // Récupérer les utilisateurs et les départements
  const [usersResult, departmentsResult] = await Promise.all([
    getUsersAction(),
    getDepartmentsForSelectAction(),
  ]);

  if (!usersResult.success) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-destructive">{usersResult.error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez les comptes utilisateurs de votre entreprise
          </p>
        </div>
      </div>

      <Suspense fallback={<UsersSkeleton />}>
        <UsersClient
          initialUsers={usersResult.data}
          departments={departmentsResult.data || []}
          currentUserId={session.user.id}
        />
      </Suspense>
    </div>
  );
}

/**
 * Skeleton de chargement
 */
function UsersSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}