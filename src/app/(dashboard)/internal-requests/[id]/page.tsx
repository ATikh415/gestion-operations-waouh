
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import InternalRequestClient from "./internal-request-client";


export const metadata = {
  title: "Détails Demande Interne | Gestion des Achats",
};

type PageProps = {
  params: {
    id: string;
  };
};

export default async function InternalRequestDetailPage({
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

  // Vérifier les permissions (ACHAT ou DIRECTEUR uniquement)
  if (
    session.user.role !== Role.ACHAT &&
    session.user.role !== Role.DIRECTEUR
  ) {
    redirect("/dashboard");
  }

//   console.log({params});
  

  // Récupérer la demande interne
  const internalRequest = await prisma.internalRequest.findUnique({
    where: { id },
    include: {
      requestedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      documents: {
        include: {
          uploadedBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      approvals: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!internalRequest) {
    notFound();
  }

  return (
    <InternalRequestClient
      request={internalRequest}
      userRole={session.user.role}
    />
  );
}