-- Saved loads table v6
-- Add security constraints: limit notes to 300 characters

-- Update notes column to limit to 300 characters
ALTER TABLE saved_loads 
ALTER COLUMN notes TYPE VARCHAR(300);

-- Add check constraint to ensure notes don't exceed 300 characters
ALTER TABLE saved_loads 
ADD CONSTRAINT check_saved_loads_notes_length 
CHECK (LENGTH(notes) <= 300);

-- Note: This will prevent excessively long notes that could cause performance issues
-- and potential security vulnerabilities from oversized text input
