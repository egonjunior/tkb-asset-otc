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
      throw new Error('Slug do cliente é obrigatório');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: clientConfig, error: dbError } = await supabase
      .from('otc_quote_clients')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (dbError || !clientConfig) {
      throw new Error('Cliente OTC não encontrado ou inativo');
    }

    const priceSource = clientConfig.price_source || 'binance';
    const cacheKey = `otc_${slug}_${priceSource}`;
    const now = Date.now();

    if (priceCache.has(cacheKey)) {
      const cached = priceCache.get(cacheKey)!;
      if (now - cached.timestamp < CACHE_DURATION_MS) {
        console.log(`✅ Cache hit para ${slug} (fonte: ${priceSource})`);
        return new Response(
          JSON.stringify({ ...cached.data, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`🔍 Buscando preço de ${priceSource.toUpperCase()} para ${slug}`);
    
    let basePrice: number;
    let tickerData: any;

    if (priceSource === 'okx') {
      // Fetch from OKX
      const okxResponse = await fetch(
        'https://www.okx.com/api/v5/market/ticker?instId=USDT-BRL'
      );

      if (!okxResponse.ok) {
        throw new Error('Falha ao buscar preço da OKX');
      }

      const okxData = await okxResponse.json();
      
      if (okxData.code !== '0' || !okxData.data || okxData.data.length === 0) {
        throw new Error('Dados inválidos da OKX');
      }

      tickerData = okxData.data[0];
      basePrice = parseFloat(tickerData.last);
    } else {
      // Fetch from Binance (default)
      const [priceResponse, ticker24hResponse] = await Promise.all([
        fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL'),
        fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=USDTBRL'),
      ]);

      if (!priceResponse.ok || !ticker24hResponse.ok) {
        throw new Error('Falha ao buscar preço da Binance');
      }

      const priceData = await priceResponse.json();
      const ticker24h = await ticker24hResponse.json();
      
      basePrice = parseFloat(priceData.price);
      
      // Adapt Binance data to match OKX format
      tickerData = {
        last: basePrice.toString(),
        high24h: ticker24h.highPrice,
        low24h: ticker24h.lowPrice,
        vol24h: ticker24h.volume,
        sodUtc8: ticker24h.priceChangePercent,
      };
    }
    
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
        basePrice: parseFloat(basePrice.toFixed(4)),
        okxPrice: parseFloat(basePrice.toFixed(4)), // Backwards compatibility
        clientPrice: parseFloat(clientPrice.toFixed(4)),
        standardPrice: parseFloat(standardPrice.toFixed(4)),
      },
      savings: {
        amount: parseFloat(savings.toFixed(4)),
        percent: savingsPercent,
      },
      market24h: {
        high: parseFloat(tickerData.high24h || '0'),
        low: parseFloat(tickerData.low24h || '0'),
        volume: parseFloat(tickerData.vol24h || '0'),
        changePercent: parseFloat(tickerData.sodUtc8 || '0'),
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
    return new Response(
      JSON.stringify({ error: error.message || 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});