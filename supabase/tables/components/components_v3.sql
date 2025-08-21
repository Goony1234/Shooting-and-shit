-- Components table v3
-- Add caliber_id reference to standardize caliber associations

-- Add caliber_id column to components table
ALTER TABLE components 
ADD COLUMN IF NOT EXISTS caliber_id UUID REFERENCES calibers(id) ON DELETE SET NULL;

-- Add index for caliber_id
CREATE INDEX IF NOT EXISTS idx_components_caliber_id ON components(caliber_id);

-- Add comment to explain the field
COMMENT ON COLUMN components.caliber_id IS 'Reference to standardized caliber (optional - for caliber-specific components like brass and bullets)';
