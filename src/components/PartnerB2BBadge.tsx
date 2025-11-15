import { Badge } from "@/components/ui/badge";
import { Building2, Sparkles } from "lucide-react";

interface PartnerB2BBadgeProps {
  markupPercent?: string;
  className?: string;
}

export function PartnerB2BBadge({ markupPercent, className }: PartnerB2BBadgeProps) {
  return (
    <Badge variant="default" className={`gap-2 ${className}`}>
      <Sparkles className="h-3 w-3" />
      Parceiro B2B {markupPercent && `• ${markupPercent}%`}
    </Badge>
  );
}
