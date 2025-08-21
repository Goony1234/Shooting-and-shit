-- Components table v5
-- Add vendor field to track where prices came from

-- Add vendor column to components table
ALTER TABLE components 
ADD COLUMN IF NOT EXISTS vendor VARCHAR(255);

-- Add index for vendor for performance
CREATE INDEX IF NOT EXISTS idx_components_vendor ON components(vendor);

-- Add comment to explain the field
COMMENT ON COLUMN components.vendor IS 'Store or vendor where the component price was sourced from (e.g., Midway USA, Brownells, Local Gun Shop)';

-- Note: Existing components will have vendor = NULL until updated
-- This is acceptable as they represent components added before vendor tracking
