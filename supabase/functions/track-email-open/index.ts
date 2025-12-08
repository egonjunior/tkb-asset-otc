import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pixel 1x1 transparente em GIF
const TRANSPARENT_GIF = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), c => c.charCodeAt(0));

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get('order_id');

    if (!orderId) {
      console.log('[track-email-open] Missing order_id parameter');
      return new Response(TRANSPARENT_GIF, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          ...corsHeaders
        }
      });
    }

    console.log(`[track-email-open] Email opened for order: ${orderId}`);

    // Criar cliente Supabase com service role para bypass de RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se já foi registrado
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('hash_email_opened_at')
      .eq('id', orderId)
      .single();

    if (fetchError) {
      console.error('[track-email-open] Error fetching order:', fetchError);
      return new Response(TRANSPARENT_GIF, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          ...corsHeaders
        }
      });
    }

    // Se já foi registrado, não registrar novamente
    if (order?.hash_email_opened_at) {
      console.log(`[track-email-open] Email already tracked for order: ${orderId}`);
      return new Response(TRANSPARENT_GIF, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          ...corsHeaders
        }
      });
    }

    // Registrar abertura do email
    const { error: updateError } = await supabase
      .from('orders')
      .update({ hash_email_opened_at: new Date().toISOString() })
      .eq('id', orderId);

    if (updateError) {
      console.error('[track-email-open] Error updating order:', updateError);
    } else {
      console.log(`[track-email-open] Successfully tracked email open for order: ${orderId}`);

      // Adicionar evento na timeline
      const { error: timelineError } = await supabase
        .from('order_timeline')
        .insert({
          order_id: orderId,
          event_type: 'hash_email_opened',
          message: 'Cliente abriu o email com a hash da transação',
          actor_type: 'system'
        });

      if (timelineError) {
        console.error('[track-email-open] Error inserting timeline event:', timelineError);
      }
    }

    // Retornar pixel transparente
    return new Response(TRANSPARENT_GIF, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('[track-email-open] Unexpected error:', error);
    return new Response(TRANSPARENT_GIF, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        ...corsHeaders
      }
    });
  }
});
