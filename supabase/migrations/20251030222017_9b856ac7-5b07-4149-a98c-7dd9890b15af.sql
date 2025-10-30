-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule cron job to cancel expired orders every minute
SELECT cron.schedule(
  'cancel-expired-orders',
  '* * * * *', -- every minute
  $$
  SELECT
    net.http_post(
        url:='https://lvvzcjyapspbplisneze.supabase.co/functions/v1/cancel-expired-orders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dnpjanlhcHNwYnBsaXNuZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNTAxODIsImV4cCI6MjA3NjcyNjE4Mn0.z9qcVUigMpKoY68rXddHIp9PT_1KlYVjYLK-FdyjtMQ"}'::jsonb
    ) as request_id;
  $$
);