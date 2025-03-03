-- Add session_logs table for tracking user session activity
CREATE TABLE IF NOT EXISTS session_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('transcript', 'action')),
  text TEXT NOT NULL,
  action TEXT,
  status TEXT CHECK (status IN ('success', 'error', 'pending', 'info')),
  is_final BOOLEAN,
  confidence FLOAT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT NOT NULL,
  user_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS session_logs_session_id_idx ON session_logs (session_id);
CREATE INDEX IF NOT EXISTS session_logs_user_id_idx ON session_logs (user_id);
CREATE INDEX IF NOT EXISTS session_logs_timestamp_idx ON session_logs (timestamp);
CREATE INDEX IF NOT EXISTS session_logs_type_idx ON session_logs (type);

-- Enable RLS
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view their own logs
CREATE POLICY "Users can view their own session logs"
  ON session_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    auth.jwt() ? 'user_role' AND 
    (auth.jwt()->>'user_role' = 'manager' OR 
     auth.jwt()->>'user_role' = 'owner')
  );

-- Allow staff and above to insert logs
CREATE POLICY "Allow authenticated users to insert logs"
  ON session_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);