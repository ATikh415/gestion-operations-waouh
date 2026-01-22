
import { InternalStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, Package } from "lucide-react";

type InternalStatusBadgeProps = {
  status: InternalStatus;
};

export default function InternalStatusBadge({ status }: InternalStatusBadgeProps) {
  const statusConfig = {
    [InternalStatus.PENDING]: {
      label: "En attente",
      variant: "secondary" as const,
      icon: Clock,
      className: "bg-amber-100 text-amber-800 border-amber-200",
    },
    [InternalStatus.APPROVED]: {
      label: "Approuvée",
      variant: "secondary" as const,
      icon: CheckCircle,
      className: "bg-green-100 text-green-800 border-green-200",
    },
    [InternalStatus.REJECTED]: {
      label: "Rejetée",
      variant: "destructive" as const,
      icon: XCircle,
      className: "bg-red-100 text-red-800 border-red-200",
    },
    [InternalStatus.COMPLETED]: {
      label: "Finalisée",
      variant: "secondary" as const,
      icon: Package,
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}