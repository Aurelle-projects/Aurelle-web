import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Simple env parser
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  console.log("Checking database connection and columns...");
  
  const { data, error } = await supabase
    .from('products')
    .select('id, is_wholesale_available, wholesale_price, wholesale_unit_enabled, wholesale_unit_price, wholesale_box_enabled, wholesale_units_per_box, wholesale_box_price, wholesale_custom_quantity_enabled')
    .limit(1);

  if (error) {
    console.log("Error querying products:", error.message);
  } else {
    console.log("Products query result:", data);
  }

  const { data: cartData, error: cartError } = await supabase
    .from('cart_items')
    .select('id, purchase_mode, units_per_box')
    .limit(1);

  if (cartError) {
    console.log("Error querying cart_items:", cartError.message);
  } else {
    console.log("Cart items query result:", cartData);
  }
}

run();
