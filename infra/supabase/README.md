# Supabase Authentication Setup

This document provides instructions for setting up and using the Supabase authentication system in the StockCount application.

## Overview

StockCount uses Supabase for authentication and user management. The system includes:

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

### 3. Run Migrations

The migration file `20240303_auth_setup.sql` creates the necessary database structure:

1. Navigate to the Supabase dashboard for your project
2. Go to the SQL Editor
3. Copy the contents of `infra/supabase/migrations/20240303_auth_setup.sql`
4. Paste into the SQL Editor and run the query

Alternatively, if you're using the Supabase CLI:

```bash
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

## Development Notes

### User Profile Management

The `profiles` table stores additional user information:
- `id`: UUID from auth.users
- `name`: User's display name
- `role`: User's role in the system
- `created_at` and `updated_at`: Timestamps

### Row-Level Security

Row-level security policies ensure users can only access appropriate data:
- Users can view and update their own profiles
- Admins (owners and managers) can view all profiles

### Automatic Profile Creation

A database trigger automatically creates a profile when a new user registers.

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Check that your environment variables are correctly set
2. **Missing Profile**: Ensure the database trigger is properly installed
3. **Permission Issues**: Verify that RLS policies are correctly configured

### Debugging

To debug authentication issues:
1. Check browser console for errors
2. Verify network requests to Supabase endpoints
3. Check Supabase dashboard logs for authentication events 