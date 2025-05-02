// backend/src/config/db.ts
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { getAllItems } from "../repositories/InventoryRepository";

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
    // Simple connection test
    const response = await supabase
      .from("session_logs")
      .select("count(*)", { count: "exact", head: true });

    if (response.error) {
      console.error(
        "⚠️ Supabase connection test failed:",
        response.error.message
      );
    } else {
      console.log("✅ Supabase connection successful, database is accessible");
    }
  } catch (err) {
    console.error("⚠️ Supabase connection test error:", err);
  }
}

// Initialize connection in development/production, but not in test environment
if (process.env.NODE_ENV !== "test") {
  initializeSupabase();
}

export default supabase;
