import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3, Activity, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MarketInfoCardProps {
  isLoading: boolean;
  dailyChangePercent: number;
  volumeUSDT: number;
  highPrice24h: number;
  lowPrice24h: number;
  tradesCount: number;
  lastUpdate: Date;
}

const MarketInfoCard = ({
  isLoading,
  dailyChangePercent,
  volumeUSDT,
  highPrice24h,
  lowPrice24h,
  tradesCount,
  lastUpdate,
}: MarketInfoCardProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Informações de Mercado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Carregando dados...
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositiveChange = dailyChangePercent >= 0;
  const priceChange = highPrice24h - lowPrice24h;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span>Informações de Mercado</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            AO VIVO
          </div>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          USDT/BRL - Binance • Últimas 24 horas
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Volume e Variação */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              Volume Diário
            </div>
            <p className="text-2xl font-bold text-foreground">
              {volumeUSDT.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              <span className="text-sm font-normal text-muted-foreground ml-1">USDT</span>
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isPositiveChange ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              Variação 24h
            </div>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${isPositiveChange ? 'text-success' : 'text-destructive'}`}>
                {isPositiveChange ? '+' : ''}{dailyChangePercent.toFixed(2)}%
              </p>
              <span className={`text-sm ${isPositiveChange ? 'text-success' : 'text-destructive'}`}>
                (R$ {priceChange.toFixed(3)})
              </span>
            </div>
          </div>
        </div>

        {/* Máxima e Mínima */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">📈 Máxima 24h</p>
            <p className="text-xl font-semibold text-success">
              R$ {highPrice24h.toFixed(3)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">📉 Mínima 24h</p>
            <p className="text-xl font-semibold text-destructive">
              R$ {lowPrice24h.toFixed(3)}
            </p>
          </div>
        </div>

        {/* Atividade e Timestamp */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">🔥 Atividade</p>
            <p className="text-lg font-semibold text-foreground">
              {tradesCount.toLocaleString('pt-BR')}
              <span className="text-sm font-normal text-muted-foreground ml-1">trades</span>
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              Atualizado
            </div>
            <p className="text-sm font-medium text-foreground">
              {formatDistanceToNow(lastUpdate, { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </p>
          </div>
        </div>

        {/* Botão para Gráfico Completo */}
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => navigate('/quote')}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Ver Gráfico Completo
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default MarketInfoCard;
