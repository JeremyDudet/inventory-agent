# Supabase CLI Setup and Migration Files

This document summarizes the process of setting up the Supabase CLI and generating migration files for the Inventory Agent project.

## Installation and Verification

The Supabase CLI was installed using Homebrew:

```bash
brew install supabase/tap/supabase
```

After installation, the CLI version was verified:

```bash
supabase --version
# Output: 2.20.12
```

## Project Linking

The project was linked to the Supabase project using:

```bash
supabase link --project-ref njvhpbcynkcyabygopzt
```

This requires a Supabase access token, which is different from the service role key. The access token can be obtained from the Supabase dashboard.

## Migration Files

Migration files were created to reflect the current database schema:

1. `infra/supabase/migrations/20240303_auth_setup.sql` - Original authentication setup
2. `infra/supabase/migrations/latest/20250409001417_initial_schema.sql` - Complete schema based on current database

The migration files include:

- Table definitions for all tables in the database
- Row Level Security (RLS) policies
- Triggers and functions for user creation and timestamp updates

## Database Schema

The database schema includes the following tables:

### User Management Tables

- `profiles`: User profile information
- `user_roles`: Role-based permissions

### Inventory Tables

- `inventory_items`: Detailed inventory items with embeddings
- `items`: Inventory items with quantities
- `categories`: Item categories

### Tracking and Logging Tables

- `stock_updates`: History of inventory changes
- `session_logs`: Logs of user sessions and actions

## Documentation Updates

The README.md file in `infra/supabase/` was updated to include:

- Instructions for installing and using the Supabase CLI
- Detailed database schema information
- Troubleshooting tips for migrations

## Next Steps

To apply these migrations to a new environment:

1. Install the Supabase CLI
2. Link to the Supabase project
3. Run migrations with `supabase migration up`

For local development, you can also start a local Supabase instance with:

```bash
supabase start
```
