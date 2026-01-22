// src/app/(dashboard)/requests/page.tsx

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPurchaseRequestsAction } from "@/lib/actions/purchase-request";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import RequestsClient from "./requests-client";

/**
 * Page de gestion des demandes d'achat
 * Accessible à tous les utilisateurs authentifiés
 */
export default async function RequestsPage() {
  // Vérifier l'authentification
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Récupérer les demandes
  const result = await getPurchaseRequestsAction();

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
          <h1 className="text-3xl font-bold tracking-tight">Demandes d'achat</h1>
          <p className="text-muted-foreground">
            {session.user.role === "USER"
              ? "Gérez vos demandes d'achat de matériels"
              : "Consultez et gérez les demandes d'achat"}
          </p>
        </div>
      </div>

      <Suspense fallback={<RequestsSkeleton />}>
        <RequestsClient
          initialRequests={result.data}
          currentUserId={session.user.id}
          userRole={session.user.role}
        />
      </Suspense>
    </div>
  );
}

/**
 * Skeleton de chargement
 */
function RequestsSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}