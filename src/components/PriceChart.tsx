import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceChartProps {
  currentPrice: number | null;
  isLoading: boolean;
}

interface PricePoint {
  time: string;
  price: number;
}

const PriceChart = ({ currentPrice, isLoading }: PriceChartProps) => {
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [priceChange, setPriceChange] = useState(0);
  const [priceChangePercent, setPriceChangePercent] = useState(0);

  useEffect(() => {
    if (!currentPrice) return;

    const now = new Date();
    const newPoint: PricePoint = {
      time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      price: currentPrice,
    };

    setPriceHistory((prev) => {
      const updated = [...prev, newPoint];
      // Keep last 20 points (approximately 3 minutes of data at 10s intervals)
      if (updated.length > 20) {
        updated.shift();
      }

      // Calculate price change
      if (updated.length > 1) {
        const firstPrice = updated[0].price;
        const lastPrice = updated[updated.length - 1].price;
        const change = lastPrice - firstPrice;
        const changePercent = ((change / firstPrice) * 100);
        setPriceChange(change);
        setPriceChangePercent(changePercent);
      }

      return updated;
    });
  }, [currentPrice]);

  if (isLoading || !currentPrice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gráfico de Preço</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Carregando dados...
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxPrice = Math.max(...priceHistory.map(p => p.price));
  const minPrice = Math.min(...priceHistory.map(p => p.price));
  const priceRange = maxPrice - minPrice || 0.01;

  const chartHeight = 200;
  const chartWidth = 100;

  const points = priceHistory.map((point, index) => {
    const x = (index / (priceHistory.length - 1 || 1)) * chartWidth;
    const y = chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>USDT/BRL - Mercado</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">R$ {currentPrice.toFixed(3)}</span>
            {priceChange !== 0 && (
              <div className={`flex items-center gap-1 ${priceChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                {priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="text-sm font-medium">
                  {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-64"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            <line x1="0" y1={chartHeight / 4} x2={chartWidth} y2={chartHeight / 4} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
            <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
            <line x1="0" y1={(chartHeight * 3) / 4} x2={chartWidth} y2={(chartHeight * 3) / 4} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
            
            {/* Price line */}
            {priceHistory.length > 1 && (
              <>
                <polyline
                  points={points}
                  fill="none"
                  stroke={priceChange >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                  strokeWidth="2"
                />
                {/* Fill area under line */}
                <polygon
                  points={`0,${chartHeight} ${points} ${chartWidth},${chartHeight}`}
                  fill={priceChange >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                  opacity="0.1"
                />
              </>
            )}
          </svg>
          
          {/* Price labels */}
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>R$ {minPrice.toFixed(3)}</span>
            <span>R$ {maxPrice.toFixed(3)}</span>
          </div>
          
          {/* Time labels */}
          {priceHistory.length > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{priceHistory[0]?.time}</span>
              <span>{priceHistory[priceHistory.length - 1]?.time}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceChart;
