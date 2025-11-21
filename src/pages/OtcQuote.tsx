import { useParams } from 'react-router-dom';
import { useOtcQuote } from '@/hooks/useOtcQuote';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import tkbLogo from '@/assets/tkb-logo.png';

export default function OtcQuote() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useOtcQuote(slug || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-primary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-6 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-primary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-destructive">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">
              Cotação não disponível
            </h2>
            <p className="text-muted-foreground">
              {error || 'Cliente não encontrado'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const priceChange = data.market24h.changePercent;
  const isPositive = priceChange >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-primary/20 p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <div className="text-center space-y-2">
          <img 
            src={tkbLogo} 
            alt="TKB Asset" 
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold text-white">
            Cotação Exclusiva
          </h1>
          <div className="flex items-center justify-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <p className="text-xl text-gray-300">{data.client.name}</p>
          </div>
        </div>

        <Card className="border-2 border-primary shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">USDT → BRL</CardTitle>
              <Badge variant={isPositive ? "default" : "destructive"} className="gap-1">
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Seu Preço Exclusivo</p>
              <p className="text-5xl font-bold text-primary">
                R$ {data.prices.clientPrice.toFixed(4)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Spread de {data.client.spreadPercent}% sobre OKX
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-800 rounded">
                <p className="text-xs text-gray-400 mb-1">OKX Base</p>
                <p className="text-lg font-semibold text-foreground">
                  R$ {data.prices.okxPrice.toFixed(4)}
                </p>
              </div>
              <div className="text-center p-3 bg-gray-800 rounded">
                <p className="text-xs text-gray-400 mb-1">Spread Padrão</p>
                <p className="text-lg font-semibold line-through text-gray-500">
                  R$ {data.prices.standardPrice.toFixed(4)}
                </p>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
              <p className="text-sm text-green-400 mb-1">Você economiza</p>
              <p className="text-2xl font-bold text-green-400">
                {data.savings.percent}%
              </p>
              <p className="text-xs text-green-400/80">
                R$ {data.savings.amount.toFixed(4)} por USDT
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <Clock className="h-3 w-3" />
              </div>
              <span>
                Atualizado: {new Date(data.timestamp).toLocaleTimeString('pt-BR')}
              </span>
              {data.cached && <Badge variant="outline" className="text-xs">Cache</Badge>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mercado 24h (OKX)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Máxima</p>
                <p className="font-semibold">R$ {data.market24h.high.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Mínima</p>
                <p className="font-semibold">R$ {data.market24h.low.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Volume</p>
                <p className="font-semibold">
                  {(data.market24h.volume / 1_000_000).toFixed(2)}M
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500">
          Powered by TKB Asset • Dados em tempo real da OKX
        </p>
      </div>
    </div>
  );
}