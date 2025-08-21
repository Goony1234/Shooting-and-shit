-- Components table v6
-- Add bullet-specific fields: bullet_type and bullet_grain

-- Add bullet_type column for bullet components
ALTER TABLE components 
ADD COLUMN IF NOT EXISTS bullet_type VARCHAR(100);

-- Add bullet_grain column for bullet weight
ALTER TABLE components 
ADD COLUMN IF NOT EXISTS bullet_grain INTEGER;

-- Add indexes for bullet fields
CREATE INDEX IF NOT EXISTS idx_components_bullet_type ON components(bullet_type);
CREATE INDEX IF NOT EXISTS idx_components_bullet_grain ON components(bullet_grain);

-- Add comments to explain the fields
COMMENT ON COLUMN components.bullet_type IS 'Type of bullet (e.g., FMJ, Hollow Point, Match King, Boat Tail) - only used for bullet components';
COMMENT ON COLUMN components.bullet_grain IS 'Weight of bullet in grains - only used for bullet components';

-- Note: These fields are only relevant for components where type = 'bullet'
-- Other component types will have these fields as NULL
