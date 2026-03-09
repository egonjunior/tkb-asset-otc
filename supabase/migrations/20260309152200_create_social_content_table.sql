-- Create social_content table
create table IF NOT EXISTS public.social_content (
  id uuid default gen_random_uuid() primary key,
  platform text not null check (platform in ('linkedin_post', 'linkedin_article', 'instagram_post', 'instagram_carousel', 'twitter_thread')),
  topic text not null,
  content_json jsonb not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'published')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS
alter table public.social_content enable row level security;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow read access to all users" ON public.social_content;
    DROP POLICY IF EXISTS "Allow insert access to authenticated users" ON public.social_content;
    DROP POLICY IF EXISTS "Allow update access to authenticated users" ON public.social_content;
    DROP POLICY IF EXISTS "Allow delete access to authenticated users" ON public.social_content;
END $$;

-- Policies
create policy "Allow read access to all users" on public.social_content for select using (true);
create policy "Allow insert access to authenticated users" on public.social_content for insert with check (auth.role() = 'authenticated');
create policy "Allow update access to authenticated users" on public.social_content for update using (auth.role() = 'authenticated');
create policy "Allow delete access to authenticated users" on public.social_content for delete using (auth.role() = 'authenticated');

-- Subscriptions realtime
DO $$ BEGIN
    alter publication supabase_realtime add table public.social_content;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
