-- Criar bucket para comprovantes
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false);

-- RLS para permitir usuários fazerem upload dos próprios comprovantes
CREATE POLICY "Users can upload own receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS para permitir usuários visualizarem próprios comprovantes
CREATE POLICY "Users can view own receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS para admin visualizar todos os comprovantes
CREATE POLICY "Admins can view all receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' AND
  auth.jwt() ->> 'email' = 'admin@tkbasset.com'
);

-- Adicionar coluna receipt_url na tabela orders
ALTER TABLE orders 
ADD COLUMN receipt_url text;