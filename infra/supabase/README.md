# Supabase Setup and Configuration

This document provides instructions for setting up and using Supabase in the Inventory Agent application.

## Overview

Inventory Agent uses Supabase for:
- Authentication and user management
- Database storage for inventory items
- Row-level security for data access
- Real-time updates

The system includes:
- Email/password authentication
- User profiles with roles
- Password reset functionality
- Row-level security for data access

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up or log in
2. Create a new project
3. Note your project URL and anon key (public API key)

### 2. Configure Environment Variables

Add the following environment variables to your project:

**Frontend (.env file):**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Backend (.env file):**
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
```

### 3. Install Supabase CLI

The Supabase CLI is required for migrations and local development:

```bash
# Install with Homebrew
brew install supabase/tap/supabase

# Verify installation
supabase --version
```

### 4. Run Migrations

The migration files in the `migrations` directory create the necessary database structure:

1. Navigate to the Supabase dashboard for your project
2. Go to the SQL Editor
3. Copy the contents of migration files from `infra/supabase/migrations/`
4. Paste into the SQL Editor and run the query

Alternatively, if you're using the Supabase CLI:

```bash
# Link to your Supabase project (requires access token)
supabase link --project-ref your_project_ref

# Run migrations
supabase migration up
```

## Authentication Features

### User Registration

Users can register with email and password. Upon registration:
- A verification email is sent to the user
- A profile record is automatically created with default role 'staff'

### User Roles

The system supports the following roles:
- `owner`: Full access to all features
- `manager`: Access to inventory management and limited user management
- `staff`: Access to inventory management only
- `read-only`: View-only access to inventory

### Authentication Flow

1. User signs up or logs in via the Login page
2. Upon successful authentication, the user is redirected to the Dashboard
3. The AuthContext maintains the user's session throughout the application
4. Protected routes check for authentication before allowing access

## Database Schema

The database schema includes the following tables:

### User Management Tables

#### profiles
- `id`: UUID (Primary Key, references auth.users)
- `name`: TEXT (User's display name)
- `email`: TEXT
- `image`: TEXT
- `has_access`: BOOLEAN
- `customer_id`: TEXT
- `price_id`: TEXT
- `created_at`: TIMESTAMP WITH TIME ZONE
- `updated_at`: TIMESTAMP WITH TIME ZONE

#### user_roles
- `id`: UUID (Primary Key)
- `name`: TEXT
- `permissions`: JSONB
- `createdat`: TIMESTAMP WITH TIME ZONE
- `updatedat`: TIMESTAMP WITH TIME ZONE

### Inventory Tables

#### inventory_items
- `id`: UUID (Primary Key)
- `name`: TEXT
- `description`: TEXT
- `quantity`: NUMERIC
- `threshold`: NUMERIC
- `unit`: TEXT
- `category`: TEXT
- `embedding`: VECTOR
- `createdat`: TIMESTAMP WITH TIME ZONE
- `updatedat`: TIMESTAMP WITH TIME ZONE
- `lastupdated`: TIMESTAMP WITH TIME ZONE

#### items
- `id`: BIGINT (Primary Key)
- `name`: TEXT
- `description`: TEXT
- `unit_of_measure`: TEXT
- `qty_on_hand`: REAL
- `par`: DOUBLE PRECISION
- `created_at`: TIMESTAMP WITH TIME ZONE
- `last_edited`: TIMESTAMP WITH TIME ZONE
- `last_edited_by`: UUID

#### categories
- `id`: UUID (Primary Key)
- `name`: TEXT

### Tracking and Logging Tables

#### inventory_updates
- `id`: UUID (Primary Key)
- `itemid`: UUID
- `action`: TEXT
- `quantity`: NUMERIC
- `previousquantity`: NUMERIC
- `newquantity`: NUMERIC
- `unit`: TEXT
- `userid`: UUID
- `username`: TEXT
- `createdat`: TIMESTAMP WITH TIME ZONE

#### session_logs
- `id`: UUID (Primary Key)
- `session_id`: TEXT
- `user_id`: UUID
- `type`: TEXT
- `text`: TEXT
- `action`: TEXT
- `status`: TEXT
- `is_final`: BOOLEAN
- `confidence`: DOUBLE PRECISION
- `timestamp`: TIMESTAMP WITH TIME ZONE
- `metadata`: JSONB

## Row-Level Security

Row-level security policies ensure users can only access appropriate data:
- Users can view and update their own profiles
- Admins (owners and managers) can view all profiles

## Automatic Profile Creation

A database trigger automatically creates a profile when a new user registers.

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Check that your environment variables are correctly set
2. **Missing Profile**: Ensure the database trigger is properly installed
3. **Permission Issues**: Verify that RLS policies are correctly configured
4. **Migration Issues**: If migrations fail, check the SQL syntax and ensure the Supabase CLI is properly configured

### Debugging

To debug issues:
1. Check browser console for errors
2. Verify network requests to Supabase endpoints
3. Check Supabase dashboard logs for authentication events
4. Use `supabase status` to check the status of your local Supabase instance    