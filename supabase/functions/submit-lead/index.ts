import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { nome_completo, email_corporativo, volume_mensal, necessidade, necessidade_outro } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Inserir lead no banco
    const { error: insertError } = await supabaseClient
      .from('leads')
      .insert({
        nome_completo,
        email_corporativo,
        volume_mensal,
        necessidade,
        necessidade_outro,
        ip_address: req.headers.get('x-forwarded-for'),
        user_agent: req.headers.get('user-agent')
      });

    if (insertError) throw insertError;

    // Enviar email de notificação para TKB usando internal_secret
    await supabaseClient.functions.invoke('send-email', {
      body: {
        type: 'new-lead',
        to: 'contato@tkbasset.com',
        data: {
          nome_completo,
          email_corporativo,
          volume_mensal,
          necessidade,
          necessidade_outro,
          data: new Date().toLocaleString('pt-BR')
        },
        internal_secret: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      }
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Lead registrado com sucesso!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
