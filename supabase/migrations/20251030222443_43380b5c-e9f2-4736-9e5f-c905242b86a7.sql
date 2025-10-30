-- Cancelar ordem antiga com locked_at NULL (usar 'expired' ao invés de 'cancelled')
UPDATE orders 
SET status = 'expired' 
WHERE id = 'OTC-2025-001' AND status = 'pending';

-- Adicionar coluna wallet_address à tabela orders
ALTER TABLE orders 
ADD COLUMN wallet_address text;