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
  body?: string;
}

async function signOkxRequest({ method, path, params, body }: OkxRequestParams): Promise<{
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
  
  // OKX signature: timestamp + method + requestPath + body
  const preHash = timestamp + method.toUpperCase() + path + queryString + (body || '');
  
  console.log(`[OKX] PreHash string: ${preHash}`);
  
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
  
  console.log(`[OKX] Fetching: ${url}`);
  console.log(`[OKX] Params: ${JSON.stringify(params)}`);
  
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
  
  console.log(`[OKX] Response code: ${data.code}, msg: ${data.msg}`);
  console.log(`[OKX] Data count: ${data.data?.length || 0}`);
  
  if (data.code !== '0') {
    console.error(`[OKX] API Error:`, JSON.stringify(data));
    throw new Error(`OKX API Error: ${data.msg || 'Unknown error'} (code: ${data.code})`);
  }
  
  return data.data;
}

// Fetch all pages of data from OKX API
async function fetchAllOkxData(path: string, baseParams: Record<string, string> = {}): Promise<any[]> {
  let allData: any[] = [];
  let lastId: string | undefined;
  let hasMore = true;
  let pageCount = 0;
  const maxPages = 10; // Safety limit
  
  while (hasMore && pageCount < maxPages) {
    const params = { ...baseParams };
    if (lastId) {
      params.after = lastId; // OKX uses 'after' for pagination (older records)
    }
    
    console.log(`[OKX] Fetching page ${pageCount + 1}, after: ${lastId || 'none'}`);
    
    const data = await fetchOkxApi(path, params);
    
    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allData = allData.concat(data);
      // Get the last ID for pagination
      const lastRecord = data[data.length - 1];
      lastId = lastRecord.depId || lastRecord.wdId || lastRecord.ordId || lastRecord.billId;
      
      // If we got less than 100 records, we've reached the end
      if (data.length < 100) {
        hasMore = false;
      }
    }
    
    pageCount++;
  }
  
  console.log(`[OKX] Total records fetched: ${allData.length} in ${pageCount} pages`);
  return allData;
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
    
    console.log(`[OKX] ========== NEW REQUEST ==========`);
    console.log(`[OKX] Request type: ${type}`);
    console.log(`[OKX] Date range: ${startDate || 'none'} to ${endDate || 'none'}`);

    // Fetch wallet aliases for withdrawal mapping
    const { data: aliases } = await supabaseClient
      .from('okx_wallet_aliases')
      .select('wallet_address, alias');
    
    const aliasMap = new Map(aliases?.map(a => [a.wallet_address.toLowerCase(), a.alias]) || []);

    let result: any[] = [];

    if (type === 'deposits') {
      // Try crypto deposits first
      console.log('[OKX] Fetching crypto deposits (USDT)...');
      const cryptoParams: Record<string, string> = { ccy: 'USDT' };
      
      try {
        const cryptoDeposits = await fetchAllOkxData('/api/v5/asset/deposit-history', cryptoParams);
        console.log(`[OKX] Crypto deposits found: ${cryptoDeposits?.length || 0}`);
        
        if (cryptoDeposits && cryptoDeposits.length > 0) {
          console.log(`[OKX] Sample crypto deposit:`, JSON.stringify(cryptoDeposits[0]));
        }
        
        result = cryptoDeposits?.map((d: any) => ({
          id: d.depId,
          amount: parseFloat(d.amt),
          currency: d.ccy,
          status: mapDepositStatus(d.state),
          timestamp: new Date(parseInt(d.ts)).toISOString(),
          txId: d.txId,
          from: d.from,
          network: d.chain,
        })) || [];
      } catch (e) {
        console.log(`[OKX] Crypto deposits error: ${e}`);
      }

      // Also try BRL deposits (fiat) - Using correct endpoint
      console.log('[OKX] Fetching fiat orders (BRL)...');
      try {
        // Use /api/v5/fiat/orders for fiat deposit/withdraw orders
        const fiatOrders = await fetchOkxApi('/api/v5/fiat/orders', {});
        console.log(`[OKX] Fiat orders found: ${fiatOrders?.length || 0}`);
        
        if (fiatOrders && fiatOrders.length > 0) {
          console.log(`[OKX] Sample fiat order:`, JSON.stringify(fiatOrders[0]));
          
          // Filter only BRL deposits (side = 'buy' means deposit into OKX)
          const brlDeposits = fiatOrders
            .filter((d: any) => d.ccy === 'BRL' && d.side === 'buy')
            .map((d: any) => ({
              id: d.ordId,
              amount: parseFloat(d.amt || d.quoteSz || 0),
              currency: 'BRL',
              status: mapFiatOrderStatus(d.state),
              timestamp: new Date(parseInt(d.uTime || d.cTime)).toISOString(),
              txId: null,
              from: 'PIX/TED',
              network: 'Fiat',
            }));
          
          console.log(`[OKX] BRL deposits mapped: ${brlDeposits.length}`);
          result = result.concat(brlDeposits);
        }
      } catch (e) {
        console.log(`[OKX] Fiat orders error: ${e}`);
      }
      
    } else if (type === 'purchases') {
      // Fetch recent trades first (last 3 months)
      console.log('[OKX] Fetching recent USDT-BRL trades...');
      const tradeParams: Record<string, string> = { 
        instType: 'SPOT',
        instId: 'USDT-BRL'
      };
      
      try {
        // Try recent orders first
        const recentTrades = await fetchAllOkxData('/api/v5/trade/orders-history', tradeParams);
        console.log(`[OKX] Recent trades found: ${recentTrades?.length || 0}`);
        
        if (recentTrades && recentTrades.length > 0) {
          console.log(`[OKX] Sample trade:`, JSON.stringify(recentTrades[0]));
        }
        
        result = (recentTrades || [])
          .filter((t: any) => t.state === 'filled')
          .map((t: any) => ({
            id: t.ordId,
            side: t.side,
            amount: parseFloat(t.sz),
            price: parseFloat(t.avgPx || t.px || 0),
            total: parseFloat(t.sz) * parseFloat(t.avgPx || t.px || 0),
            currency: 'USDT',
            status: t.state,
            timestamp: new Date(parseInt(t.uTime || t.cTime)).toISOString(),
          }));
      } catch (e) {
        console.log(`[OKX] Recent trades error: ${e}`);
      }
      
      // Also try archived orders (older than 3 months)
      console.log('[OKX] Fetching archived USDT-BRL trades...');
      try {
        const archivedTrades = await fetchAllOkxData('/api/v5/trade/orders-history-archive', tradeParams);
        console.log(`[OKX] Archived trades found: ${archivedTrades?.length || 0}`);
        
        const archivedMapped = (archivedTrades || [])
          .filter((t: any) => t.state === 'filled')
          .map((t: any) => ({
            id: t.ordId,
            side: t.side,
            amount: parseFloat(t.sz),
            price: parseFloat(t.avgPx || t.px || 0),
            total: parseFloat(t.sz) * parseFloat(t.avgPx || t.px || 0),
            currency: 'USDT',
            status: t.state,
            timestamp: new Date(parseInt(t.uTime || t.cTime)).toISOString(),
          }));
        
        result = result.concat(archivedMapped);
      } catch (e) {
        console.log(`[OKX] Archived trades error: ${e}`);
      }
      
      // DEDUPLICATE by ordId to avoid showing same order twice
      const uniqueOrdersMap = new Map<string, any>();
      result.forEach(order => {
        if (!uniqueOrdersMap.has(order.id)) {
          uniqueOrdersMap.set(order.id, order);
        }
      });
      result = Array.from(uniqueOrdersMap.values());
      console.log(`[OKX] After deduplication: ${result.length} unique orders`);
      
      // Also try to get fills/trades history
      console.log('[OKX] Fetching fills history...');
      try {
        const fills = await fetchAllOkxData('/api/v5/trade/fills', { instType: 'SPOT', instId: 'USDT-BRL' });
        console.log(`[OKX] Fills found: ${fills?.length || 0}`);
        
        if (fills && fills.length > 0) {
          console.log(`[OKX] Sample fill:`, JSON.stringify(fills[0]));
        }
      } catch (e) {
        console.log(`[OKX] Fills error: ${e}`);
      }
        
    } else if (type === 'withdrawals') {
      // Fetch USDT withdrawals
      console.log('[OKX] Fetching USDT withdrawals...');
      const withdrawParams: Record<string, string> = { ccy: 'USDT' };
      
      try {
        const withdrawals = await fetchAllOkxData('/api/v5/asset/withdrawal-history', withdrawParams);
        console.log(`[OKX] Withdrawals found: ${withdrawals?.length || 0}`);
        
        if (withdrawals && withdrawals.length > 0) {
          console.log(`[OKX] Sample withdrawal:`, JSON.stringify(withdrawals[0]));
        }
        
        result = withdrawals?.map((w: any) => {
          const address = w.toAddr?.toLowerCase() || '';
          const alias = aliasMap.get(address);
          
          return {
            id: w.wdId,
            amount: parseFloat(w.amt),
            fee: parseFloat(w.fee || 0),
            currency: w.ccy,
            network: w.chain,
            status: mapWithdrawalStatus(w.state),
            timestamp: new Date(parseInt(w.ts)).toISOString(),
            txId: w.txId,
            toAddress: w.toAddr,
            alias: alias || null,
          };
        }) || [];
      } catch (e) {
        console.log(`[OKX] Withdrawals error: ${e}`);
      }
    } else {
      throw new Error('Invalid operation type');
    }

    // Sort by timestamp descending
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Filter by date range if provided
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate + 'T23:59:59') : new Date();
      
      result = result.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= start && itemDate <= end;
      });
      
      console.log(`[OKX] After date filter: ${result.length} records`);
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

// Map OKX deposit states to readable status
function mapDepositStatus(state: string): string {
  const statusMap: Record<string, string> = {
    '0': 'waiting',
    '1': 'credited',
    '2': 'successful',
    '8': 'pending',
    '11': 'match',
    '12': 'complete',
  };
  return statusMap[state] || state;
}

// Map OKX withdrawal states to readable status
function mapWithdrawalStatus(state: string): string {
  const statusMap: Record<string, string> = {
    '-3': 'canceling',
    '-2': 'canceled',
    '-1': 'failed',
    '0': 'pending',
    '1': 'sending',
    '2': 'sent',
    '3': 'awaiting email',
    '4': 'awaiting verification',
    '5': 'awaiting identity',
    '6': 'awaiting withdrawal',
    '7': 'approved',
    '10': 'waiting transfer',
    '11': 'waiting for confirmation',
  };
  return statusMap[state] || state;
}

// Map OKX fiat order states to readable status
function mapFiatOrderStatus(state: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'processing': 'processing',
    'completed': 'completed',
    'failed': 'failed',
    'cancelled': 'cancelled',
  };
  return statusMap[state] || state;
}
