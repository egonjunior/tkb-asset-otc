-- Enable standard users to see their own requests
CREATE POLICY "Users can view their own partner requests"
ON public.partner_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
