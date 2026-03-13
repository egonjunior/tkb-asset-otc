import { useQuery } from '@tanstack/react-query';
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
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['otc-quote', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Slug é obrigatório');

      const { data: result, error: fnError } = await supabase.functions.invoke(
        'get-otc-quote',
        {
          body: { slug },
        }
      );

      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);

      return result as OtcQuoteResponse;
    },
    enabled: !!slug,
    refetchInterval: 5000,
    staleTime: 4000,
    gcTime: 1000 * 60 * 5,
  });

  return {
    data,
    isLoading,
    error: error ? (error as any).message : null,
    refetch
  };
}