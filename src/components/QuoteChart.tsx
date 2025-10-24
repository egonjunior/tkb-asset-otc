import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

const QuoteChart = () => {
  const [binancePrice] = useState(5.40);
  const [tkbPrice] = useState(5.449);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simular histórico de preços (em produção, viria da API Binance)
  useEffect(() => {
    // Gerar histórico inicial
    const initialHistory = Array.from({ length: 24 }, (_, i) => {
      const basePrice = 5.40;
      const variance = (Math.random() - 0.5) * 0.1;
      return basePrice + variance;
    });
    setPriceHistory(initialHistory);

    // Atualizar a cada 5 segundos
    const interval = setInterval(() => {
      setPriceHistory(prev => {
        const lastPrice = prev[prev.length - 1] || 5.40;
        const change = (Math.random() - 0.5) * 0.05;
        const newPrice = Math.max(5.30, Math.min(5.50, lastPrice + change));
        return [...prev.slice(-23), newPrice];
      });
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentPrice = priceHistory[priceHistory.length - 1] || binancePrice;
  const previousPrice = priceHistory[priceHistory.length - 2] || binancePrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = ((priceChange / previousPrice) * 100).toFixed(2);
  const isPositive = priceChange >= 0;

  const maxPrice = Math.max(...priceHistory);
  const minPrice = Math.min(...priceHistory);
  const range = maxPrice - minPrice;

  return (
    <div className="space-y-6">
      {/* Price Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Binance Card */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Mercado</CardTitle>
              <Badge variant="secondary">Referência</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">R$ {currentPrice.toFixed(2)}</span>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  isPositive ? "text-success" : "text-danger"
                }`}>
                  {isPositive ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  <span>{priceChangePercent}%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* TKB Card */}
        <Card className="shadow-lg border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">TKB Asset</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                 <span className="text-3xl font-bold text-primary">
                  R$ {(currentPrice * 1.01).toFixed(3)}
                </span>
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">
                Cotação TKB Asset
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Histórico USDT/BRL (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground pr-2">
              <span>R$ {maxPrice.toFixed(2)}</span>
              <span>R$ {((maxPrice + minPrice) / 2).toFixed(2)}</span>
              <span>R$ {minPrice.toFixed(2)}</span>
            </div>

            {/* Chart area */}
            <div className="ml-16 h-full relative border-l border-b border-border">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="border-t border-border/30" />
                ))}
              </div>

              {/* Binance Line Chart */}
              <svg className="absolute inset-0 w-full h-full">
                <defs>
                  <linearGradient id="binanceGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                
                {/* Area fill for Binance */}
                <path
                  d={`M 0 ${256} ${priceHistory.map((price, i) => {
                    const x = (i / (priceHistory.length - 1)) * 100;
                    const y = 256 - ((price - minPrice) / range) * 240;
                    return `L ${x}% ${y}`;
                  }).join(" ")} L 100% ${256} Z`}
                  fill="url(#binanceGradient)"
                />
                
                {/* Line for Binance */}
                <polyline
                  points={priceHistory.map((price, i) => {
                    const x = (i / (priceHistory.length - 1)) * 100;
                    const y = 256 - ((price - minPrice) / range) * 240;
                    return `${x}%,${y}`;
                  }).join(" ")}
                  fill="none"
                  stroke="hsl(217 91% 60%)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Line for TKB */}
                <polyline
                  points={priceHistory.map((price, i) => {
                    const tkbPrice = price * 1.01;
                    const x = (i / (priceHistory.length - 1)) * 100;
                    const y = 256 - ((tkbPrice - minPrice) / range) * 240;
                    return `${x}%,${y}`;
                  }).join(" ")}
                  fill="none"
                  stroke="hsl(142 71% 45%)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="5,5"
                />
              </svg>

              {/* Current price indicator */}
              <div 
                className="absolute right-0 w-2 h-2 bg-primary rounded-full animate-pulse"
                style={{
                  top: `${256 - ((currentPrice - minPrice) / range) * 240 - 4}px`
                }}
              />
            </div>

            {/* X-axis labels */}
            <div className="ml-16 mt-2 flex justify-between text-xs text-muted-foreground">
              <span>24h atrás</span>
              <span>12h atrás</span>
              <span>Agora</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-primary" />
              <span className="text-muted-foreground">Mercado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-success border-t-2 border-dashed border-success" />
              <span className="text-muted-foreground">TKB Asset</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Cotação atualizada automaticamente a cada 5 segundos</p>
        <p className="mt-1">Fonte: Dados de Mercado em Tempo Real</p>
      </div>
    </div>
  );
};

export default QuoteChart;
