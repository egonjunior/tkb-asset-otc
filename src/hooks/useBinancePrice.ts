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
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["current-price"],
    queryFn: async () => {
      const { data, error: functionError } = await supabase.functions.invoke<PriceResponse>(
        'get-current-price',
        {
          method: 'GET'
        }
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
    retry: 1, // Tentar apenas 1x em caso de erro (default é 3x) — evita delay de ~10s antes de usar fallback
    refetchIntervalInBackground: false, // Não fazer polling quando a aba está em segundo plano
  });

  // Fallback values if error or loading
  const binancePrice = data?.binancePrice ?? 5.40;
  const tkbPrice = data?.tkbPrice ?? (binancePrice * 1.01);
  const dailyChangePercent = data?.dailyChangePercent ?? 0;
  const volumeUSDT = data?.volumeUSDT ?? 0;
  const highPrice24h = data?.highPrice24h ?? 0;
  const lowPrice24h = data?.lowPrice24h ?? 0;
  const tradesCount = data?.tradesCount ?? 0;

  // Initial loading means it's loading AND we have no data yet
  const isInitialLoading = isLoading && !data;

  return {
    binancePrice,
    tkbPrice,
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
