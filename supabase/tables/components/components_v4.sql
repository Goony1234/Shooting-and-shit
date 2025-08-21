-- Components table v4
-- Add user tracking for components

-- Add created_by column to track who added each component
ALTER TABLE components 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for created_by
CREATE INDEX IF NOT EXISTS idx_components_created_by ON components(created_by);

-- Add comment to explain the field
COMMENT ON COLUMN components.created_by IS 'User who created this component (for attribution and filtering)';
