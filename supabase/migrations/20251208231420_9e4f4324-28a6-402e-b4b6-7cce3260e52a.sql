-- Allow users to insert timeline events for their own orders
CREATE POLICY "Users can insert timeline events for their own orders"
ON public.order_timeline
FOR INSERT
WITH CHECK (
  actor_type = 'user' AND
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_timeline.order_id 
    AND orders.user_id = auth.uid()
  )
);