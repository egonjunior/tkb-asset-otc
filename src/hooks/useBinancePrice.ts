import { useState, useEffect } from "react";

interface BinanceTickerResponse {
  symbol: string;
  price: string;
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
      // Buscar preço e variação de 24h em paralelo
      const [priceResponse, ticker24hResponse] = await Promise.all([
        fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL'),
        fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=USDTBRL')
      ]);
      
      if (!priceResponse.ok || !ticker24hResponse.ok) {
        throw new Error('Erro ao buscar cotação da Binance');
      }
      
      const priceData: BinanceTickerResponse = await priceResponse.json();
      const ticker24hData: any = await ticker24hResponse.json();
      
      const priceValue = parseFloat(priceData.price);
      const dailyChange = parseFloat(ticker24hData.priceChangePercent);
      
      setPrice(priceValue);
      setDailyChangePercent(dailyChange);
      setVolumeUSDT(parseFloat(ticker24hData.volume));
      setHighPrice24h(parseFloat(ticker24hData.highPrice));
      setLowPrice24h(parseFloat(ticker24hData.lowPrice));
      setTradesCount(parseInt(ticker24hData.count));
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar preço:', err);
      setError('Não foi possível buscar a cotação. Usando valor de referência.');
      // Fallback para um valor de referência
      setPrice(5.40);
      setDailyChangePercent(0);
    } finally {
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

  const tkbPrice = price ? price * 1.01 : null;

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
