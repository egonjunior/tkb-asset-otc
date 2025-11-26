-- Add price_source column to otc_quote_clients table
ALTER TABLE otc_quote_clients 
ADD COLUMN price_source TEXT DEFAULT 'binance' 
CHECK (price_source IN ('binance', 'okx'));

COMMENT ON COLUMN otc_quote_clients.price_source IS 
'Fonte de preço para o cliente OTC: binance ou okx';