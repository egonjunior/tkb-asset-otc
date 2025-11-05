-- Add admin management columns to leads table
ALTER TABLE public.leads
ADD COLUMN admin_notes TEXT,
ADD COLUMN contacted_at TIMESTAMPTZ,
ADD COLUMN qualified_at TIMESTAMPTZ,
ADD COLUMN converted_at TIMESTAMPTZ,
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER update_leads_timestamp
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_leads_updated_at();

-- RLS: Admins can update leads
CREATE POLICY "Admins can update leads" ON public.leads
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
  );