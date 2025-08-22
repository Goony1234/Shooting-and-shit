-- Factory ammo table v5
-- Add input length limits to prevent infinite text input security issues

-- Update varchar columns to have proper length limits
ALTER TABLE factory_ammo 
ALTER COLUMN name TYPE VARCHAR(255);

ALTER TABLE factory_ammo 
ALTER COLUMN manufacturer TYPE VARCHAR(255);

ALTER TABLE factory_ammo 
ALTER COLUMN vendor TYPE VARCHAR(255);

ALTER TABLE factory_ammo 
ALTER COLUMN caliber TYPE VARCHAR(100);

-- Add check constraints to ensure field lengths are enforced
ALTER TABLE factory_ammo 
ADD CONSTRAINT check_factory_ammo_name_length 
CHECK (LENGTH(name) <= 255);

ALTER TABLE factory_ammo 
ADD CONSTRAINT check_factory_ammo_manufacturer_length 
CHECK (LENGTH(manufacturer) <= 255);

ALTER TABLE factory_ammo 
ADD CONSTRAINT check_factory_ammo_vendor_length 
CHECK (vendor IS NULL OR LENGTH(vendor) <= 255);

ALTER TABLE factory_ammo 
ADD CONSTRAINT check_factory_ammo_caliber_length 
CHECK (LENGTH(caliber) <= 100);

-- Note: This prevents security issues from users inputting infinite text
-- Field limits: name(255), manufacturer(255), vendor(255), caliber(100)
