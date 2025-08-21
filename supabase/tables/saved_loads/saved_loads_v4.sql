-- Saved loads table v4
-- Add created_by column for user ownership tracking

-- Add created_by column to saved_loads table
ALTER TABLE saved_loads 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add index for created_by for performance
CREATE INDEX IF NOT EXISTS idx_saved_loads_created_by ON saved_loads(created_by);

-- Add comment to explain the field
COMMENT ON COLUMN saved_loads.created_by IS 'User who created this saved load';

-- Note: Existing saved_loads without created_by will have NULL values
-- This is acceptable as they represent loads created before user tracking was implemented