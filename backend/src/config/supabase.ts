// backend/src/config/db.ts
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

// Supabase configuration validation
if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error(
    "SUPABASE_URL, SUPABASE_SERVICE_KEY, and SUPABASE_ANON_KEY must be set in .env"
  );
  process.exit(1);
}

console.log(
  `Initializing Supabase client with URL: ${supabaseUrl.substring(0, 20)}...`
);

// Initialize Supabase client with anon key for auth operations
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "x-application-name": "stockcount-backend",
    },
  },
});

// Initialize Supabase admin client with service key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "x-application-name": "stockcount-backend-admin",
    },
  },
});

// Test the connection
export async function initializeSupabase() {
  try {
    const { data, error } = await supabaseAdmin
      .from("inventory_items")
      .select("*");
    if (error) throw error;
    console.log("✅ Supabase connection successful");
  } catch (err) {
    console.error(
      "⚠️ Supabase connection test error:",
      JSON.stringify(err, null, 2)
    );
  }
}

// Initialize connection in development/production, but not in test environment
if (process.env.NODE_ENV !== "test") {
  initializeSupabase();
}

export { supabase, supabaseAdmin };
export default supabase;
