import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OtcQuoteResponse {
  client: {
    slug: string;
    name: string;
    spreadPercent: number;
  };
  prices: {
    okxPrice: number;
    clientPrice: number;
    standardPrice: number;
  };
  savings: {
    amount: number;
    percent: string;
  };
  market24h: {
    high: number;
    low: number;
    volume: number;
    changePercent: number;
  };
  timestamp: string;
  cached?: boolean;
}

export function useOtcQuote(slug: string) {
  const [data, setData] = useState<OtcQuoteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = async () => {
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke(
        'get-otc-quote',
        { 
          body: { slug },
        }
      );

      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);
      
      setData(result);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao buscar cotação OTC:', err);
      setError(err.message || 'Erro ao carregar cotação');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!slug) return;
    
    fetchQuote();
    
    const interval = setInterval(fetchQuote, 5000);
    
    return () => clearInterval(interval);
  }, [slug]);

  return { data, isLoading, error, refetch: fetchQuote };
}