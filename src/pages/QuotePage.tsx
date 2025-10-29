import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, RefreshCw, ArrowUpRight, ArrowDownRight, Share2 } from "lucide-react";
import { useBinancePrice } from "@/hooks/useBinancePrice";
import { useState, useEffect, useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import tkbLogo from "@/assets/tkb-logo.png";

const QuotePage = () => {
  const navigate = useNavigate();
  const { binancePrice, tkbPrice, isLoading, error, lastUpdate, refetch } = useBinancePrice();
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Construir histórico de preços com debounce
  useEffect(() => {
    if (binancePrice) {
      setIsUpdating(true);
      const timeout = setTimeout(() => {
        setPriceHistory(prev => {
          const newHistory = [...prev, binancePrice];
          // Manter apenas últimas 30 atualizações para melhor performance
          return newHistory.slice(-30);
        });
        setIsUpdating(false);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [binancePrice]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
      toast({
        title: "Cotação atualizada!",
        description: "Dados mais recentes do mercado",
      });
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "Compartilhe a cotação em tempo real",
    });
  };

  const currentPrice = binancePrice || 0;
  const previousPrice = priceHistory[priceHistory.length - 2] || currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice > 0 ? ((priceChange / previousPrice) * 100).toFixed(2) : "0.00";
  const isPositive = priceChange >= 0;

  const maxPrice = priceHistory.length > 0 ? Math.max(...priceHistory) : currentPrice;
  const minPrice = priceHistory.length > 0 ? Math.min(...priceHistory) : currentPrice;
  const range = maxPrice - minPrice || 0.01;

  // Memoizar cálculos do gráfico para evitar re-renderizações desnecessárias
  const chartPoints = useMemo(() => ({
    binance: priceHistory.map((price, i) => {
      const x = (i / Math.max(priceHistory.length - 1, 1)) * 100;
      const y = 100 - ((price - minPrice) / range) * 95;
      return `${x}%,${y}%`;
    }).join(" "),
    tkb: priceHistory.map((price, i) => {
      const tkbValue = price * 1.01;
      const x = (i / Math.max(priceHistory.length - 1, 1)) * 100;
      const y = 100 - ((tkbValue - minPrice) / range) * 95;
      return `${x}%,${y}%`;
    }).join(" "),
    area: `M 0 100% ${priceHistory.map((price, i) => {
      const x = (i / Math.max(priceHistory.length - 1, 1)) * 100;
      const y = 100 - ((price - minPrice) / range) * 95;
      return `L ${x}% ${y}%`;
    }).join(" ")} L 100% 100% Z`
  }), [priceHistory, minPrice, range]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/home")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <img src={tkbLogo} alt="TKB Asset" className="h-8 w-8" />
              <span className="text-lg font-bold text-foreground">Cotação em Tempo Real</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Error Message */}
          {error && (
            <Card className="border-warning/50 bg-warning/5">
              <CardContent className="pt-6">
                <p className="text-sm text-warning">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Price Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Binance Card */}
            <Card className="shadow-xl animate-fade-in">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Mercado</CardTitle>
                  <Badge variant="secondary">Referência</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-10 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-bold">R$ {currentPrice.toFixed(2)}</span>
                      <div className={`flex items-center gap-1 text-base font-medium ${
                        isPositive ? "text-success" : "text-danger"
                      }`}>
                        {isPositive ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5" />
                        )}
                        <span>{priceChangePercent}%</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Par: USDT/BRL
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Última atualização: {lastUpdate.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* TKB Card */}
            <Card className="shadow-xl border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 animate-fade-in">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">TKB Asset</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-10 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-bold text-primary">
                        R$ {tkbPrice?.toFixed(3)}
                      </span>
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Cotação TKB Asset
                </p>
              </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">Histórico de Cotação</CardTitle>
              <p className="text-sm text-muted-foreground">
                Últimas {priceHistory.length} atualizações (atualização automática a cada 5s)
              </p>
            </CardHeader>
            <CardContent>
              {priceHistory.length > 1 ? (
                <div className="h-80 relative">
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground pr-3">
                    <span>R$ {maxPrice.toFixed(2)}</span>
                    <span>R$ {((maxPrice + minPrice) / 2).toFixed(2)}</span>
                    <span>R$ {minPrice.toFixed(2)}</span>
                  </div>

                  {/* Chart area */}
                  <div className="ml-20 h-full relative border-l border-b border-border rounded-bl-lg">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between">
                      {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} className="border-t border-border/30" />
                      ))}
                    </div>

                    {/* SVG Chart */}
                    <svg className="absolute inset-0 w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="binanceGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>
                      
                      {/* Area fill for Binance */}
                      <path
                        d={chartPoints.area}
                        fill="url(#binanceGradient)"
                      />
                      
                      {/* Line for Binance */}
                      <polyline
                        points={chartPoints.binance}
                        fill="none"
                        stroke="hsl(217 91% 60%)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ transition: 'all 0.3s ease-out' }}
                      />

                      {/* Line for TKB */}
                      <polyline
                        points={chartPoints.tkb}
                        fill="none"
                        stroke="hsl(142 71% 45%)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="8,4"
                        style={{ transition: 'all 0.3s ease-out' }}
                      />

                      {/* Current price indicator */}
                      <circle
                        cx="100%"
                        cy={`${100 - ((currentPrice - minPrice) / range) * 95}%`}
                        r="5"
                        fill="hsl(217 91% 60%)"
                        style={{ transition: 'cy 0.3s ease-out' }}
                      />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  <p>Coletando dados de cotação...</p>
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center justify-center gap-8 mt-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-1 bg-primary rounded" />
                  <span className="text-muted-foreground">Mercado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-1 bg-success rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, hsl(142 71% 45%) 0, hsl(142 71% 45%) 8px, transparent 8px, transparent 12px)' }} />
                  <span className="text-muted-foreground">TKB Asset</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="shadow-xl bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-8 text-center space-y-4">
              <h3 className="text-2xl font-bold text-foreground">
                Pronto para comprar USDT?
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Aproveite nossa cotação competitiva e realize suas operações com segurança
              </p>
              <Button size="lg" onClick={() => navigate("/login")}>
                Acessar Plataforma
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default QuotePage;
