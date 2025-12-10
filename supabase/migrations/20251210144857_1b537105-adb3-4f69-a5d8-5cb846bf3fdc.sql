-- Tabela para múltiplos comprovantes por ordem
CREATE TABLE public.order_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  uploaded_by UUID NOT NULL
);

-- Index para buscar comprovantes por ordem
CREATE INDEX idx_order_receipts_order_id ON order_receipts(order_id);

-- RLS
ALTER TABLE order_receipts ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver comprovantes das próprias ordens
CREATE POLICY "Users can view own order receipts"
  ON order_receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_receipts.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Usuário pode inserir comprovantes nas próprias ordens
CREATE POLICY "Users can insert own order receipts"
  ON order_receipts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Admin pode ver todos
CREATE POLICY "Admins can view all receipts"
  ON order_receipts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));