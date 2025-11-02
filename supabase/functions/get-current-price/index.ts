import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache em memória (válido por 5 segundos)
let priceCache: {
  binancePrice: number;
  tkbPrice: number;
  timestamp: number;
  dailyChangePercent: number;
  volumeUSDT: number;
  highPrice24h: number;
  lowPrice24h: number;
  tradesCount: number;
} | null = null;

const CACHE_DURATION_MS = 5000; // 5 segundos
const TKB_MARKUP = 1.01; // 1% markup - CRÍTICO: NÃO ALTERAR!

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();

    // Retornar cache se ainda válido
    if (priceCache && (now - priceCache.timestamp) < CACHE_DURATION_MS) {
      console.log('Returning cached price');
      return new Response(
        JSON.stringify({
          ...priceCache,
          cached: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar preço da Binance
    console.log('Fetching fresh price from Binance');
    const [priceResponse, tickerResponse] = await Promise.all([
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL'),
      fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=USDTBRL'),
    ]);

    if (!priceResponse.ok || !tickerResponse.ok) {
      throw new Error('Failed to fetch price from Binance');
    }

    const priceData = await priceResponse.json();
    const tickerData = await tickerResponse.json();

    const binancePrice = parseFloat(priceData.price);
    const tkbPrice = binancePrice * TKB_MARKUP;
    
    // Log para validação de markup
    const markupPercent = ((tkbPrice / binancePrice - 1) * 100).toFixed(2);
    console.log(`✅ Markup validado: Binance=${binancePrice.toFixed(4)} | TKB=${tkbPrice.toFixed(4)} | Markup=${markupPercent}%`);

    // Atualizar cache
    priceCache = {
      binancePrice,
      tkbPrice,
      timestamp: now,
      dailyChangePercent: parseFloat(tickerData.priceChangePercent || '0'),
      volumeUSDT: parseFloat(tickerData.volume || '0'),
      highPrice24h: parseFloat(tickerData.highPrice || '0'),
      lowPrice24h: parseFloat(tickerData.lowPrice || '0'),
      tradesCount: parseInt(tickerData.count || '0'),
    };

    console.log(`Price updated: ${binancePrice} -> ${tkbPrice}`);

    return new Response(
      JSON.stringify({
        ...priceCache,
        cached: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching price:', error);
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
