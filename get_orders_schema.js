import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkSchema() {
    const { data: orders, error } = await supabase.from('orders').select('*').limit(1);
    if (!error && orders && orders.length > 0) {
        console.log("Columns in orders:", Object.keys(orders[0]));
    } else {
        console.error("Error or no orders:", error);
    }
}

checkSchema();
