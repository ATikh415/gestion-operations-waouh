// src/app/(dashboard)/internal-requests/[id]/internal-request-client.tsx

"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Calendar, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  internalCategoryLabels,
  internalCategoryIcons,
} from "@/lib/validations/internal-request";
import InternalStatusBadge from "../_components/internal-status-badge";
import ApproveSection from "./_components/approve-section";
import FinalizeSection from "./_components/finalize-section";
import { InternalCategory } from "@prisma/client";

type InternalRequestClientProps = {
  request: any;
  userRole: string;
};

export default function InternalRequestClient({
  request,
  userRole,
}: InternalRequestClientProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/internal-requests">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{request.reference}</h1>
              <InternalStatusBadge status={request.status} />
            </div>
            <p className="text-muted-foreground">{request.title}</p>
          </div>
        </div>
      </div>

      {/* Informations principales */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Détails */}
        <Card>
          <CardHeader>
            <CardTitle>Détails de la demande</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Catégorie */}
            <div className="flex items-center gap-3">
              <span className="text-3xl">
{internalCategoryIcons[request.category as InternalCategory]}

              </span>
              <div>
                <p className="text-sm text-muted-foreground">Catégorie</p>
                <p className="font-semibold">
                  {internalCategoryLabels[request.category as InternalCategory]}
                </p>
              </div>
            </div>

            {/* Montant */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Montant</p>
              <p className="text-3xl font-bold">
                {formatCurrency(request.amount)}
              </p>
            </div>

            {/* Description */}
            {request.description && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">{request.description}</p>
              </div>
            )}

            {/* Métadonnées */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Demandeur :</span>
                <span className="font-medium">{request.requestedBy.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Créée le :</span>
                <span className="font-medium">{formatDate(request.createdAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline des approbations */}
        <Card>
          <CardHeader>
            <CardTitle>Historique</CardTitle>
          </CardHeader>
          <CardContent>
            {request.approvals && request.approvals.length > 0 ? (
              <div className="space-y-4">
                {request.approvals.map((approval: any) => (
                  <div key={approval.id} className="flex gap-3">
                    <div className="shrink-0">
                      {approval.action === "APPROVE" ? (
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-600 text-sm">✓</span>
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-red-600 text-sm">✗</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {approval.action === "APPROVE" ? "Approuvée" : "Rejetée"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        par {approval.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(approval.createdAt)}
                      </p>
                      {approval.comment && (
                        <p className="text-sm mt-2 bg-muted p-2 rounded">
                          {approval.comment}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun historique disponible
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section Approbation (DIRECTEUR + PENDING) */}
      <ApproveSection request={request} userRole={userRole} />

      {/* Section Finalisation (ACHAT + APPROVED) */}
      <FinalizeSection request={request} userRole={userRole} />

      {/* Documents (si COMPLETED) */}
      {request.status === "COMPLETED" && request.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents ({request.documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {request.documents.map((doc: any) => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Ajouté le {formatDate(doc.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(doc.fileUrl, "_blank")}
                      >
                        Télécharger
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}