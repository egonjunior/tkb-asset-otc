import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Busca preço USDT/BRL direto da Binance (público, sem edge function).
 * Markup do usuário é buscado da tabela profiles no frontend (sessão ativa).
 * Mesmo modelo do get-otc-quote: basePrice × (1 + markup%).
 */
export const useBinancePrice = () => {
  // 1. Preço de mercado direto da Binance (API pública, sem auth)
  const { data: marketData, isLoading, error, refetch } = useQuery({
    queryKey: ["binance-market-price"],
    queryFn: async () => {
      const [priceRes, tickerRes] = await Promise.all([
        fetch("https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL"),
        fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=USDTBRL"),
      ]);

      if (!priceRes.ok || !tickerRes.ok) {
        throw new Error("Erro ao buscar preço da Binance");
      }

      const [priceJSON, tickerJSON] = await Promise.all([
        priceRes.json(),
        tickerRes.json(),
      ]);

      return {
        binancePrice: parseFloat(priceJSON.price),
        dailyChangePercent: parseFloat(tickerJSON.priceChangePercent || "0"),
        volumeUSDT: parseFloat(tickerJSON.volume || "0"),
        highPrice24h: parseFloat(tickerJSON.highPrice || "0"),
        lowPrice24h: parseFloat(tickerJSON.lowPrice || "0"),
        tradesCount: parseInt(tickerJSON.count || "0"),
        timestamp: Date.now(),
      };
    },
    refetchInterval: 5000,
    staleTime: 4000,
    gcTime: 1000 * 60 * 5,
    retry: 2,
    refetchIntervalInBackground: false,
  });

  // 2. Markup do usuário direto do Supabase (sessão do frontend)
  const { data: markupData } = useQuery({
    queryKey: ["user-pricing-markup"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return { markup_percent: 1 };

      const { data: profile } = await supabase
        .from("profiles")
        .select("markup_percent")
        .eq("id", session.user.id)
        .single();

      return { markup_percent: profile?.markup_percent ?? 1 };
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // 3. Preço final = Binance × (1 + markup%)
  const binancePrice = marketData?.binancePrice ?? 0;
  const markupPercent = markupData?.markup_percent ?? 1;
  const tkbPrice = binancePrice > 0 ? binancePrice * (1 + markupPercent / 100) : 0;

  const isInitialLoading = isLoading && !marketData;

  return {
    binancePrice,
    tkbPrice,
    markupPercent,
    isLoading,
    isInitialLoading,
    error: error ? (error as Error).message : null,
    lastUpdate: marketData ? new Date(marketData.timestamp) : new Date(),
    dailyChangePercent: marketData?.dailyChangePercent ?? 0,
    volumeUSDT: marketData?.volumeUSDT ?? 0,
    highPrice24h: marketData?.highPrice24h ?? 0,
    lowPrice24h: marketData?.lowPrice24h ?? 0,
    tradesCount: marketData?.tradesCount ?? 0,
    refetch,
  };
};
