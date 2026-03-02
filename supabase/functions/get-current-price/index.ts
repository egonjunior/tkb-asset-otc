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

    // 1. Atualizar cache da Binance se necessário
    if (!binanceCache || (now - binanceCache.timestamp) >= CACHE_DURATION_MS) {
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

      binanceData = {
        binancePrice: parseFloat(priceData.price),
        timestamp: now,
        dailyChangePercent: parseFloat(tickerData.priceChangePercent || '0'),
        volumeUSDT: parseFloat(tickerData.volume || '0'),
        highPrice24h: parseFloat(tickerData.highPrice || '0'),
        lowPrice24h: parseFloat(tickerData.lowPrice || '0'),
        tradesCount: parseInt(tickerData.count || '0'),
      };
      binanceCache = binanceData;
    } else {
      console.log('Using cached Binance price');
    }

    if (!binanceData) throw new Error("Erro ao obter cotação base");

    // 2. Autenticar usuário para buscar Markup Exclusivo
    const authHeader = req.headers.get('Authorization');
    let userMarkup = DEFAULT_MARKUP;
    let userId = 'anonymous';

    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: { headers: { Authorization: authHeader } },
        }
      );

      // Obter usuário logado
      const { data: { user } } = await supabaseClient.auth.getUser();

      if (user) {
        userId = user.id;
        // Buscar markup exclusivo da tabela profiles
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('markup_percent')
          .eq('id', user.id)
          .single();

        if (profile && profile.markup_percent !== null && profile.markup_percent !== undefined) {
          // Convert percentage (e.g. 1.5) to multiplier (1.015)
          userMarkup = 1 + (profile.markup_percent / 100);
          console.log(`[USER ${userId}] Bespoke Markup Encontrado: ${profile.markup_percent}% -> Multiplier: ${userMarkup}`);
        } else {
          console.log(`[USER ${userId}] Sem markup exclusivo. Usando DEFAULT: ${DEFAULT_MARKUP}`);
        }
      }
    } else {
      console.log(`[UNAUTH] Sem Auth Header. Usando DEFAULT: ${DEFAULT_MARKUP}`);
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
