-- Add user_id to partner_requests for B2B linking
ALTER TABLE public.partner_requests 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add trading_volume_monthly to partner_requests
ALTER TABLE public.partner_requests 
ADD COLUMN IF NOT EXISTS trading_volume_monthly NUMERIC;