-- Schema for Inventory Agent Database
-- This file contains SQL statements to set up the database schema for the Inventory Agent application

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create session_logs table for tracking voice interactions and system events
CREATE TABLE IF NOT EXISTS session_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('transcript', 'action')),
  text TEXT NOT NULL,
  is_final BOOLEAN,
  confidence NUMERIC,
  action TEXT,
  status TEXT CHECK (status IN ('success', 'error', 'pending', 'info')),
  session_id UUID NOT NULL,
  user_id UUID,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS session_logs_session_id_idx ON session_logs (session_id);
CREATE INDEX IF NOT EXISTS session_logs_user_id_idx ON session_logs (user_id);
CREATE INDEX IF NOT EXISTS session_logs_timestamp_idx ON session_logs (timestamp);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  category TEXT NOT NULL,
  threshold NUMERIC,
  lastUpdated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS inventory_items_name_idx ON inventory_items (name);

-- Create index on category for filtered queries
CREATE INDEX IF NOT EXISTS inventory_items_category_idx ON inventory_items (category);

-- Create role-based access control table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add description column if it doesn't exist (for backwards compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_roles' AND column_name = 'description'
  ) THEN
    ALTER TABLE user_roles ADD COLUMN description TEXT;
  END IF;
END $$;

-- Create inventory_updates table for tracking history
CREATE TABLE IF NOT EXISTS inventory_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itemId UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('add', 'remove', 'set', 'check')),
  previousQuantity NUMERIC NOT NULL,
  newQuantity NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  userId UUID,
  userName TEXT,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster history lookups by item
CREATE INDEX IF NOT EXISTS inventory_updates_item_idx ON inventory_updates (itemId);

-- Create trigger to automatically update the updatedAt timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to tables
CREATE TRIGGER inventory_items_updated
BEFORE UPDATE ON inventory_items
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER user_roles_updated
BEFORE UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Create trigger to log inventory updates
CREATE OR REPLACE FUNCTION log_inventory_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.quantity != NEW.quantity) THEN
    INSERT INTO inventory_updates (
      itemId, 
      action, 
      previousQuantity, 
      newQuantity, 
      quantity,
      unit
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.quantity > OLD.quantity THEN 'add'
        WHEN NEW.quantity < OLD.quantity THEN 'remove'
        ELSE 'set'
      END,
      OLD.quantity,
      NEW.quantity,
      ABS(NEW.quantity - OLD.quantity),
      NEW.unit
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the inventory update logging trigger
CREATE TRIGGER log_inventory_change
AFTER UPDATE ON inventory_items
FOR EACH ROW
EXECUTE FUNCTION log_inventory_update();

-- Insert or update default roles with permissions
-- Using ON CONFLICT DO UPDATE to ensure existing installations get updated permissions
INSERT INTO user_roles (name, permissions, description)
VALUES 
  ('owner', '{"inventory:read": true, "inventory:write": true, "inventory:delete": true, "user:read": true, "user:write": true}'::jsonb, 
   'Full system access with all permissions'),
  ('manager', '{"inventory:read": true, "inventory:write": true, "inventory:delete": false, "user:read": true, "user:write": false}'::jsonb,
   'Can manage inventory and view users but cannot modify user permissions'),
  ('staff', '{"inventory:read": true, "inventory:write": true, "inventory:delete": false, "user:read": false, "user:write": false}'::jsonb,
   'Can view and update inventory but cannot manage users'),
  ('readonly', '{"inventory:read": true, "inventory:write": false, "inventory:delete": false, "user:read": false, "user:write": false}'::jsonb,
   'Can only view inventory information')
ON CONFLICT (name) DO UPDATE 
SET permissions = EXCLUDED.permissions,
    description = EXCLUDED.description,
    updatedAt = NOW();

-- Insert some sample inventory items if needed for testing
INSERT INTO inventory_items (name, quantity, unit, category, threshold)
VALUES 
  ('Coffee Beans (Dark Roast)', 25, 'pounds', 'Beans', 10),
  ('Coffee Beans (Medium Roast)', 18, 'pounds', 'Beans', 10),
  ('Whole Milk', 12, 'gallons', 'Dairy', 5),
  ('Almond Milk', 8, 'gallons', 'Dairy', 3),
  ('Sugar', 30, 'pounds', 'Sweeteners', 10),
  ('Vanilla Syrup', 5, 'bottles', 'Syrups', 2),
  ('Caramel Syrup', 4, 'bottles', 'Syrups', 2),
  ('Chocolate Syrup', 3, 'bottles', 'Syrups', 2),
  ('Paper Cups (12oz)', 500, 'pieces', 'Supplies', 100),
  ('Paper Cups (16oz)', 350, 'pieces', 'Supplies', 100)
ON CONFLICT (name) DO NOTHING;

-- Use Supabase Row Level Security to control access
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;

-- Create policies to control access based on roles from Supabase Auth

-- Read access to inventory for all authenticated users
CREATE POLICY "Allow read access to inventory for authenticated users"
  ON inventory_items
  FOR SELECT
  TO authenticated
  USING (true);

-- Write access to inventory for staff and above
CREATE POLICY "Allow write access to inventory for staff and above"
  ON inventory_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ? 'user_metadata' AND
    auth.jwt()->'user_metadata' ? 'role' AND
    (
      auth.jwt()->'user_metadata'->>'role' = 'staff' OR
      auth.jwt()->'user_metadata'->>'role' = 'manager' OR
      auth.jwt()->'user_metadata'->>'role' = 'owner'
    )
  );

-- Update access to inventory for staff and above
CREATE POLICY "Allow update access to inventory for staff and above"
  ON inventory_items
  FOR UPDATE
  USING (
    auth.jwt() ? 'user_metadata' AND
    auth.jwt()->'user_metadata' ? 'role' AND
    (
      auth.jwt()->'user_metadata'->>'role' = 'staff' OR
      auth.jwt()->'user_metadata'->>'role' = 'manager' OR
      auth.jwt()->'user_metadata'->>'role' = 'owner'
    )
  );

-- Delete access to inventory for managers and owners only
CREATE POLICY "Allow delete access to inventory for managers and owners"
  ON inventory_items
  FOR DELETE
  USING (
    auth.jwt() ? 'user_metadata' AND
    auth.jwt()->'user_metadata' ? 'role' AND
    (
      auth.jwt()->'user_metadata'->>'role' = 'manager' OR
      auth.jwt()->'user_metadata'->>'role' = 'owner'
    )
  );

-- Read access to update history for all authenticated users
CREATE POLICY "Allow all users to view updates history"
  ON inventory_updates
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert access to update history for staff and above
CREATE POLICY "Allow staff and above to insert updates"
  ON inventory_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ? 'user_metadata' AND
    auth.jwt()->'user_metadata' ? 'role' AND
    (
      auth.jwt()->'user_metadata'->>'role' = 'staff' OR
      auth.jwt()->'user_metadata'->>'role' = 'manager' OR
      auth.jwt()->'user_metadata'->>'role' = 'owner'
    )
  );

-- Session logs policies

-- Allow all authenticated users to read session logs
CREATE POLICY "Allow authenticated users to read session logs"
  ON session_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow all users to insert session logs
CREATE POLICY "Allow insert access to session logs for all users"
  ON session_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to check user permissions by role
CREATE OR REPLACE FUNCTION check_user_permission(
  required_permission TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  permissions JSONB;
BEGIN
  -- Get the user's role from metadata
  user_role := auth.jwt()->'user_metadata'->>'role';
  
  -- Get permissions for the role
  SELECT user_roles.permissions INTO permissions
  FROM user_roles
  WHERE user_roles.name = user_role;
  
  -- Check if the user has the required permission
  RETURN permissions->required_permission = 'true';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create invite_codes table for employee onboarding
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  created_by UUID,
  used_by UUID,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for invite code lookups
CREATE INDEX IF NOT EXISTS invite_codes_code_idx ON invite_codes (code);
CREATE INDEX IF NOT EXISTS invite_codes_used_idx ON invite_codes (used_by) WHERE used_by IS NULL;

-- Enable Row Level Security for invite_codes
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Policy for creating invite codes (only managers and owners)
CREATE POLICY "Only managers and owners can create invite codes"
  ON invite_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ? 'user_metadata' AND
    auth.jwt()->'user_metadata' ? 'role' AND
    (
      auth.jwt()->'user_metadata'->>'role' = 'manager' OR
      auth.jwt()->'user_metadata'->>'role' = 'owner'
    )
  );

-- Policy for viewing invite codes (only managers and owners)
CREATE POLICY "Only managers and owners can view invite codes"
  ON invite_codes
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ? 'user_metadata' AND
    auth.jwt()->'user_metadata' ? 'role' AND
    (
      auth.jwt()->'user_metadata'->>'role' = 'manager' OR
      auth.jwt()->'user_metadata'->>'role' = 'owner'
    )
  );

-- Function to generate a random invite code
CREATE OR REPLACE FUNCTION generate_invite_code(length INTEGER DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
  pos INTEGER := 0;
BEGIN
  FOR i IN 1..length LOOP
    pos := 1 + FLOOR(RANDOM() * LENGTH(chars))::INTEGER;
    result := result || SUBSTRING(chars FROM pos FOR 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;