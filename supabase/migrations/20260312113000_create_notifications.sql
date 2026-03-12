-- ── Notifications broadcast system ──────────────────────────────────────────

-- Table: notifications (admin-created broadcasts)
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'info'   -- 'info' | 'warning' | 'alert' | 'update'
                CHECK (type IN ('info', 'warning', 'alert', 'update')),
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Table: notification_reads (per-user read tracking)
CREATE TABLE IF NOT EXISTS public.notification_reads (
  notification_id  UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at          TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (notification_id, user_id)
);

-- RLS
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads  ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read notifications
CREATE POLICY "Users can read notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert/update/delete notifications
CREATE POLICY "Admins can manage notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Users can read their own reads
CREATE POLICY "Users read own reads"
  ON public.notification_reads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own reads
CREATE POLICY "Users insert own reads"
  ON public.notification_reads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
