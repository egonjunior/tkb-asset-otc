import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PartnerPriceResponse {
  binancePrice: number;
  tkbPrice: number;
  standardPrice: number;
  markup: number;
  markupPercent: string;
  isB2BPartner: boolean;
  companyName: string | null;
  savings: number;
  savingsPercent: string;
  dailyChangePercent: number;
  volumeUSDT: number;
  highPrice24h: number;
  lowPrice24h: number;
  tradesCount: number;
  cached?: boolean;
}

export const usePartnerPrice = () => {
  const [price, setPrice] = useState<number | null>(null);
  const [tkbPrice, setTkbPrice] = useState<number | null>(null);
  const [standardPrice, setStandardPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isB2BPartner, setIsB2BPartner] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [markupPercent, setMarkupPercent] = useState<string>("1.000");
  const [savings, setSavings] = useState<number>(0);
  const [savingsPercent, setSavingsPercent] = useState<string>("0");
  const [dailyChangePercent, setDailyChangePercent] = useState<number>(0);
  const [volumeUSDT, setVolumeUSDT] = useState<number>(0);
  const [highPrice24h, setHighPrice24h] = useState<number>(0);
  const [lowPrice24h, setLowPrice24h] = useState<number>(0);
  const [tradesCount, setTradesCount] = useState<number>(0);

  const fetchPrice = async () => {
    try {
      setError(null);
      
      const { data, error: functionError } = await supabase.functions.invoke<PartnerPriceResponse>(
        'get-partner-price',
        {
          method: 'GET',
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (data) {
        setPrice(data.binancePrice);
        setTkbPrice(data.tkbPrice);
        setStandardPrice(data.standardPrice);
        setIsB2BPartner(data.isB2BPartner);
        setCompanyName(data.companyName);
        setMarkupPercent(data.markupPercent);
        setSavings(data.savings);
        setSavingsPercent(data.savingsPercent);
        setDailyChangePercent(data.dailyChangePercent);
        setVolumeUSDT(data.volumeUSDT);
        setHighPrice24h(data.highPrice24h);
        setLowPrice24h(data.lowPrice24h);
        setTradesCount(data.tradesCount);
        setLastUpdate(new Date());
        
        console.log(`📊 Partner Price Update: B2B=${data.isB2BPartner} | TKB=${data.tkbPrice.toFixed(4)} | Markup=${data.markupPercent}%`);
      }
    } catch (err: any) {
      console.error("Error fetching partner price:", err);
      setError(err.message || "Failed to fetch price");
      
      // Fallback to standard price hook behavior
      try {
        const binanceResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL');
        const binanceData = await binanceResponse.json();
        const binancePrice = parseFloat(binanceData.price);
        
        setPrice(binancePrice);
        setTkbPrice(binancePrice * 1.01);
        setStandardPrice(binancePrice * 1.01);
        setIsB2BPartner(false);
        setMarkupPercent("1.000");
        setLastUpdate(new Date());
      } catch (fallbackErr) {
        console.error("Fallback price fetch failed:", fallbackErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchPrice();
      }
    }, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchPrice();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    price,
    tkbPrice,
    standardPrice,
    isLoading,
    error,
    lastUpdate,
    isB2BPartner,
    companyName,
    markupPercent,
    savings,
    savingsPercent,
    dailyChangePercent,
    volumeUSDT,
    highPrice24h,
    lowPrice24h,
    tradesCount,
    refetch: fetchPrice,
  };
};
