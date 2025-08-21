-- Factory ammo table v2
-- Add caliber_id reference to standardize caliber selection

-- Add caliber_id column to factory_ammo table
ALTER TABLE factory_ammo 
ADD COLUMN IF NOT EXISTS caliber_id UUID REFERENCES calibers(id) ON DELETE RESTRICT;

-- Add index for caliber_id
CREATE INDEX IF NOT EXISTS idx_factory_ammo_caliber_id ON factory_ammo(caliber_id);

-- Add comment to explain the field
COMMENT ON COLUMN factory_ammo.caliber_id IS 'Reference to standardized caliber';

-- Note: We keep the caliber text field for backward compatibility and custom calibers
-- The caliber_id will be the primary reference going forward
