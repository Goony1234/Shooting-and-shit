-- Factory ammo table v4
-- Add vendor field to track where prices came from

-- Add vendor column to factory_ammo table
ALTER TABLE factory_ammo 
ADD COLUMN IF NOT EXISTS vendor VARCHAR(255);

-- Add index for vendor for performance
CREATE INDEX IF NOT EXISTS idx_factory_ammo_vendor ON factory_ammo(vendor);

-- Add comment to explain the field
COMMENT ON COLUMN factory_ammo.vendor IS 'Store or vendor where the ammunition price was sourced from (e.g., Midway USA, Brownells, Local Gun Shop)';

-- Note: Existing factory ammo entries will have vendor = NULL until updated
-- This is acceptable as they represent entries added before vendor tracking
