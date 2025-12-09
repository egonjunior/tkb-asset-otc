import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OKX API V5 Endpoints
const OKX_BASE_URL = 'https://www.okx.com';

interface OkxRequestParams {
  method: string;
  path: string;
  params?: Record<string, string>;
}

async function signOkxRequest({ method, path, params }: OkxRequestParams): Promise<{
  signature: string;
  timestamp: string;
}> {
  const apiKey = Deno.env.get('OKX_API_KEY');
  const secretKey = Deno.env.get('OKX_API_SECRET');
  const passphrase = Deno.env.get('OKX_PASSPHRASE');
  
  if (!apiKey || !secretKey || !passphrase) {
    throw new Error('OKX credentials not configured');
  }

  const timestamp = new Date().toISOString();
  
  let queryString = '';
  if (params && Object.keys(params).length > 0) {
    queryString = '?' + new URLSearchParams(params).toString();
  }
  
  const preHash = timestamp + method.toUpperCase() + path + queryString;
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const msgData = encoder.encode(preHash);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  
  return { signature, timestamp };
}

async function fetchOkxApi(path: string, params: Record<string, string> = {}): Promise<any> {
  const apiKey = Deno.env.get('OKX_API_KEY');
  const passphrase = Deno.env.get('OKX_PASSPHRASE');
  
  const { signature, timestamp } = await signOkxRequest({
    method: 'GET',
    path,
    params
  });
  
  let url = OKX_BASE_URL + path;
  if (Object.keys(params).length > 0) {
    url += '?' + new URLSearchParams(params).toString();
  }
  
  console.log(`[OKX] Fetching: ${path}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'OK-ACCESS-KEY': apiKey!,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': passphrase!,
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json();
  
  if (data.code !== '0') {
    console.error(`[OKX] API Error:`, data);
    throw new Error(`OKX API Error: ${data.msg || 'Unknown error'}`);
  }
  
  return data.data;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check admin role
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error('Admin access required');
    }

    const { type, startDate, endDate } = await req.json();
    
    console.log(`[OKX] Request type: ${type}, from ${startDate} to ${endDate}`);

    // Fetch wallet aliases for withdrawal mapping
    const { data: aliases } = await supabaseClient
      .from('okx_wallet_aliases')
      .select('wallet_address, alias');
    
    const aliasMap = new Map(aliases?.map(a => [a.wallet_address.toLowerCase(), a.alias]) || []);

    let result: any[] = [];

    // Calculate date range (OKX uses milliseconds timestamp)
    const after = startDate ? new Date(startDate).getTime().toString() : undefined;
    const before = endDate ? new Date(endDate).getTime().toString() : undefined;

    if (type === 'deposits') {
      // Fetch BRL deposits (fiat deposits)
      const params: Record<string, string> = { ccy: 'BRL' };
      if (after) params.after = after;
      if (before) params.before = before;
      
      const deposits = await fetchOkxApi('/api/v5/asset/deposit-history', params);
      
      result = deposits?.map((d: any) => ({
        id: d.depId,
        amount: parseFloat(d.amt),
        currency: d.ccy,
        status: d.state,
        timestamp: new Date(parseInt(d.ts)).toISOString(),
        txId: d.txId,
        from: d.from,
      })) || [];
      
    } else if (type === 'purchases') {
      // Fetch USDT/BRL spot trades (filled orders)
      const params: Record<string, string> = { 
        instType: 'SPOT',
        instId: 'USDT-BRL'
      };
      if (after) params.after = after;
      if (before) params.before = before;
      
      const trades = await fetchOkxApi('/api/v5/trade/orders-history-archive', params);
      
      result = (trades || [])
        .filter((t: any) => t.state === 'filled')
        .map((t: any) => ({
          id: t.ordId,
          side: t.side,
          amount: parseFloat(t.sz),
          price: parseFloat(t.avgPx),
          total: parseFloat(t.sz) * parseFloat(t.avgPx),
          currency: 'USDT',
          status: t.state,
          timestamp: new Date(parseInt(t.uTime)).toISOString(),
        }));
        
    } else if (type === 'withdrawals') {
      // Fetch USDT withdrawals
      const params: Record<string, string> = { ccy: 'USDT' };
      if (after) params.after = after;
      if (before) params.before = before;
      
      const withdrawals = await fetchOkxApi('/api/v5/asset/withdrawal-history', params);
      
      result = withdrawals?.map((w: any) => {
        const address = w.toAddr?.toLowerCase() || '';
        const alias = aliasMap.get(address);
        
        return {
          id: w.wdId,
          amount: parseFloat(w.amt),
          fee: parseFloat(w.fee || 0),
          currency: w.ccy,
          network: w.chain,
          status: w.state,
          timestamp: new Date(parseInt(w.ts)).toISOString(),
          txId: w.txId,
          toAddress: w.toAddr,
          alias: alias || null,
        };
      }) || [];
    } else {
      throw new Error('Invalid operation type');
    }

    console.log(`[OKX] Returning ${result.length} records`);

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[OKX] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: errorMessage === 'Unauthorized' || errorMessage === 'Admin access required' ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
