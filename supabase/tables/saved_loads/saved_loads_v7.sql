-- Saved loads table v7
-- Add input length limits to prevent infinite text input security issues

-- Update varchar columns to have proper length limits
ALTER TABLE saved_loads 
ALTER COLUMN name TYPE VARCHAR(255);

ALTER TABLE saved_loads 
ALTER COLUMN caliber TYPE VARCHAR(100);

-- Add check constraints to ensure field lengths are enforced
ALTER TABLE saved_loads 
ADD CONSTRAINT check_saved_loads_name_length 
CHECK (LENGTH(name) <= 255);

ALTER TABLE saved_loads 
ADD CONSTRAINT check_saved_loads_caliber_length 
CHECK (LENGTH(caliber) <= 100);

-- Note: This prevents security issues from users inputting infinite text
-- Field limits: name(255), caliber(100), notes(300 - already done in v6)
