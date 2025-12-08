import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GetUserEmailRequest {
  user_id: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id }: GetUserEmailRequest = await req.json();

    if (!user_id) {
      console.error('get-user-email: user_id não fornecido');
      return new Response(
        JSON.stringify({ error: 'user_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('get-user-email: Buscando email para user_id:', user_id);

    // Criar cliente admin com service_role para acessar auth.users
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Buscar usuário pelo ID usando API Admin
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id);

    if (userError) {
      console.error('get-user-email: Erro ao buscar usuário:', userError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar usuário', details: userError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userData?.user) {
      console.error('get-user-email: Usuário não encontrado:', user_id);
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const email = userData.user.email;
    console.log('get-user-email: Email encontrado para user_id', user_id, ':', email);

    // Também atualizar o profile com o email para evitar futuras chamadas
    if (email) {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ email })
        .eq('id', user_id);

      if (updateError) {
        console.warn('get-user-email: Não foi possível atualizar profile com email:', updateError);
      } else {
        console.log('get-user-email: Profile atualizado com email');
      }
    }

    return new Response(
      JSON.stringify({ email }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('get-user-email: Erro inesperado:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
