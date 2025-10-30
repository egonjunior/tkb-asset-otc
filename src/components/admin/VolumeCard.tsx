import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown } from "lucide-react";

type VolumePeriod = 'day' | 'week' | 'month' | 'all';

interface VolumeCardProps {
  orders: Array<{ total: number; status: string; created_at: string }>;
  period: VolumePeriod;
  onPeriodChange: (period: VolumePeriod) => void;
}

export function VolumeCard({ orders, period, onPeriodChange }: VolumeCardProps) {
  const calculateVolume = (selectedPeriod: VolumePeriod) => {
    const now = new Date();
    let startDate: Date;
    
    switch (selectedPeriod) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }
    
    return orders
      .filter(o => o.status === 'completed' && new Date(o.created_at) >= startDate)
      .reduce((sum, o) => sum + Number(o.total), 0);
  };

  const currentVolume = calculateVolume(period);
  const previousVolume = calculateVolume(
    period === 'day' ? 'week' : 
    period === 'week' ? 'month' : 
    period === 'month' ? 'all' : 'all'
  );
  
  const percentageChange = previousVolume > 0 
    ? ((currentVolume - previousVolume) / previousVolume) * 100 
    : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'day': return 'Hoje';
      case 'week': return 'Últimos 7 dias';
      case 'month': return 'Últimos 30 dias';
      case 'all': return 'Todo período';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Volume</CardTitle>
        <Tabs value={period} onValueChange={(v) => onPeriodChange(v as VolumePeriod)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="day" className="text-xs">Dia</TabsTrigger>
            <TabsTrigger value="week" className="text-xs">Semana</TabsTrigger>
            <TabsTrigger value="month" className="text-xs">Mês</TabsTrigger>
            <TabsTrigger value="all" className="text-xs">Total</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(currentVolume)}</div>
        <p className="text-xs text-muted-foreground mt-1">{getPeriodLabel()}</p>
        {period !== 'all' && (
          <div className="flex items-center mt-2 text-xs">
            {percentageChange >= 0 ? (
              <>
                <TrendingUp className="h-3 w-3 text-success mr-1" />
                <span className="text-success">+{percentageChange.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3 text-destructive mr-1" />
                <span className="text-destructive">{percentageChange.toFixed(1)}%</span>
              </>
            )}
            <span className="ml-1 text-muted-foreground">vs período anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}