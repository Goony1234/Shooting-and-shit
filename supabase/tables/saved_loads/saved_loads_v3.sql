-- Saved loads table v3
-- Add caliber_id reference to standardize caliber selection

-- Add caliber_id column to saved_loads table
ALTER TABLE saved_loads 
ADD COLUMN IF NOT EXISTS caliber_id UUID REFERENCES calibers(id) ON DELETE RESTRICT;

-- Add index for caliber_id
CREATE INDEX IF NOT EXISTS idx_saved_loads_caliber_id ON saved_loads(caliber_id);

-- Add comment to explain the field
COMMENT ON COLUMN saved_loads.caliber_id IS 'Reference to standardized caliber';

-- Note: We keep the caliber text field for backward compatibility and custom calibers
-- The caliber_id will be the primary reference going forward
