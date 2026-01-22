"use client";

import {
  ArrowLeft,
  Calendar,
  User,
  Building2,
  FileText,
  Package,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { RequestStatus, Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { statusLabels, statusColors } from "@/lib/validations/purchase-request";
import QuotesSection from "./_components/quotes-section";
import DirectorSection from "./_components/director-section";
import AccountantSection from "./_components/accountant-section";
import DocumentsSection from "./_components/documents-section";

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
  selectedQuoteId: string | null;
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
  items: {
    id: string;
    name: string;
    description: string | null;
    quantity: number;
    estimatedPrice: number;
  }[];
  quotes: {
    id: string;
    supplierName: string;
    supplierContact: string | null;
    totalAmount: number;
    validUntil: Date;
    notes: string | null;
    createdAt: Date;
  }[];
  approvals: {
    id: string;
    action: string;
    comment: string | null;
    createdAt: Date;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
  selectedQuote: {
    id: string;
    supplierName: string;
    totalAmount: number;
  } | null;
};

type RequestDetailsClientProps = {
  request: PurchaseRequest;
  currentUserId: string;
  userRole: string;
};

export default function RequestDetailsClient({
  request,
  currentUserId,
  userRole,
}: RequestDetailsClientProps) {
  const router = useRouter();

  // Formater le montant
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculer le total des items
  const totalItems = request.items.reduce(
    (sum, item) => sum + item.quantity * item.estimatedPrice,
    0
  );

  return (
    <div className="space-y-6">
      {/* Bouton retour */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>

      {/* En-tête */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <code className="text-xl font-mono font-bold">
                  {request.reference}
                </code>
              </div>
              <h1 className="text-2xl font-bold">{request.title}</h1>
              {request.description && (
                <p className="text-muted-foreground">{request.description}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Badge
                variant="secondary"
                className={`${statusColors[request.status]} text-center`}
              >
                {statusLabels[request.status]}
              </Badge>
              <p className="text-xs text-muted-foreground text-center">
                Créée{" "}
                {formatDistanceToNow(new Date(request.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Informations demandeur */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations du demandeur
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Nom</p>
            <p className="font-medium">{request.user.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{request.user.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Département</p>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{request.department.name}</span>
              <code className="text-xs text-muted-foreground">
                ({request.department.code})
              </code>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date de demande</p>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {new Date(request.createdAt).toLocaleDateString("fr-FR", {
                  dateStyle: "long",
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Articles demandés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Articles demandés ({request.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {request.items.map((item, index) => (
              <div key={item.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-medium">
                        {formatCurrency(item.quantity * item.estimatedPrice)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {formatCurrency(item.estimatedPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Total estimé :</span>
              <span className="text-2xl font-bold">
                {formatCurrency(totalItems)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Devis (visible pour ACHAT et DIRECTEUR) */}
      {(userRole === Role.ACHAT || userRole === Role.DIRECTEUR) && (
        <QuotesSection request={request} userRole={userRole} />
      )}

      {/* Section Validation Directeur */}
      <DirectorSection request={request} userRole={userRole} />

      <AccountantSection request={request} userRole={userRole} />

      {/* Section Documents (visible pour tous) */}
<DocumentsSection request={request} userRole={userRole} />


      {/* Timeline des approbations */}
      {request.approvals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des approbations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {request.approvals.map((approval) => (
                <div key={approval.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        approval.action === "APPROVE"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                    <div className="w-px h-full bg-border" />
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{approval.user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {approval.action === "APPROVE"
                            ? "Approuvé"
                            : "Rejeté"}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(approval.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                    {approval.comment && (
                      <p className="mt-2 text-sm text-muted-foreground italic">
                        "{approval.comment}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
