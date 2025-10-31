import { Badge } from "@/components/ui/badge";

const statusConfig = {
  open: {
    label: "Aberto",
    variant: "default" as const,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  in_progress: {
    label: "Em Andamento",
    variant: "default" as const,
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  resolved: {
    label: "Resolvido",
    variant: "default" as const,
    className: "bg-green-100 text-green-800 border-green-200",
  },
  closed: {
    label: "Fechado",
    variant: "default" as const,
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
};

interface TicketStatusBadgeProps {
  status: keyof typeof statusConfig;
}

export function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
