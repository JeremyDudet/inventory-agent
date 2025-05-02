// backend/src/config/db.ts
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";

// Supabase configuration validation
if (!supabaseUrl || !supabaseKey) {
  console.error(
    "SUPABASE_URL and SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY must be set in .env"
  );
  process.exit(1);
}

console.log(
  `Initializing Supabase client with URL: ${supabaseUrl.substring(0, 20)}...`
);

// Initialize Supabase client with service key for admin privileges in the backend
const supabase = createClient(supabaseUrl, supabaseKey, {
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

// Test the connection
export async function initializeSupabase() {
  try {
    const { data, error } = await supabase.from("inventory_items").select("*");
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

export default supabase;
