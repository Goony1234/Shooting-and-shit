-- Components table v7
-- Add security constraints: limit notes to 300 characters and max 200 components per user

-- Update notes column to limit to 300 characters
ALTER TABLE components 
ALTER COLUMN notes TYPE VARCHAR(300);

-- Add check constraint to ensure notes don't exceed 300 characters
ALTER TABLE components 
ADD CONSTRAINT check_components_notes_length 
CHECK (LENGTH(notes) <= 300);

-- Create function to check component count per user
CREATE OR REPLACE FUNCTION check_user_component_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check on INSERT operations
    IF TG_OP = 'INSERT' THEN
        -- Check if user already has 200 components
        IF (SELECT COUNT(*) FROM components WHERE created_by = NEW.created_by) >= 200 THEN
            RAISE EXCEPTION 'User cannot create more than 200 components. Current limit reached.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce component limit per user
CREATE TRIGGER enforce_user_component_limit
    BEFORE INSERT ON components
    FOR EACH ROW
    EXECUTE FUNCTION check_user_component_limit();

-- Note: This limits each user to a maximum of 200 components to prevent abuse
-- and ensures notes fields don't exceed 300 characters for security
