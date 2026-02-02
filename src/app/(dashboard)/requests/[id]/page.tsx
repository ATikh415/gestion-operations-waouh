// src/app/(dashboard)/requests/page.tsx

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ActionResponse } from "@/lib/actions/purchase-request";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import RequestDetailsClient from "./request-details-client";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";


/**
 * Récupérer une demande d'achat par son ID
 */
export async function getPurchaseRequestByIdAction(
  id: string
): Promise<ActionResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Non authentifié" };
    }

    // Import dynamique de Prisma

    const request = await prisma.purchaseRequest.findUnique({
      where: { id },
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
        quotes: true,
        approvals: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        documents: true,
        selectedQuote: true,
      },
    });

    if (!request) {
      return { success: false, error: "Demande non trouvée" };
    }

    // Vérifier les permissions
    if (
      session.user.role === Role.USER &&
      request.userId !== session.user.id
    ) {
      return { success: false, error: "Accès refusé" };
    }

    return { success: true, data: request };
  } catch (error) {
    console.error("Erreur getPurchaseRequestByIdAction:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération de la demande",
    };
  }
}

/**
 * Page de gestion des demandes d'achat
 * Accessible à tous les utilisateurs authentifiés
 */
export default async function RequestsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Vérifier l'authentification
  const session = await auth();
  const { id } = await params

  if (!session?.user) {
    redirect("/login");
  }

  // Récupérer les demandes
  const result = await getPurchaseRequestByIdAction(id);

  // console.log({id}, {"rst": result.data});
  

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
        <RequestDetailsClient
        request={result.data}
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