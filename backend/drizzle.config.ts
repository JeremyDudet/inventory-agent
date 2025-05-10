import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.SUPABASE_DB) {
  throw new Error("SUPABASE_DB environment variable is required");
}

const isDevelopment = process.env.NODE_ENV === "development";

export default defineConfig({
  dialect: "postgresql",
  out: "./drizzle/migrations",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.SUPABASE_DB,
  },
  migrations: {
    table: "migrations", // Custom migrations table name (optional)
    schema: "public", // Explicit schema
  },
  strict: true, // Enforce strict schema validation
  verbose: isDevelopment, // Log migration details for debugging
});
