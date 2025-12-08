-- Atualizar a constraint valid_status para incluir 'processing' e 'rejected'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS valid_status;
ALTER TABLE orders ADD CONSTRAINT valid_status 
  CHECK (status IN ('pending', 'paid', 'processing', 'completed', 'expired', 'rejected'));