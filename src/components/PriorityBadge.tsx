import { Badge } from "@/components/ui/badge";

const priorityConfig = {
  low: {
    label: "Baixa",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  medium: {
    label: "Média",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  high: {
    label: "Alta",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  urgent: {
    label: "Urgente",
    className: "bg-red-600 text-white border-red-700 animate-pulse",
  },
};

interface PriorityBadgeProps {
  priority: keyof typeof priorityConfig;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
}
