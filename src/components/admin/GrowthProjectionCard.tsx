import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, Calendar, BarChart3 } from "lucide-react";
import { format, startOfWeek, startOfMonth, subWeeks, subMonths, parseISO, isWithinInterval, endOfWeek, endOfMonth, isSameWeek, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ReferenceLine,
} from "recharts";

interface Withdrawal {
  id: string;
  amount: number;
  fee: number;
  currency: string;
  network: string;
  status: string;
  timestamp: string;
  txId?: string;
  toAddress: string;
  alias: string | null;
}

interface GrowthProjectionCardProps {
  withdrawals: Withdrawal[];
  loading?: boolean;
}

interface WeeklyData {
  week: string;
  weekLabel: string;
  total: number;
  count: number;
  avgTicket: number;
}

interface MonthlyData {
  month: string;
  monthLabel: string;
  total: number;
  count: number;
  avgTicket: number;
}

export const GrowthProjectionCard = ({ withdrawals, loading }: GrowthProjectionCardProps) => {
  // Calculate weekly data for the last 8 weeks
  const weeklyData = useMemo(() => {
    if (!withdrawals.length) return [];
    
    const weeks: WeeklyData[] = [];
    const now = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      const weekWithdrawals = withdrawals.filter(w => {
        const date = parseISO(w.timestamp);
        return isWithinInterval(date, { start: weekStart, end: weekEnd });
      });
      
      const total = weekWithdrawals.reduce((sum, w) => sum + w.amount, 0);
      const count = weekWithdrawals.length;
      
      weeks.push({
        week: format(weekStart, 'yyyy-MM-dd'),
        weekLabel: format(weekStart, "dd/MM", { locale: ptBR }),
        total,
        count,
        avgTicket: count > 0 ? total / count : 0,
      });
    }
    
    return weeks;
  }, [withdrawals]);

  // Calculate monthly data for the last 6 months
  const monthlyData = useMemo(() => {
    if (!withdrawals.length) return [];
    
    const months: MonthlyData[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(monthStart);
      
      const monthWithdrawals = withdrawals.filter(w => {
        const date = parseISO(w.timestamp);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });
      
      const total = monthWithdrawals.reduce((sum, w) => sum + w.amount, 0);
      const count = monthWithdrawals.length;
      
      months.push({
        month: format(monthStart, 'yyyy-MM'),
        monthLabel: format(monthStart, "MMM/yy", { locale: ptBR }),
        total,
        count,
        avgTicket: count > 0 ? total / count : 0,
      });
    }
    
    return months;
  }, [withdrawals]);

  // Calculate growth metrics
  const growthMetrics = useMemo(() => {
    // Weekly growth (current week vs previous week)
    const currentWeek = weeklyData[weeklyData.length - 1];
    const previousWeek = weeklyData[weeklyData.length - 2];
    
    let weeklyGrowth = 0;
    if (previousWeek && previousWeek.total > 0 && currentWeek) {
      weeklyGrowth = ((currentWeek.total - previousWeek.total) / previousWeek.total) * 100;
    }
    
    // Monthly growth (current month vs previous month)
    const currentMonth = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData[monthlyData.length - 2];
    
    let monthlyGrowth = 0;
    if (previousMonth && previousMonth.total > 0 && currentMonth) {
      monthlyGrowth = ((currentMonth.total - previousMonth.total) / previousMonth.total) * 100;
    }
    
    // Average weekly volume (last 4 weeks)
    const last4Weeks = weeklyData.slice(-4);
    const avgWeeklyVolume = last4Weeks.reduce((sum, w) => sum + w.total, 0) / Math.max(last4Weeks.length, 1);
    
    // Average monthly volume (last 3 months)
    const last3Months = monthlyData.slice(-3);
    const avgMonthlyVolume = last3Months.reduce((sum, m) => sum + m.total, 0) / Math.max(last3Months.length, 1);
    
    // Projection for next month (based on trend)
    const monthlyTrend = monthlyData.length >= 2 
      ? (monthlyData[monthlyData.length - 1]?.total || 0) - (monthlyData[monthlyData.length - 2]?.total || 0)
      : 0;
    const projectedNextMonth = Math.max(0, (currentMonth?.total || 0) + monthlyTrend);
    
    return {
      weeklyGrowth,
      monthlyGrowth,
      avgWeeklyVolume,
      avgMonthlyVolume,
      currentWeekVolume: currentWeek?.total || 0,
      currentMonthVolume: currentMonth?.total || 0,
      projectedNextMonth,
      weeklyTransactions: currentWeek?.count || 0,
      monthlyTransactions: currentMonth?.count || 0,
    };
  }, [weeklyData, monthlyData]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const GrowthIndicator = ({ value, size = "default" }: { value: number; size?: "small" | "default" }) => {
    const isPositive = value > 0;
    const isNeutral = Math.abs(value) < 1;
    
    const iconClass = size === "small" ? "h-3 w-3" : "h-4 w-4";
    const textClass = size === "small" ? "text-xs" : "text-sm font-medium";
    
    if (isNeutral) {
      return (
        <span className={`flex items-center gap-1 text-muted-foreground ${textClass}`}>
          <Minus className={iconClass} />
          {Math.abs(value).toFixed(1)}%
        </span>
      );
    }
    
    return (
      <span className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'} ${textClass}`}>
        {isPositive ? <TrendingUp className={iconClass} /> : <TrendingDown className={iconClass} />}
        {isPositive ? '+' : ''}{value.toFixed(1)}%
      </span>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!withdrawals.length) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Carregue os dados de saques para ver a projeção de crescimento</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-primary font-bold">
            {formatCurrency(payload[0].value)} USDT
          </p>
          {payload[0].payload.count !== undefined && (
            <p className="text-xs text-muted-foreground">
              {payload[0].payload.count} operações
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Growth Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Esta Semana</p>
                <p className="text-xl font-bold mt-1">
                  {formatCurrency(growthMetrics.currentWeekVolume)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">USDT</span>
                </p>
                <div className="mt-1">
                  <GrowthIndicator value={growthMetrics.weeklyGrowth} size="small" />
                </div>
              </div>
              <Calendar className="h-5 w-5 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Este Mês</p>
                <p className="text-xl font-bold mt-1">
                  {formatCurrency(growthMetrics.currentMonthVolume)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">USDT</span>
                </p>
                <div className="mt-1">
                  <GrowthIndicator value={growthMetrics.monthlyGrowth} size="small" />
                </div>
              </div>
              <BarChart3 className="h-5 w-5 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Média Semanal</p>
                <p className="text-xl font-bold mt-1">
                  {formatCurrency(growthMetrics.avgWeeklyVolume)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">USDT</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  últimas 4 semanas
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Projeção Próx. Mês</p>
                <p className="text-xl font-bold mt-1">
                  {formatCurrency(growthMetrics.projectedNextMonth)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">USDT</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  baseado na tendência
                </p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Volume Semanal (últimas 8 semanas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="weekLabel" 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine 
                    y={growthMetrics.avgWeeklyVolume} 
                    stroke="hsl(var(--success))" 
                    strokeDasharray="5 5"
                    label={{ value: 'Média', position: 'right', fontSize: 10 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#weeklyGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Volume Mensal (últimos 6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="monthLabel" 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine 
                    y={growthMetrics.avgMonthlyVolume} 
                    stroke="hsl(var(--success))" 
                    strokeDasharray="5 5"
                    label={{ value: 'Média', position: 'right', fontSize: 10 }}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="hsl(var(--chart-1))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Analysis */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Análise de Crescimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Crescimento Semanal</span>
              </div>
              <div className="flex items-baseline gap-2">
                <GrowthIndicator value={growthMetrics.weeklyGrowth} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Comparado à semana anterior
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-orange-500" />
                <span className="font-medium text-sm">Crescimento Mensal</span>
              </div>
              <div className="flex items-baseline gap-2">
                <GrowthIndicator value={growthMetrics.monthlyGrowth} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Comparado ao mês anterior
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-success" />
                <span className="font-medium text-sm">Operações</span>
              </div>
              <p className="text-lg font-bold">
                {growthMetrics.monthlyTransactions}
                <span className="text-sm font-normal text-muted-foreground ml-1">este mês</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {growthMetrics.weeklyTransactions} esta semana
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
