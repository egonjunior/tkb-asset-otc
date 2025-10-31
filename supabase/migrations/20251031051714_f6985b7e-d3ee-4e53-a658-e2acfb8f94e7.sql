-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Schedule the cancel-expired-orders function to run every minute
-- This will call the edge function automatically
SELECT cron.schedule(
  'cancel-expired-orders-job',
  '* * * * *', -- every minute
  $$
  SELECT
    net.http_post(
        url:='https://lvvzcjyapspbplisneze.supabase.co/functions/v1/cancel-expired-orders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dnpjanlhcHNwYnBsaXNuZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNTAxODIsImV4cCI6MjA3NjcyNjE4Mn0.z9qcVUigMpKoY68rXddHIp9PT_1KlYVjYLK-FdyjtMQ"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);