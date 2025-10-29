import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: string;
  trendDirection?: 'up' | 'down';
}

export const StatCard = ({ icon: Icon, label, value, trend, trendDirection }: StatCardProps) => {
  return (
    <Card className="bg-glass backdrop-blur-md border-glass shadow-lg hover:shadow-institutional transition-premium hover:-translate-y-1">
      <CardContent className="pt-6 pb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
        <p className="text-3xl font-playfair font-bold text-foreground mb-1">{value}</p>
        {trend && (
          <p className={`text-xs font-medium ${trendDirection === 'up' ? 'text-success' : 'text-danger'}`}>
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
