-- Add price_source column to profiles table for per-user price source selection
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS price_source TEXT DEFAULT 'binance'
CHECK (price_source IN ('binance', 'okx'));

COMMENT ON COLUMN public.profiles.price_source IS 'Price source for this user: binance (default) or okx';
