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

  const fetchPrice = async () => {
    try {
      const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar cotação da Binance');
      }
      
      const data: BinanceTickerResponse = await response.json();
      const priceValue = parseFloat(data.price);
      
      setPrice(priceValue);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar preço da Binance:', err);
      setError('Não foi possível buscar a cotação. Usando valor de referência.');
      // Fallback para um valor de referência
      setPrice(5.40);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Buscar preço inicial
    fetchPrice();

    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchPrice, 10000);

    return () => clearInterval(interval);
  }, []);

  const tkbPrice = price ? price * 1.009 : null;

  return {
    binancePrice: price,
    tkbPrice,
    isLoading,
    error,
    lastUpdate,
    refetch: fetchPrice,
  };
};
