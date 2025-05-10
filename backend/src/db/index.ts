// backend/src/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

if (!process.env.SUPABASE_DB)
  throw new Error("SUPABASE_DB is required for database connection");

const client = postgres(process.env.SUPABASE_DB, {
  max: 1,
});

const db = drizzle(client);

export default db;
