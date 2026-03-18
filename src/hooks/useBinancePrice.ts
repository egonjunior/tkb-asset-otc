import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PriceResponse {
  binancePrice: number;
  tkbPrice: number;
  dailyChangePercent: number;
  volumeUSDT: number;
  highPrice24h: number;
  lowPrice24h: number;
  tradesCount: number;
  cached: boolean;
  timestamp?: number;
}

export const useBinancePrice = () => {
  // 1. Busca preço de mercado (Binance/OKX) — sem auth, simples e confiável
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["current-price"],
    queryFn: async () => {
      const { data, error: functionError } = await supabase.functions.invoke<PriceResponse>(
        'get-current-price',
        { method: 'GET' }
      );

      if (functionError) {
        throw new Error(functionError.message || "Failed to fetch price");
      }

      if (!data) {
        throw new Error("No data received from price service");
      }

      return data;
    },
    refetchInterval: 5000,
    staleTime: 4000,
    gcTime: 1000 * 60 * 5,
    retry: 1,
    refetchIntervalInBackground: false,
  });

  // 2. Busca markup do usuário diretamente no frontend (onde temos a sessão ativa)
  //    Modela o mesmo princípio do get-otc-quote: preço base + % configurado = preço final
  const { data: markupData } = useQuery({
    queryKey: ["user-pricing-markup"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return { markup_percent: 1 };

      const { data: profile } = await supabase
        .from('profiles')
        .select('markup_percent, price_source')
        .eq('id', session.user.id)
        .single();

      return profile ?? { markup_percent: 1 };
    },
    staleTime: 5 * 60 * 1000, // Markup raramente muda — cache de 5 min
    retry: 2,
  });

  const binancePrice = data?.binancePrice ?? 5.40;

  // 3. Calcula tkbPrice no frontend: preço base × (1 + markup%)
  //    Mesmo modelo do get-otc-quote: basePrice * (1 + spread_percent/100)
  const markupPercent = markupData?.markup_percent ?? 1;
  const tkbPrice = binancePrice * (1 + markupPercent / 100);

  const dailyChangePercent = data?.dailyChangePercent ?? 0;
  const volumeUSDT = data?.volumeUSDT ?? 0;
  const highPrice24h = data?.highPrice24h ?? 0;
  const lowPrice24h = data?.lowPrice24h ?? 0;
  const tradesCount = data?.tradesCount ?? 0;

  const isInitialLoading = isLoading && !data;

  return {
    binancePrice,
    tkbPrice,
    markupPercent,
    isLoading,
    isInitialLoading,
    error: error ? (error as Error).message : null,
    lastUpdate: data ? new Date(data.timestamp || Date.now()) : new Date(),
    dailyChangePercent,
    volumeUSDT,
    highPrice24h,
    lowPrice24h,
    tradesCount,
    refetch,
  };
};
