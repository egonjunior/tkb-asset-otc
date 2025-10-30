import { useState, useEffect } from "react";
import { Time } from "lightweight-charts";

export interface CandleData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

export const useBinanceCandles = () => {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCandles = async () => {
    try {
      const response = await fetch(
        'https://api.binance.com/api/v3/klines?symbol=USDTBRL&interval=15m&limit=96'
      );
      
      if (!response.ok) {
        throw new Error('Erro ao buscar dados de velas da Binance');
      }
      
      const data = await response.json();
      
      const formattedCandles: CandleData[] = data.map((candle: any[]) => ({
        time: (candle[0] / 1000) as Time, // timestamp em segundos
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
      }));
      
      setCandles(formattedCandles);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar velas:', err);
      setError('Não foi possível buscar dados de velas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandles();
    
    // Atualizar a cada 15 minutos (quando um novo candle fecha)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchCandles();
      }
    }, 900000);

    return () => clearInterval(interval);
  }, []);

  return {
    candles,
    isLoading,
    error,
    refetch: fetchCandles,
  };
};
