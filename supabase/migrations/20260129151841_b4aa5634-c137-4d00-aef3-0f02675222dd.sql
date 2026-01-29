-- Create sequence for operational note numbers
CREATE SEQUENCE IF NOT EXISTS operational_notes_number_seq START 1;

-- Create operational_notes table
CREATE TABLE public.operational_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    note_number text UNIQUE NOT NULL DEFAULT (
        'TKB-NO-' || EXTRACT(year FROM now())::text || '-' || 
        lpad(nextval('operational_notes_number_seq')::text, 4, '0')
    ),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    operation_type text NOT NULL CHECK (operation_type IN ('brl_to_usdt', 'usdt_to_brl', 'usdt_to_usd_remessa')),
    deposited_amount numeric NOT NULL,
    purchased_amount numeric NOT NULL,
    currency_deposited text NOT NULL,
    currency_purchased text NOT NULL,
    operation_date date NOT NULL,
    bank_details jsonb,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason text,
    pdf_url text,
    verification_code text UNIQUE,
    reviewed_by uuid REFERENCES public.profiles(id),
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.operational_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own notes"
ON public.operational_notes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
ON public.operational_notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all notes"
ON public.operational_notes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all notes"
ON public.operational_notes
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_operational_notes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_operational_notes_updated_at
BEFORE UPDATE ON public.operational_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_operational_notes_updated_at();

-- Create index for faster queries
CREATE INDEX idx_operational_notes_user_id ON public.operational_notes(user_id);
CREATE INDEX idx_operational_notes_status ON public.operational_notes(status);