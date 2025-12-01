import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { useOtcQuote } from '@/hooks/useOtcQuote';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, Building2, Calculator, ArrowDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrencyInput } from '@/components/ui/currency-input';
import { formatBRL } from '@/lib/formatters';
import tkbLogo from '@/assets/tkb-logo.png';

export default function OtcQuote() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useOtcQuote(slug || '');
  const [brlAmount, setBrlAmount] = useState<number>(0);

  // Cálculo preciso: BRL ÷ Cotação = USDT
  const usdtResult = brlAmount > 0 && data?.prices.clientPrice && data.prices.clientPrice > 0
    ? brlAmount / data.prices.clientPrice
    : 0;

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
            <div className="text-center py-6 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Cotação Exclusiva USDT</p>
              <p className="text-5xl font-bold text-primary">
                R$ {data.prices.clientPrice.toFixed(4)}
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                Baseado no preço médio de mercado
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

        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Simule sua Conversão</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Valor em Reais (BRL)
              </label>
              <CurrencyInput
                value={brlAmount}
                onChange={setBrlAmount}
                decimals={2}
                className="text-lg h-12"
                placeholder="R$ 0,00"
              />
            </div>

            {brlAmount > 0 && data?.prices.clientPrice && (
              <>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <ArrowDown className="h-4 w-4" />
                  <span>na cotação R$ {data.prices.clientPrice.toFixed(4)}</span>
                </div>

                <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Você recebe aproximadamente</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatBRL(usdtResult)} USDT
                  </p>
                </div>

                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <div className="mt-0.5">ℹ️</div>
                  <p>Valor ilustrativo - sujeito a confirmação no momento da operação</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mercado 24h</CardTitle>
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
          Powered by TKB Asset • Cotação em tempo real
        </p>
      </div>
    </div>
  );
}