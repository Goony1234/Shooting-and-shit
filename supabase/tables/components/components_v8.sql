-- Components table v8
-- Add input length limits to prevent infinite text input security issues

-- Update varchar columns to have proper length limits
ALTER TABLE components 
ALTER COLUMN name TYPE VARCHAR(255);

ALTER TABLE components 
ALTER COLUMN manufacturer TYPE VARCHAR(255);

ALTER TABLE components 
ALTER COLUMN vendor TYPE VARCHAR(255);

ALTER TABLE components 
ALTER COLUMN unit TYPE VARCHAR(50);

ALTER TABLE components 
ALTER COLUMN bullet_type TYPE VARCHAR(100);

-- Add check constraints to ensure field lengths are enforced
ALTER TABLE components 
ADD CONSTRAINT check_components_name_length 
CHECK (LENGTH(name) <= 255);

ALTER TABLE components 
ADD CONSTRAINT check_components_manufacturer_length 
CHECK (manufacturer IS NULL OR LENGTH(manufacturer) <= 255);

ALTER TABLE components 
ADD CONSTRAINT check_components_vendor_length 
CHECK (vendor IS NULL OR LENGTH(vendor) <= 255);

ALTER TABLE components 
ADD CONSTRAINT check_components_unit_length 
CHECK (LENGTH(unit) <= 50);

ALTER TABLE components 
ADD CONSTRAINT check_components_bullet_type_length 
CHECK (bullet_type IS NULL OR LENGTH(bullet_type) <= 100);

-- Note: This prevents security issues from users inputting infinite text
-- Field limits: name(255), manufacturer(255), vendor(255), unit(50), bullet_type(100), notes(300)
