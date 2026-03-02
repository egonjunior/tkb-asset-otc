-- Add new columns to support bespoke B2B pricing and onboarding requests
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS markup_percent NUMERIC(5, 2) DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pricing_status TEXT DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS commercial_details TEXT DEFAULT NULL;

-- Update existing profiles (like Admins and prior users) to be fully active by default
UPDATE public.profiles SET pricing_status = 'active' WHERE id IS NOT NULL;
