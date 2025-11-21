-- Criar tabela para clientes OTC
CREATE TABLE otc_quote_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  spread_percent DECIMAL(5,3) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes para performance
CREATE INDEX idx_otc_quote_clients_slug ON otc_quote_clients(slug);
CREATE INDEX idx_otc_quote_clients_active ON otc_quote_clients(is_active);

-- RLS
ALTER TABLE otc_quote_clients ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar
CREATE POLICY "Admins manage OTC quote clients"
  ON otc_quote_clients
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Leitura pública para edge function (apenas ativos)
CREATE POLICY "Public read active clients"
  ON otc_quote_clients
  FOR SELECT
  USING (is_active = true);

-- Trigger para updated_at
CREATE TRIGGER update_otc_quote_clients_updated_at
  BEFORE UPDATE ON otc_quote_clients
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- Inserir primeiro cliente: blackhole
INSERT INTO otc_quote_clients (slug, client_name, spread_percent, is_active)
VALUES ('blackhole', 'Black Hole Capital', 0.5, true);