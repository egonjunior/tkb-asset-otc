-- Create user_quotes table for manual price locks
CREATE TABLE IF NOT EXISTS public.user_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    manual_price NUMERIC(20, 8) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.user_quotes ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Admins can manage all quotes" ON public.user_quotes;
CREATE POLICY "Admins can manage all quotes"
ON public.user_quotes FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view their own active quotes" ON public.user_quotes;
CREATE POLICY "Users can view their own active quotes"
ON public.user_quotes FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id AND 
    expires_at > NOW()
);

-- Index for performance on the price service
CREATE INDEX IF NOT EXISTS idx_user_quotes_active ON public.user_quotes(user_id, expires_at);
