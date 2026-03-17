import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache apenas para os dados da Binance (válido por 5 segundos)
let binanceCache: {
  binancePrice: number;
  timestamp: number;
  dailyChangePercent: number;
  volumeUSDT: number;
  highPrice24h: number;
  lowPrice24h: number;
  tradesCount: number;
} | null = null;

const CACHE_DURATION_MS = 5000; // 5 segundos
const DEFAULT_MARKUP = 1.01; // 1% markup fallback

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();
    let binanceData = binanceCache;

    // 1. Iniciar busca da Binance e Auth/Profile em paralelo se o cache expirou
    const updateCache = !binanceCache || (now - binanceCache.timestamp) >= CACHE_DURATION_MS;

    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      authHeader ? { global: { headers: { Authorization: authHeader } } } : undefined
    );

    const authPromise = authHeader ? supabaseClient.auth.getUser() : Promise.resolve({ data: { user: null }, error: null });

    // Executar todas as promessas iniciais em paralelo de forma segura
    const binancePricePromise = updateCache ? fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL') : Promise.resolve(null);
    const binanceTickerPromise = updateCache ? fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=USDTBRL') : Promise.resolve(null);

    const [priceResponse, tickerResponse, authResult] = await Promise.all([
      binancePricePromise,
      binanceTickerPromise,
      authPromise
    ]);

    // 3. Processar tanto os dados da Binance quanto o Profile em paralelo
    let markupPromise = Promise.resolve(DEFAULT_MARKUP);
    let manualQuotePromise = Promise.resolve(null);
    const user = authResult?.data?.user;
    const userId = user?.id || 'anonymous';
    let userMarkup = DEFAULT_MARKUP;

    if (user) {
      markupPromise = supabaseClient
        .from('profiles')
        .select('markup_percent')
        .eq('id', user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile && profile.markup_percent !== null && profile.markup_percent !== undefined) {
            return 1 + (profile.markup_percent / 100);
          }
          return DEFAULT_MARKUP;
        });

      // NOVO: Buscar cotação manual ativa (Price Lock)
      manualQuotePromise = supabaseClient
        .from('user_quotes')
        .select('manual_price')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => data?.manual_price || null);
    }

    if (updateCache) {
      if (!priceResponse?.ok || !tickerResponse?.ok) {
        throw new Error('Failed to fetch price from Binance');
      }

      const [priceJSON, tickerJSON, resolvedMarkup, resolvedManualPrice] = await Promise.all([
        priceResponse.json(),
        tickerResponse.json(),
        markupPromise,
        manualQuotePromise
      ]);

      userMarkup = resolvedMarkup;
      binanceData = {
        binancePrice: parseFloat(priceJSON.price),
        timestamp: now,
        dailyChangePercent: parseFloat(tickerJSON.priceChangePercent || '0'),
        volumeUSDT: parseFloat(tickerJSON.volume || '0'),
        highPrice24h: parseFloat(tickerJSON.highPrice || '0'),
        lowPrice24h: parseFloat(tickerJSON.lowPrice || '0'),
        tradesCount: parseInt(tickerJSON.count || '0'),
      };
      binanceCache = binanceData;

      // Aplicar preço manual se existir
      const finalTkbPrice = resolvedManualPrice ? Number(resolvedManualPrice) : (binanceData.binancePrice * userMarkup);
      const isManual = !!resolvedManualPrice;

      console.log(`${isManual ? 'Manual price applied' : 'Dynamic price calculated'} | Markup: ${((userMarkup - 1) * 100).toFixed(2)}%`);

      return new Response(
        JSON.stringify({
          ...binanceData,
          tkbPrice: finalTkbPrice,
          isManualPrice: isManual,
          cached: false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const [resolvedMarkup, resolvedManualPrice] = await Promise.all([
        markupPromise,
        manualQuotePromise
      ]);

      userMarkup = resolvedMarkup;
      const finalTkbPrice = resolvedManualPrice ? Number(resolvedManualPrice) : (binanceData.binancePrice * userMarkup);
      const isManual = !!resolvedManualPrice;

      console.log(`Using cached Binance price | ${isManual ? 'Manual price applied' : 'Dynamic price calculated'}`);

      return new Response(
        JSON.stringify({
          ...binanceData,
          tkbPrice: finalTkbPrice,
          isManualPrice: isManual,
          cached: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error fetching dynamic price:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
