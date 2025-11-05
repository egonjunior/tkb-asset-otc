-- Add b2b_partner to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'b2b_partner';

-- Create partner_b2b_config table
CREATE TABLE public.partner_b2b_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Price configuration
  markup_percent NUMERIC(5,3) NOT NULL, -- Ex: 0.4 = 0.4%
  markup_type TEXT DEFAULT 'percentage' CHECK (markup_type IN ('percentage', 'fixed')),
  
  -- Status and approval
  is_active BOOLEAN DEFAULT true,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  -- Metadata
  company_name TEXT,
  trading_volume_monthly NUMERIC,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_b2b_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_b2b_config
CREATE POLICY "Admins can view all B2B configs" 
  ON public.partner_b2b_config FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners can view own config" 
  ON public.partner_b2b_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert B2B configs" 
  ON public.partner_b2b_config FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update B2B configs" 
  ON public.partner_b2b_config FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete B2B configs" 
  ON public.partner_b2b_config FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add request_type to partner_requests
ALTER TABLE public.partner_requests 
ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'assessor' 
  CHECK (request_type IN ('assessor', 'b2b_otc'));

-- Add partner_type to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS partner_type TEXT DEFAULT 'retail'
  CHECK (partner_type IN ('retail', 'b2b'));

-- Create trigger for updated_at on partner_b2b_config
CREATE OR REPLACE FUNCTION update_partner_b2b_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_partner_b2b_config_timestamp
BEFORE UPDATE ON public.partner_b2b_config
FOR EACH ROW
EXECUTE FUNCTION update_partner_b2b_config_updated_at();