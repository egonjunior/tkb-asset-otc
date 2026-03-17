import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Auth Token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Role check - Use the has_role function if possible, but let's be direct here for resilience
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('Role verification failed or user is not admin:', roleError);
      return new Response(JSON.stringify({ error: 'Acesso negado - privilégios insuficientes' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { documentId, fileType = 'client' } = body;

    if (!documentId) {
      return new Response(JSON.stringify({ error: 'documentId é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing file request: ${documentId} (Type: ${fileType})`);

    // Fetch document metadata - Simplified query to avoid join name issues
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('Error fetching document metadata:', docError);
      return new Response(JSON.stringify({ error: 'Documento não localizado no registro' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Determine path
    const fileUrl = fileType === 'tkb' ? document.tkb_file_url : document.client_file_url;

    if (!fileUrl) {
      return new Response(JSON.stringify({ error: `Ativo ${fileType} não contém anexo vinculado.` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Clean path
    const cleanPath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
    console.log(`Creating signed URL for: ${cleanPath}`);

    // Generate Signed URL
    const { data: signedData, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(cleanPath, 3600);

    if (urlError) {
      console.error('Storage error:', urlError);
      return new Response(JSON.stringify({ error: 'Falha ao acessar storage', details: urlError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Audit log (non-blocking)
    supabase.from('document_audit_log').insert({
      document_id: documentId,
      action: 'admin_viewed',
      performed_by: user.id,
      metadata: { file_type: fileType, timestamp: new Date().toISOString() }
    }).then(({ error }) => {
      if (error) console.error('Failed to write audit log:', error);
    });

    return new Response(JSON.stringify({
      signedUrl: signedData?.signedUrl,
      documentId,
      path: cleanPath
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Global edge function error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
