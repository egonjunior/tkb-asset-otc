-- Add document acceptance tracking to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS documents_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS documents_version TEXT DEFAULT '2026-03';

COMMENT ON COLUMN public.profiles.documents_accepted_at IS 'When the user accepted the KYC/PLD documents';
COMMENT ON COLUMN public.profiles.documents_version IS 'Version of the documents accepted (date-based)';
