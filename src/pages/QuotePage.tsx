import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, RefreshCw, ArrowUpRight, ArrowDownRight, Share2, ArrowRight } from "lucide-react";
import { useBinancePrice } from "@/hooks/useBinancePrice";
import { useBinanceCandles } from "@/hooks/useBinanceCandles";
import { useMemo, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import tkbLogo from "@/assets/tkb-logo.png";
import { useTradingViewChart } from "@/hooks/useTradingViewChart";
import { LineData } from 'lightweight-charts';

const QuotePage = () => {
  const navigate = useNavigate();
  const { binancePrice, tkbPrice, isLoading, error, lastUpdate, dailyChangePercent, refetch } = useBinancePrice();
  const { candles } = useBinanceCandles();
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const handleRefresh = async () => {
    await refetch();
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
  const isPositive = dailyChangePercent >= 0;

  // Transformar candles em linha TKB (+1% do close)
  const tkbLineData = useMemo((): LineData[] => {
    return candles.map(candle => ({
      time: candle.time as any,
      value: candle.close * 1.01,
    }));
  }, [candles]);

  // Inicializar gráfico TradingView
  useTradingViewChart({
    container: chartContainerRef.current,
    candleData: candles,
    tkbData: tkbLineData,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-black sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/home")} className="text-white hover:bg-neutral-800">
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
                variant="default" 
                size="sm"
                onClick={handleShare}
                className="bg-primary hover:bg-primary-hover text-white"
              >
                <Share2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Compartilhar</span>
              </Button>
                <Button 
                variant="default" 
                size="sm" 
                onClick={handleRefresh}
                className="bg-primary hover:bg-primary-hover text-white"
              >
                <RefreshCw className="h-4 w-4" />
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
                      <span className="text-6xl font-playfair font-bold text-foreground">
                        R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                      </span>
                      <div className={`flex items-center gap-1.5 text-lg font-semibold ${
                        isPositive ? "text-success" : "text-danger"
                      }`}>
                        {isPositive ? (
                          <ArrowUpRight className="h-6 w-6" />
                        ) : (
                          <ArrowDownRight className="h-6 w-6" />
                        )}
                        <span>{Math.abs(dailyChangePercent).toFixed(2)}%</span>
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
                        R$ {tkbPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
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
                    Últimas 24 horas • Candles de 15 minutos
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
              {candles.length > 1 ? (
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
                  <div className="flex gap-1">
                    <div className="w-3 h-6 bg-success rounded-sm" />
                    <div className="w-3 h-6 bg-danger rounded-sm" />
                  </div>
                  <span className="text-neutral-300 font-inter">Mercado (Candles)</span>
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
