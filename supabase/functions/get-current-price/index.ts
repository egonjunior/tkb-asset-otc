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
    // Fetch both sources in parallel so we can pick based on user preference
    const binancePricePromise = updateCache ? fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL') : Promise.resolve(null);
    const binanceTickerPromise = updateCache ? fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=USDTBRL') : Promise.resolve(null);
    const okxTickerPromise = updateCache ? fetch('https://www.okx.com/api/v5/market/ticker?instId=USDT-BRL') : Promise.resolve(null);

    const [priceResponse, tickerResponse, okxResponse, authResult] = await Promise.all([
      binancePricePromise,
      binanceTickerPromise,
      okxTickerPromise,
      authPromise
    ]);

    // 3. Processar tanto os dados da Binance quanto o Profile em paralelo
    let markupPromise = Promise.resolve(DEFAULT_MARKUP);
    let manualQuotePromise = Promise.resolve(null);
    const user = authResult?.data?.user;
    const userId = user?.id || 'anonymous';
    let userMarkup = DEFAULT_MARKUP;

    let userPriceSource = 'binance';

    if (user) {
      markupPromise = supabaseClient
        .from('profiles')
        .select('markup_percent, price_source')
        .eq('id', user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile?.price_source) {
            userPriceSource = profile.price_source;
          }
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
      let basePrice: number;
      let dailyChangePercent: number;
      let volumeUSDT: number;
      let highPrice24h: number;
      let lowPrice24h: number;
      let tradesCount: number;

      // Parse OKX response if available
      let okxData: any = null;
      try {
        if (okxResponse?.ok) {
          const parsed = await okxResponse.json();
          if (parsed.code === '0' && parsed.data?.[0]) okxData = parsed.data[0];
        }
      } catch { /* ignore */ }

      const useOKX = userPriceSource === 'okx';
      const binanceOk = priceResponse?.ok && tickerResponse?.ok;

      if (useOKX && okxData) {
        // OKX preferred and available
        basePrice = parseFloat(okxData.last);
        const open = parseFloat(okxData.open24h);
        dailyChangePercent = open > 0 ? ((basePrice - open) / open) * 100 : 0;
        volumeUSDT = parseFloat(okxData.volCcy24h || '0');
        highPrice24h = parseFloat(okxData.high24h || '0');
        lowPrice24h = parseFloat(okxData.low24h || '0');
        tradesCount = 0;
        console.log(`📊 OKX price fetched (user preference): ${basePrice}`);
      } else if (binanceOk) {
        // Binance default (or OKX unavailable)
        const [priceJSON, tickerJSON] = await Promise.all([
          priceResponse.json(),
          tickerResponse.json(),
        ]);
        basePrice = parseFloat(priceJSON.price);
        dailyChangePercent = parseFloat(tickerJSON.priceChangePercent || '0');
        volumeUSDT = parseFloat(tickerJSON.volume || '0');
        highPrice24h = parseFloat(tickerJSON.highPrice || '0');
        lowPrice24h = parseFloat(tickerJSON.lowPrice || '0');
        tradesCount = parseInt(tickerJSON.count || '0');
        console.log(`📊 Binance price fetched: ${basePrice}`);
      } else if (okxData) {
        // Binance failed, fallback to OKX
        console.warn('⚠️ Binance failed, falling back to OKX...');
        basePrice = parseFloat(okxData.last);
        const open = parseFloat(okxData.open24h);
        dailyChangePercent = open > 0 ? ((basePrice - open) / open) * 100 : 0;
        volumeUSDT = parseFloat(okxData.volCcy24h || '0');
        highPrice24h = parseFloat(okxData.high24h || '0');
        lowPrice24h = parseFloat(okxData.low24h || '0');
        tradesCount = 0;
        console.log(`📊 OKX fallback price fetched: ${basePrice}`);
      } else {
        throw new Error('All price sources (Binance and OKX) are unavailable');
      }

      const [resolvedMarkup, resolvedManualPrice] = await Promise.all([
        markupPromise,
        manualQuotePromise
      ]);

      userMarkup = resolvedMarkup;
      binanceData = {
        binancePrice: basePrice,
        timestamp: now,
        dailyChangePercent,
        volumeUSDT,
        highPrice24h,
        lowPrice24h,
        tradesCount,
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
