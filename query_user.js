import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

// RLS prevents general querying. So we explicitly sign in if they gave us credentials, or we look at the RLS policy of partner_requests.
// Wait, partner_requests might be "admin only" for read. Let's look at the database migrations.
