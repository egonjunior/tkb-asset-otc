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

    // Preparar promessas
    const binancePromises = updateCache ? [
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL'),
      fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=USDTBRL')
    ] : [];

    const authHeader = req.headers.get('Authorization');
    let supabaseClient = null;
    let authPromise = null;

    if (authHeader) {
      supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      authPromise = supabaseClient.auth.getUser();
    }

    // Executar todas as promessas iniciais em paralelo
    const [priceResponse, tickerResponse, authResult] = await Promise.all([
      ...(binancePromises as any),
      authPromise
    ]);

    // 2. Processar dados da Binance se foram buscados
    if (updateCache) {
      if (!priceResponse.ok || !tickerResponse.ok) {
        throw new Error('Failed to fetch price from Binance');
      }

      const [priceJSON, tickerJSON] = await Promise.all([
        priceResponse.json(),
        tickerResponse.json()
      ]);

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
      console.log('Fresh price from Binance fetched in parallel');
    } else {
      console.log('Using cached Binance price');
    }

    if (!binanceData) throw new Error("Erro ao obter cotação base");

    // 3. Processar Auth e buscar Markup se necessário
    let userMarkup = DEFAULT_MARKUP;
    let userId = 'anonymous';

    if (authResult?.data?.user) {
      const user = authResult.data.user;
      userId = user.id;

      // Buscar markup exclusivo da tabela profiles
      const { data: profile } = await supabaseClient!
        .from('profiles')
        .select('markup_percent')
        .eq('id', user.id)
        .single();

      if (profile && profile.markup_percent !== null && profile.markup_percent !== undefined) {
        userMarkup = 1 + (profile.markup_percent / 100);
        console.log(`[USER ${userId}] Bespoke Markup: ${profile.markup_percent}%`);
      }
    }

    // 3. Calcular Preço TKB Dinâmico
    const tkbPrice = binanceData.binancePrice * userMarkup;
    const markupPercentStr = ((tkbPrice / binanceData.binancePrice - 1) * 100).toFixed(2);
    console.log(`✅ Cotação Final [${userId}]: Binance=${binanceData.binancePrice.toFixed(4)} | TKB=${tkbPrice.toFixed(4)} | Spread Aplicado=${markupPercentStr}%`);

    return new Response(
      JSON.stringify({
        ...binanceData,
        tkbPrice,
        cached: now === binanceData.timestamp ? false : true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

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
