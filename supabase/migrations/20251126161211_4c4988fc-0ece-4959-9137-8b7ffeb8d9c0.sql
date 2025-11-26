-- Add price_source column to partner_b2b_config table
ALTER TABLE partner_b2b_config 
ADD COLUMN price_source TEXT DEFAULT 'binance' 
CHECK (price_source IN ('binance', 'okx'));

COMMENT ON COLUMN partner_b2b_config.price_source IS 
'Fonte de preço para o cliente: binance ou okx';