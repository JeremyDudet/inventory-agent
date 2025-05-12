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

// Initialize custom fetch function with IPv4 preference
// We need to match the exact type signature expected by Supabase
const customFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  // Log the connection attempt to debug
  const url = typeof input === "string" ? input : input.toString();
  console.log(`Connecting to Supabase at: ${url}`);
  
  return fetch(input, init);
};

// Initialize Supabase client with anon key for auth operations
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      "x-application-name": "stockcount-backend",
    },
    fetch: customFetch,
  },
});

// Initialize Supabase admin client with service key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      "x-application-name": "stockcount-backend-admin",
    },
    fetch: customFetch,
  },
});

// Test the connection
export async function initializeSupabase() {
  try {
    // Simple ping query to test connection
    const { data, error } = await supabaseAdmin
      .from("inventory_items")
      .select("count(*)")
      .limit(1);
    
    if (error) throw error;
    console.log("✅ Supabase connection successful");
    return true;
  } catch (err) {
    console.error("⚠️ Supabase connection test error:", err);
    // Log more details for debugging
    if (err instanceof Error) {
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
      });
    }
    return false;
  }
}

// Initialize connection in development/production, but not in test environment
if (process.env.NODE_ENV !== "test") {
  initializeSupabase();
}

export { supabase, supabaseAdmin };
export default supabase;