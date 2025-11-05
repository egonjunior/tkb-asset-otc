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

    // Enviar email de notificação para TKB
    await supabaseClient.functions.invoke('send-email', {
      body: {
        to: 'contato@tkbasset.com',
        subject: `🔥 Novo Lead Empresas - ${nome_completo}`,
        html: `
          <h2>Novo Lead via /empresas</h2>
          <p><strong>Nome:</strong> ${nome_completo}</p>
          <p><strong>Email:</strong> ${email_corporativo}</p>
          <p><strong>Volume Mensal:</strong> ${volume_mensal}</p>
          <p><strong>Necessidade:</strong> ${necessidade}</p>
          ${necessidade_outro ? `<p><strong>Detalhes:</strong> ${necessidade_outro}</p>` : ''}
          <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        `
      }
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Lead registrado com sucesso!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
