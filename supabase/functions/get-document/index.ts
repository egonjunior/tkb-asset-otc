import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Authenticated user:', user.id);

    // Verificar se é admin
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (rolesError || !roles) {
      console.error('Not admin:', rolesError);
      return new Response(JSON.stringify({ error: 'Acesso negado - apenas admins' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Admin verified');

    // Obter parâmetros
    const { documentId, fileType = 'client' } = await req.json();
    console.log('Fetching document:', documentId, 'fileType:', fileType);

    // Buscar documento
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*, profiles!documents_user_id_fkey(full_name, document_number)')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('Document error:', docError);
      return new Response(JSON.stringify({ error: 'Documento não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Decidir qual arquivo retornar
    const fileUrl = fileType === 'tkb' ? document.tkb_file_url : document.client_file_url;
    
    if (!fileUrl) {
      console.error(`File not found for type: ${fileType}`);
      return new Response(JSON.stringify({ 
        error: `Arquivo ${fileType === 'tkb' ? 'TKB' : 'do cliente'} não encontrado` 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Document found:', fileUrl);

    // Gerar signed URL com Service Role (bypass RLS)
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(fileUrl, 3600); // 1 hora

    if (urlError) {
      console.error('Error creating signed URL:', urlError);
      return new Response(JSON.stringify({ error: 'Erro ao gerar URL: ' + urlError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Signed URL created successfully');

    // Log de auditoria
    await supabase.from('document_audit_log').insert({
      document_id: documentId,
      action: 'admin_viewed',
      performed_by: user.id,
      metadata: { document_type: document.document_type }
    });

    console.log('Audit log created');

    return new Response(JSON.stringify({ 
      signedUrl: signedUrl.signedUrl,
      document 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
