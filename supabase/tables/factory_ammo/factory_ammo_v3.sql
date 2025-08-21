-- Factory ammo table v3
-- Add user tracking for factory ammo

-- Add created_by column to track who added each factory ammo entry
ALTER TABLE factory_ammo 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for created_by
CREATE INDEX IF NOT EXISTS idx_factory_ammo_created_by ON factory_ammo(created_by);

-- Add comment to explain the field
COMMENT ON COLUMN factory_ammo.created_by IS 'User who created this factory ammo entry (for attribution)';
