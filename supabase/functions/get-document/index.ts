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
    let fileUrl = fileType === 'tkb' ? document.tkb_file_url : document.client_file_url;

    if (!fileUrl) {
      console.error(`File path is empty for type: ${fileType}. Document:`, document.id);
      return new Response(JSON.stringify({
        error: `Caminho do arquivo ${fileType === 'tkb' ? 'TKB' : 'do cliente'} não registrado no banco de dados.`
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Limpar o path (remover barras extras no início se houver)
    const cleanPath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
    console.log(`Generating signed URL for bucket 'documents', path: ${cleanPath}`);

    // Gerar signed URL com Service Role (bypass RLS)
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(cleanPath, 3600); // 1 hora

    if (urlError) {
      console.error('Error creating signed URL in bucket documents:', urlError);
      return new Response(JSON.stringify({
        error: 'Erro do Storage: ' + urlError.message,
        details: urlError,
        path: cleanPath
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!signedUrl?.signedUrl) {
      console.error('Storage did not return a signed URL even without error');
      return new Response(JSON.stringify({ error: 'Storage não retornou link assinado.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Signed URL created successfully');

    // Log de auditoria - resiliente
    try {
      await supabase.from('document_audit_log').insert({
        document_id: documentId,
        action: 'admin_viewed',
        performed_by: user.id,
        metadata: {
          document_type: document.document_type,
          file_type: fileType,
          path: cleanPath
        }
      });
      console.log('Audit log created');
    } catch (auditError) {
      console.error('Audit log failed (resiliently ignored):', auditError);
    }

    return new Response(JSON.stringify({
      signedUrl: signedUrl.signedUrl,
      document,
      path: cleanPath
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
