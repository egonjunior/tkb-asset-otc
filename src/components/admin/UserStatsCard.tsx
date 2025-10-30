import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, TrendingUp, Calendar } from "lucide-react";

interface UserStatsCardProps {
  fullName: string;
  documentType: string;
  documentNumber: string;
  totalOrders: number;
  totalVolume: number;
  lastActivity?: string;
}

export function UserStatsCard({
  fullName,
  documentType,
  documentNumber,
  totalOrders,
  totalVolume,
  lastActivity,
}: UserStatsCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const maskDocument = (doc: string) => {
    if (doc.length <= 4) return doc;
    return `***${doc.slice(-4)}`;
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Há 1 dia';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `Há ${Math.floor(diffDays / 30)} meses`;
    return `Há ${Math.floor(diffDays / 365)} anos`;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base">{fullName}</h3>
              <p className="text-sm text-muted-foreground">
                {documentType} {maskDocument(documentNumber)}
              </p>
            </div>
          </div>
          {totalVolume >= 1000000 && (
            <Badge variant="default" className="bg-primary">
              VIP
            </Badge>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              Volume Total
            </div>
            <p className="text-sm font-semibold">{formatCurrency(totalVolume)}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              Ordens
            </div>
            <p className="text-sm font-semibold">{totalOrders} completadas</p>
          </div>
        </div>

        {lastActivity && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Última atividade: {formatDate(lastActivity)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}