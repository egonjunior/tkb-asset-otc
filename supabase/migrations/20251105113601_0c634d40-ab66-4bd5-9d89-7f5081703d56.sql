-- Criar tabela de leads da landing page /empresas
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  email_corporativo TEXT NOT NULL,
  volume_mensal TEXT NOT NULL,
  necessidade TEXT NOT NULL,
  necessidade_outro TEXT,
  ip_address TEXT,
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  status TEXT DEFAULT 'novo' CHECK (status IN ('novo', 'contatado', 'qualificado', 'convertido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Política: Admin pode ver todos os leads
CREATE POLICY "Admin can view all leads" ON public.leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Inserção pública (via edge function)
CREATE POLICY "Public can insert leads" ON public.leads
  FOR INSERT
  WITH CHECK (true);