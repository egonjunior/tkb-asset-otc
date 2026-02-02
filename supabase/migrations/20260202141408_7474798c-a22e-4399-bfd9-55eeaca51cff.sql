-- Create table for recurring clients
CREATE TABLE public.okx_recurring_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for client wallets (N:1 relationship)
CREATE TABLE public.okx_client_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.okx_recurring_clients(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  network text NOT NULL,
  label text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.okx_recurring_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.okx_client_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for okx_recurring_clients (admin only)
CREATE POLICY "Admins can view all recurring clients"
  ON public.okx_recurring_clients FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert recurring clients"
  ON public.okx_recurring_clients FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update recurring clients"
  ON public.okx_recurring_clients FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete recurring clients"
  ON public.okx_recurring_clients FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for okx_client_wallets (admin only)
CREATE POLICY "Admins can view all client wallets"
  ON public.okx_client_wallets FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert client wallets"
  ON public.okx_client_wallets FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update client wallets"
  ON public.okx_client_wallets FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete client wallets"
  ON public.okx_client_wallets FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_okx_recurring_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_okx_recurring_clients_updated_at
  BEFORE UPDATE ON public.okx_recurring_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_okx_recurring_clients_updated_at();

-- Create index for faster wallet lookups
CREATE INDEX idx_okx_client_wallets_client_id ON public.okx_client_wallets(client_id);
CREATE INDEX idx_okx_client_wallets_address ON public.okx_client_wallets(wallet_address);

-- Migrate existing aliases to recurring clients
INSERT INTO public.okx_recurring_clients (name, notes, created_at, updated_at)
SELECT alias, notes, created_at, updated_at
FROM public.okx_wallet_aliases;

-- Insert wallets for migrated clients
INSERT INTO public.okx_client_wallets (client_id, wallet_address, network, label)
SELECT 
  rc.id,
  owa.wallet_address,
  'UNKNOWN',
  'Principal'
FROM public.okx_wallet_aliases owa
JOIN public.okx_recurring_clients rc ON rc.name = owa.alias;