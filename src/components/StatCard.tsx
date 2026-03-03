import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: string;
  trendDirection?: 'up' | 'down';
  emptyStateAction?: {
    label: string;
    onClick: () => void;
  };
}

export const StatCard = ({ icon: Icon, label, value, trend, trendDirection, emptyStateAction }: StatCardProps) => {
  const isEmpty = value === "R$ 0,00" || value === "Nenhuma" || value === "0";

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-white/[0.06] shadow-lg hover:border-white/[0.1] transition-all group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">{label}</p>
          <div className="h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center group-hover:bg-[hsl(45,60%,58%)]/10 transition-colors">
            <Icon className="h-4 w-4 text-muted-foreground group-hover:text-[hsl(45,60%,58%)] transition-colors" strokeWidth={1.5} />
          </div>
        </div>
        <p className="text-3xl font-display font-semibold text-foreground tracking-tight tabular-nums mb-2">{value}</p>
        {trend && (
          <p className={`text-[10px] font-mono tracking-wide ${trendDirection === 'up' ? 'text-success' : trendDirection === 'down' ? 'text-destructive' : 'text-muted-foreground'}`}>
            {trend}
          </p>
        )}
        {isEmpty && emptyStateAction && (
          <button
            onClick={emptyStateAction.onClick}
            className="mt-3 text-xs font-medium text-[hsl(45,60%,58%)] hover:text-[hsl(45,60%,68%)] transition-colors flex items-center gap-1.5 group/btn"
          >
            <span>{emptyStateAction.label}</span>
            <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
          </button>
        )}
      </CardContent>
    </Card>
  );
};
