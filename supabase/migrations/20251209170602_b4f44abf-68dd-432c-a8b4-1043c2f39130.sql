-- Tabela para mapeamento de carteiras OKX para identificação de clientes
CREATE TABLE public.okx_wallet_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  alias TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.okx_wallet_aliases ENABLE ROW LEVEL SECURITY;

-- Somente admins podem gerenciar aliases
CREATE POLICY "Admins can view all wallet aliases"
ON public.okx_wallet_aliases
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert wallet aliases"
ON public.okx_wallet_aliases
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update wallet aliases"
ON public.okx_wallet_aliases
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete wallet aliases"
ON public.okx_wallet_aliases
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_okx_wallet_aliases_updated_at
  BEFORE UPDATE ON public.okx_wallet_aliases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_documents_updated_at();