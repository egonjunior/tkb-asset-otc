-- Add new columns to orders table
ALTER TABLE public.orders 
ADD COLUMN payment_confirmed_at timestamp with time zone,
ADD COLUMN transaction_hash text;

-- Create order timeline table
CREATE TABLE public.order_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('system', 'user', 'admin')),
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on order_timeline
ALTER TABLE public.order_timeline ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_timeline
CREATE POLICY "Users can view timeline of their own orders"
ON public.order_timeline
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_timeline.order_id
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all timelines"
ON public.order_timeline
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert timeline events"
ON public.order_timeline
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert timeline events"
ON public.order_timeline
FOR INSERT
WITH CHECK (actor_type = 'system');

-- Create index for better performance
CREATE INDEX idx_order_timeline_order_id ON public.order_timeline(order_id);
CREATE INDEX idx_order_timeline_created_at ON public.order_timeline(created_at DESC);

-- Enable realtime for order_timeline
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_timeline;