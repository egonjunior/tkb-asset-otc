-- Tabela de clientes offline
CREATE TABLE IF NOT EXISTS public.offline_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'CPF',
  document_number TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de transações offline
CREATE TABLE IF NOT EXISTS public.offline_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.offline_clients(id) ON DELETE CASCADE,
  transaction_date TIMESTAMPTZ NOT NULL,
  usdt_amount NUMERIC NOT NULL,
  brl_amount NUMERIC NOT NULL,
  usdt_rate NUMERIC NOT NULL,
  operation_type TEXT NOT NULL DEFAULT 'compra',
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_amounts CHECK (usdt_amount > 0 AND brl_amount > 0 AND usdt_rate > 0)
);

-- Tabela de documentos de clientes offline
CREATE TABLE IF NOT EXISTS public.offline_client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.offline_clients(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  document_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_offline_clients_document ON public.offline_clients(document_number);
CREATE INDEX IF NOT EXISTS idx_offline_transactions_client ON public.offline_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_offline_transactions_date ON public.offline_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_offline_client_documents_client ON public.offline_client_documents(client_id);

-- Enable RLS
ALTER TABLE public.offline_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_client_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Apenas admins podem acessar
CREATE POLICY "Admins can view all offline clients"
  ON public.offline_clients FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert offline clients"
  ON public.offline_clients FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update offline clients"
  ON public.offline_clients FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete offline clients"
  ON public.offline_clients FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all offline transactions"
  ON public.offline_transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert offline transactions"
  ON public.offline_transactions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update offline transactions"
  ON public.offline_transactions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete offline transactions"
  ON public.offline_transactions FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all offline client documents"
  ON public.offline_client_documents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert offline client documents"
  ON public.offline_client_documents FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete offline client documents"
  ON public.offline_client_documents FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket para documentos de clientes offline
INSERT INTO storage.buckets (id, name, public)
VALUES ('offline-client-documents', 'offline-client-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS para storage bucket
CREATE POLICY "Admins can upload offline client documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'offline-client-documents' AND
    public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can view offline client documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'offline-client-documents' AND
    public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete offline client documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'offline-client-documents' AND
    public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_offline_clients_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_offline_clients_updated_at
  BEFORE UPDATE ON public.offline_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_offline_clients_updated_at();

CREATE OR REPLACE FUNCTION public.update_offline_transactions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_offline_transactions_updated_at
  BEFORE UPDATE ON public.offline_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_offline_transactions_updated_at();