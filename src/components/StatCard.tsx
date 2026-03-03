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
    <Card className="bg-card border-white/5 shadow-lg hover:border-white/10 transition-all hover:bg-card/80 group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{label}</p>
          <Icon className="h-4 w-4 text-muted-foreground group-hover:text-tkb-cyan transition-colors" strokeWidth={1.5} />
        </div>
        <p className="text-3xl font-display font-medium text-foreground tracking-tight tabular-nums mb-2">{value}</p>
        {trend && (
          <p className={`text-[10px] uppercase font-mono tracking-wider ${trendDirection === 'up' ? 'text-success/80' : 'text-danger/80'}`}>
            {trend}
          </p>
        )}
        {isEmpty && emptyStateAction && (
          <button
            onClick={emptyStateAction.onClick}
            className="mt-3 text-xs font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1 group"
          >
            <span>{emptyStateAction.label}</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        )}
      </CardContent>
    </Card>
  );
};
