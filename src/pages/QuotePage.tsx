import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, RefreshCw, ArrowUpRight, ArrowDownRight, Share2, ArrowRight } from "lucide-react";
import { useBinancePrice } from "@/hooks/useBinancePrice";
import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import tkbLogo from "@/assets/tkb-logo.png";
import { useTradingViewChart } from "@/hooks/useTradingViewChart";
import { LineData } from 'lightweight-charts';

const QuotePage = () => {
  const navigate = useNavigate();
  const { binancePrice, tkbPrice, isLoading, error, lastUpdate, refetch } = useBinancePrice();
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

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

  // Transformar dados para formato TradingView (garantindo TKB = Binance * 1.01)
  const chartData = useMemo((): { binance: LineData[], tkb: LineData[] } => {
    const now = Math.floor(Date.now() / 1000);
    
    return {
      binance: priceHistory.map((price, i) => ({
        time: (now - (priceHistory.length - i) * 5) as any,
        value: price,
      })),
      tkb: priceHistory.map((price, i) => ({
        time: (now - (priceHistory.length - i) * 5) as any,
        value: price * 1.01, // TKB sempre +1% do Binance
      })),
    };
  }, [priceHistory]);

  // Inicializar gráfico TradingView (hook no nível superior)
  useTradingViewChart({
    container: chartContainerRef.current,
    data: chartData.binance,
    tkbData: chartData.tkb,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      {/* Header */}
      <header className="border-b border-neutral-700 bg-glass backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/home")} className="text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <img src={tkbLogo} alt="TKB Asset" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-playfair font-bold text-white">Cotação em Tempo Real</h1>
                <p className="text-xs text-neutral-300 font-inter">USDT/BRL</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleShare}
                className="border-neutral-600 text-white hover:bg-white/10"
              >
                <Share2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Compartilhar</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-neutral-600 text-white hover:bg-white/10"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Error Message */}
          {error && (
            <Card className="border-warning bg-warning/10">
              <CardContent className="pt-6">
                <p className="text-sm text-warning font-inter">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Price Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Binance Card */}
            <Card className="shadow-elevated animate-fade-in bg-white border-neutral-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-playfair">Mercado</CardTitle>
                  <Badge variant="secondary" className="text-xs">Referência</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-12 bg-neutral-100 rounded w-3/4" />
                    <div className="h-6 bg-neutral-100 rounded w-1/2" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-4">
                      <span className="text-6xl font-playfair font-bold text-foreground">R$ {currentPrice.toFixed(2)}</span>
                      <div className={`flex items-center gap-1.5 text-lg font-semibold ${
                        isPositive ? "text-success" : "text-danger"
                      }`}>
                        {isPositive ? (
                          <ArrowUpRight className="h-6 w-6" />
                        ) : (
                          <ArrowDownRight className="h-6 w-6" />
                        )}
                        <span>{priceChangePercent}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="secondary" className="text-xs font-semibold">Par: USDT/BRL</Badge>
                      <p className="text-xs text-muted-foreground font-inter">
                        Última atualização: {lastUpdate.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit'
                        })} • Auto-refresh 5s
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* TKB Card */}
            <Card className="shadow-elevated border-none bg-gradient-to-br from-primary via-primary-hover to-primary animate-fade-in overflow-hidden relative" style={{ animationDelay: '150ms' }}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
              <CardHeader className="pb-4 relative">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-playfair text-white">TKB Asset</CardTitle>
                  <Badge className="bg-success/20 text-white border-white/30">AO VIVO</Badge>
                </div>
              </CardHeader>
              <CardContent className="relative">
                {isLoading ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-12 bg-white/20 rounded w-3/4" />
                    <div className="h-6 bg-white/20 rounded w-1/2" />
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-baseline gap-4">
                      <span className="text-6xl font-playfair font-bold text-white">
                        R$ {tkbPrice?.toFixed(3)}
                      </span>
                      <TrendingUp className="h-8 w-8 text-white" strokeWidth={2} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-white/90 font-semibold font-inter uppercase tracking-wider">
                        Cotação Institucional
                      </p>
                      <Button 
                        size="lg" 
                        className="bg-white text-primary hover:bg-neutral-100 shadow-xl font-semibold mt-2"
                        onClick={() => navigate("/login")}
                      >
                        Solicitar Operação
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card className="shadow-elevated bg-neutral-800/50 backdrop-blur border-neutral-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-playfair text-white">Histórico de Cotação</CardTitle>
                  <p className="text-sm text-neutral-300 font-inter mt-1">
                    Últimas {priceHistory.length} atualizações • 5s refresh
                  </p>
                </div>
                  <Badge className="bg-success/20 text-success border-success/30 animate-pulse">
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                    </span>
                    AO VIVO
                  </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {priceHistory.length > 1 ? (
                <div className="h-96">
                  <div 
                    ref={chartContainerRef}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="h-96 flex flex-col items-center justify-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-neutral-400 font-inter">Carregando cotações em tempo real...</p>
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center justify-center gap-8 mt-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-primary rounded shadow-sm" />
                  <span className="text-neutral-300 font-inter">Mercado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-success rounded shadow-sm" style={{ backgroundImage: 'repeating-linear-gradient(90deg, hsl(158 45% 38%) 0, hsl(158 45% 38%) 8px, transparent 8px, transparent 12px)' }} />
                  <span className="text-neutral-300 font-inter">TKB Asset</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="shadow-elevated bg-gradient-to-br from-primary via-primary-hover to-primary border-none overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
            <CardContent className="relative p-10 text-center space-y-6">
              <h3 className="text-4xl font-playfair font-bold text-white">
                Pronto para comprar USDT?
              </h3>
              <p className="text-lg text-white/90 max-w-2xl mx-auto font-inter leading-relaxed">
                Aproveite nossa cotação competitiva e realize suas operações com segurança
              </p>
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-neutral-100 shadow-xl font-semibold"
                onClick={() => navigate("/login")}
              >
                Acessar Plataforma
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default QuotePage;
