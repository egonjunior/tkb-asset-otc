-- Convert user_stats to a standard view for real-time visibility
DROP TRIGGER IF EXISTS refresh_user_stats_trigger ON public.orders;
DROP FUNCTION IF EXISTS public.refresh_user_stats();
DROP MATERIALIZED VIEW IF EXISTS public.user_stats;

CREATE VIEW public.user_stats AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.document_type,
  p.document_number,
  p.created_at as registered_at,
  COUNT(o.id) FILTER (WHERE o.status = 'completed') as completed_orders,
  COUNT(o.id) FILTER (WHERE o.status = 'pending') as pending_orders,
  COUNT(o.id) FILTER (WHERE o.status = 'paid') as paid_orders,
  COALESCE(SUM(o.total) FILTER (WHERE o.status = 'completed'), 0) as total_volume,
  COALESCE(AVG(o.total) FILTER (WHERE o.status = 'completed'), 0) as avg_ticket,
  MAX(o.created_at) as last_order_date
FROM public.profiles p
LEFT JOIN public.orders o ON o.user_id = p.id
GROUP BY p.id, p.full_name, p.document_type, p.document_number, p.created_at;

-- Ensure admins can update profiles (for markup and status)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Admins can update all profiles'
    ) THEN
        CREATE POLICY "Admins can update all profiles"
        ON public.profiles FOR UPDATE
        TO authenticated
        USING (public.has_role(auth.uid(), 'admin'::app_role))
        WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
    END IF;
END
$$;
