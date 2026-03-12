export SUPABASE_ACCESS_TOKEN="$1"
npx supabase migration up --db-url "$2"
