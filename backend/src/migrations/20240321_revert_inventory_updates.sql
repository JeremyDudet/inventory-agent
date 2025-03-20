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
      unit,
      userId,
      userName
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
      NEW.unit,
      current_setting('app.current_user_id', true)::uuid,
      current_setting('app.current_user_name', true)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS log_inventory_change ON inventory_items;

-- Apply the inventory update logging trigger
CREATE TRIGGER log_inventory_change
AFTER UPDATE ON inventory_items
FOR EACH ROW
EXECUTE FUNCTION log_inventory_update();

-- Enable row level security
ALTER TABLE inventory_updates ENABLE ROW LEVEL SECURITY;

-- Create policies for inventory_updates
CREATE POLICY "Enable read access for authenticated users"
  ON inventory_updates
  FOR SELECT
  TO authenticated
  USING (true);

-- Enable realtime for inventory_updates table
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_updates; 