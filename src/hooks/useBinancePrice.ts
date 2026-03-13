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
    refetchInterval: 5000, // Atualizar a cada 5 segundos
    staleTime: 4000, // Considerar dados obsoletos após 4 segundos
    gcTime: 1000 * 60 * 5, // Manter em cache por 5 minutos
  });

  // Fallback values if error or loading
  const binancePrice = data?.binancePrice ?? 5.40;
  const tkbPrice = data?.tkbPrice ?? (binancePrice * 1.01);
  const dailyChangePercent = data?.dailyChangePercent ?? 0;
  const volumeUSDT = data?.volumeUSDT ?? 0;
  const highPrice24h = data?.highPrice24h ?? 0;
  const lowPrice24h = data?.lowPrice24h ?? 0;
  const tradesCount = data?.tradesCount ?? 0;

  return {
    binancePrice,
    tkbPrice,
    isLoading,
    error: error ? (error as Error).message : null,
    lastUpdate: new Date(),
    dailyChangePercent,
    volumeUSDT,
    highPrice24h,
    lowPrice24h,
    tradesCount,
    refetch,
  };
};
