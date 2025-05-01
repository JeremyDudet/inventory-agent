# Supabase Configuration and Migrations

This directory contains the Supabase configuration and migration files for the Inventory Agent project.

## Setup

The Supabase CLI has been installed and configured for this project. The CLI allows you to:

- Run migrations
- Start a local Supabase instance
- Link to a remote Supabase project

## Migration Files

The migration files in the `migrations` directory represent the database schema:

- `20250409001417_initial_schema.sql`: Initial schema migration that creates all tables and functions based on the current database structure.

## Database Schema

The database schema includes the following tables:

1. **profiles**: User profile information
2. **user_roles**: Role-based permissions
3. **items**: Inventory items with quantities
4. **categories**: Item categories
5. **inventory_items**: Detailed inventory items with embeddings
6. **stock_updates**: History of inventory changes
7. **session_logs**: Logs of user sessions and actions

## Using Supabase CLI

### Check Installation

```bash
supabase --version
```

### Initialize a Project

```bash
supabase init
```

### Start Local Development

```bash
supabase start
```

### Run Migrations

```bash
supabase migration up
```

### Link to Remote Project

```bash
export SUPABASE_ACCESS_TOKEN=your_access_token
supabase link --project-ref your_project_ref
```

## Environment Variables

The following environment variables are required:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
```

For CLI operations that require authentication:

```
SUPABASE_ACCESS_TOKEN=your_access_token
```

Note: The access token is different from the service role key and can be obtained from the Supabase dashboard.
