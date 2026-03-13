import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceCache {
  data: any;
  timestamp: number;
}

const priceCache = new Map<string, PriceCache>();
const CACHE_DURATION_MS = 5000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let slug = url.searchParams.get('slug');

    // Se não vier na URL, tentar pegar do body
    if (!slug) {
      try {
        const body = await req.json();
        slug = body.slug;
      } catch {
        // Body vazio ou inválido
      }
    }

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Slug do cliente é obrigatório' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    slug = slug.toLowerCase();
    const now = Date.now();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Iniciar todas as buscas em paralelo (Banco de dados + Binance + OKX)
    // Isso garante que os dados de mercado já estarão prontos quando o config chegar.
    const fetchConfigPromise = supabase
      .from('otc_quote_clients')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    const fetchBinancePromise = (async () => {
      try {
        const [priceRes, tickerRes] = await Promise.all([
          fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL'),
          fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=USDTBRL'),
        ]);
        if (!priceRes.ok || !tickerRes.ok) return null;
        const [p, t] = await Promise.all([priceRes.json(), tickerRes.json()]);
        return {
          last: p.price,
          high24h: t.highPrice,
          low24h: t.lowPrice,
          vol24h: t.volume,
          sodUtc8: t.priceChangePercent,
          source: 'binance'
        };
      } catch { return null; }
    })();

    const fetchOKXPromise = (async () => {
      try {
        const res = await fetch('https://www.okx.com/api/v5/market/ticker?instId=USDT-BRL');
        if (!res.ok) return null;
        const d = await res.json();
        if (d.code !== '0' || !d.data?.[0]) return null;
        return { ...d.data[0], source: 'okx' };
      } catch { return null; }
    })();

    const [configResult, binanceResult, okxResult] = await Promise.all([
      fetchConfigPromise,
      fetchBinancePromise,
      fetchOKXPromise
    ]);

    const { data: clientConfig, error: dbError } = configResult;

    if (dbError || !clientConfig) {
      return new Response(
        JSON.stringify({ error: 'Cliente OTC não encontrado ou inativo.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const priceSource = clientConfig.price_source || 'binance';
    const cacheKey = `otc_${slug}_${priceSource}`;

    // ... resto da lógica de cache se necessário, mas como já buscamos tudo, vamos processar

    let tickerData = priceSource === 'okx' ? (okxResult || binanceResult) : (binanceResult || okxResult);

    if (!tickerData) {
      throw new Error('Todas as fontes de cotação estão indisponíveis.');
    }

    const basePrice = parseFloat(tickerData.last);

    const markup = 1 + clientConfig.spread_percent / 100;
    const clientPrice = basePrice * markup;

    const standardPrice = basePrice * 1.01;
    const savings = standardPrice - clientPrice;
    const savingsPercent = ((savings / standardPrice) * 100).toFixed(2);

    const responseData = {
      priceSource: priceSource,
      client: {
        slug: clientConfig.slug,
        name: clientConfig.client_name,
        spreadPercent: clientConfig.spread_percent,
      },
      prices: {
        basePrice: parseFloat((basePrice || 0).toFixed(4)),
        okxPrice: parseFloat((basePrice || 0).toFixed(4)), // Backwards compatibility
        clientPrice: parseFloat((clientPrice || 0).toFixed(4)),
        standardPrice: parseFloat((standardPrice || 0).toFixed(4)),
      },
      savings: {
        amount: parseFloat((savings || 0).toFixed(4)),
        percent: savingsPercent || "0.00",
      },
      market24h: {
        high: parseFloat(tickerData?.high24h || tickerData?.high || '0'),
        low: parseFloat(tickerData?.low24h || tickerData?.low || '0'),
        volume: parseFloat(tickerData?.vol24h || tickerData?.vol || '0'),
        changePercent: parseFloat(tickerData?.sodUtc8 || tickerData?.priceChangePercent || tickerData?.change24h || '0'),
      },
      timestamp: new Date().toISOString(),
    };

    priceCache.set(cacheKey, { data: responseData, timestamp: now });

    console.log(`✅ OTC Quote para ${slug}: Fonte=${priceSource.toUpperCase()} | Base=${basePrice.toFixed(4)} | Cliente=${clientPrice.toFixed(4)} | Spread=${clientConfig.spread_percent}%`);

    return new Response(
      JSON.stringify({ ...responseData, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Erro em get-otc-quote:', error);
    // Retornamos status 200 com JSON {error: ...} para que o cliente supabase frontend não estoure
    // o "FunctionsHttpError: Edge Function returned a non-2xx status code" ocultando o erro real.
    return new Response(
      JSON.stringify({ error: error.message || 'Erro desconhecido na Edge Function' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});