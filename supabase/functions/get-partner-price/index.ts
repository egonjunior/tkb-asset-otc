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
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is a B2B partner
    const { data: partnerConfig } = await supabase
      .from('partner_b2b_config')
      .select('markup_percent, is_active, company_name')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    // Determine markup
    const markup = partnerConfig 
      ? (1 + partnerConfig.markup_percent / 100)  // Ex: 1.004 for 0.4%
      : 1.01; // Default: 1%

    const cacheKey = `price_${markup}`;
    const now = Date.now();

    // Check cache
    if (priceCache.has(cacheKey)) {
      const cached = priceCache.get(cacheKey)!;
      if (now - cached.timestamp < CACHE_DURATION_MS) {
        console.log(`✅ Returning cached price for markup ${markup}`);
        return new Response(
          JSON.stringify({ ...cached.data, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch price from Binance
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
    const tkbPrice = binancePrice * markup;
    const standardPrice = binancePrice * 1.01; // Standard 1% markup for comparison

    const responseData = {
      binancePrice,
      tkbPrice,
      standardPrice,
      markup: markup,
      markupPercent: ((markup - 1) * 100).toFixed(3),
      isB2BPartner: !!partnerConfig,
      companyName: partnerConfig?.company_name || null,
      savings: partnerConfig ? standardPrice - tkbPrice : 0,
      savingsPercent: partnerConfig ? (((standardPrice - tkbPrice) / standardPrice) * 100).toFixed(2) : '0',
      dailyChangePercent: parseFloat(tickerData.priceChangePercent || '0'),
      volumeUSDT: parseFloat(tickerData.volume || '0'),
      highPrice24h: parseFloat(tickerData.highPrice || '0'),
      lowPrice24h: parseFloat(tickerData.lowPrice || '0'),
      tradesCount: parseInt(tickerData.count || '0'),
    };

    // Update cache
    priceCache.set(cacheKey, { data: responseData, timestamp: now });

    console.log(`✅ Price for user ${user.id}: Binance=${binancePrice.toFixed(4)} | TKB=${tkbPrice.toFixed(4)} | Markup=${responseData.markupPercent}% | B2B=${!!partnerConfig}`);

    return new Response(
      JSON.stringify({ ...responseData, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in get-partner-price:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
