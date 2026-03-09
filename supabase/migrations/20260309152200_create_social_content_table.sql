-- Create social_content table
create table public.social_content (
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

-- Policies
create policy "Allow read access to all users" on public.social_content for select using (true);
create policy "Allow insert access to authenticated users" on public.social_content for insert with check (auth.role() = 'authenticated');
create policy "Allow update access to authenticated users" on public.social_content for update using (auth.role() = 'authenticated');
create policy "Allow delete access to authenticated users" on public.social_content for delete using (auth.role() = 'authenticated');

-- Subscriptions realtime
alter publication supabase_realtime add table public.social_content;
