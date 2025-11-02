import { useState, useEffect } from "react";
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
  const [price, setPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [dailyChangePercent, setDailyChangePercent] = useState<number>(0);
  const [volumeUSDT, setVolumeUSDT] = useState<number>(0);
  const [highPrice24h, setHighPrice24h] = useState<number>(0);
  const [lowPrice24h, setLowPrice24h] = useState<number>(0);
  const [tradesCount, setTradesCount] = useState<number>(0);

  const fetchPrice = async () => {
    try {
      setError(null);
      
      // Usar Edge Function centralizada ao invés de chamar Binance diretamente
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

      setPrice(data.binancePrice);
      setDailyChangePercent(data.dailyChangePercent);
      setVolumeUSDT(data.volumeUSDT);
      setHighPrice24h(data.highPrice24h);
      setLowPrice24h(data.lowPrice24h);
      setTradesCount(data.tradesCount);
      setLastUpdate(new Date());
      
      setIsLoading(false);
    } catch (err) {
      console.error('Erro ao buscar preço:', err);
      setError('Não foi possível buscar a cotação. Usando valor de referência.');
      // Fallback para um valor de referência
      setPrice(5.40);
      setDailyChangePercent(0);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Buscar preço inicial
    fetchPrice();

    // Atualizar a cada 5 segundos (apenas se tab estiver visível)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchPrice();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const tkbPrice = price ? price * 1.0015 : null;

  return {
    binancePrice: price,
    tkbPrice,
    isLoading,
    error,
    lastUpdate,
    dailyChangePercent,
    volumeUSDT,
    highPrice24h,
    lowPrice24h,
    tradesCount,
    refetch: fetchPrice,
  };
};
