import os
import csv
import urllib.request
import urllib.error
import json

SUPABASE_URL = "https://hxderdasvtleotmeuomg.supabase.co"
# The user's provided anon key from earlier interactions
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZGVyZGFzdnRsZW90bWV1b21nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDYzNTAsImV4cCI6MjA4NzgyMjM1MH0.CtlS3hOHn58nVMT7Pkp6hDgMyfuFXdvCaWNUQIrxs1Q"
# The Service Role Key is required to bypass RLS to insert arbitrary profiles/orders.
# Since we only have the ANON key, this import might fail due to RLS if we don't use the service key.
# We will notify the user to run this script with their service key if needed.

# We define the correct order to respect foreign key constraints:
# 1. profiles
# 2. leads
# 3. orders / otc_quote_clients
# 4. the rest
TABLE_IMPORT_ORDER = [
    "profiles",
    "user_roles",
    "user_stats",
    "leads",
    "offline_clients",
    "okx_client_wallets",
    "okx_recurring_clients",
    "okx_wallet_aliases",
    "orders",
    "order_receipts",
    "order_timeline",
    "offline_transactions",
    "operational_notes",
    "otc_quote_clients",
    "documents",
    "document_audit_log"
]

DOWNLOADS_DIR = os.path.expanduser("~/Downloads")

def find_file_for_table(table_name):
    # Search for files starting with the table name (e.g. profiles-export-...csv)
    for filename in os.listdir(DOWNLOADS_DIR):
        if filename.startswith(f"{table_name}-export-") and filename.endswith(".csv"):
            return os.path.join(DOWNLOADS_DIR, filename)
    return None

def import_csv_to_supabase(table_name, filepath, service_key):
    print(f"\\n--- Importing table: {table_name} ---")
    url = f"{SUPABASE_URL}/rest/v1/{table_name}"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter=';')
            rows = list(reader)
            
            if not rows:
                print(f"Skipping {table_name}: CSV is empty.")
                return

            # Clean empty strings that should be null
            for row in rows:
                for key, value in row.items():
                    if value == "":
                        row[key] = None

            # Bulk insert (chunks of 100 rows to avoid giant payloads)
            chunk_size = 100
            for i in range(0, len(rows), chunk_size):
                chunk = rows[i:i + chunk_size]
                req = urllib.request.Request(url, data=json.dumps(chunk).encode('utf-8'), headers=headers, method='POST')
                try:
                    with urllib.request.urlopen(req) as response:
                        print(f"Successfully inserted rows {i} to {i+len(chunk)} into {table_name}")
                except urllib.error.HTTPError as e:
                    error_body = e.read().decode('utf-8')
                    print(f"🚨 Failed to insert rows into {table_name}. Status: {e.code}, Error: {error_body}")
                    return # Stop on first error per table so we don't mess up dependencies
                    
    except Exception as e:
        print(f"Error reading file {filepath}: {e}")

if __name__ == "__main__":
    # We retrieve the service role key from the environment
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not service_key:
        print("ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required.")
        exit(1)

    print("Starting CSV Data Import to Supabase...")
    for table in TABLE_IMPORT_ORDER:
        file = find_file_for_table(table)
        if file:
            import_csv_to_supabase(table, file, service_key)
        else:
            print(f"Skipping {table}: No matching CSV export found in Downloads.")
    
    print("\\nImport process finished.")
