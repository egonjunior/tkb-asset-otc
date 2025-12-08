-- Adicionar campos de rastreamento na tabela orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS hash_viewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS hash_viewed_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hash_email_opened_at TIMESTAMP WITH TIME ZONE;