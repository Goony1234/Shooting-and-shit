-- Firearms table v1
-- Store user's firearms for load development

CREATE TABLE IF NOT EXISTS firearms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    caliber_id UUID REFERENCES calibers(id) ON DELETE RESTRICT,
    caliber VARCHAR(100) NOT NULL, -- Backup text field
    barrel_length DECIMAL(4,2), -- in inches
    barrel_twist_rate VARCHAR(50), -- e.g., "1:8", "1:10"
    action_type VARCHAR(50), -- bolt, semi-auto, lever, etc.
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_firearms_created_by ON firearms(created_by);
CREATE INDEX IF NOT EXISTS idx_firearms_caliber_id ON firearms(caliber_id);
CREATE INDEX IF NOT EXISTS idx_firearms_name ON firearms(name);

-- Enable RLS
ALTER TABLE firearms ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own firearms
CREATE POLICY "Users can view their own firearms" ON firearms
    FOR SELECT USING (auth.uid() = created_by);

-- Policy: Users can insert their own firearms
CREATE POLICY "Users can insert their own firearms" ON firearms
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy: Users can update their own firearms
CREATE POLICY "Users can update their own firearms" ON firearms
    FOR UPDATE USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Policy: Users can delete their own firearms
CREATE POLICY "Users can delete their own firearms" ON firearms
    FOR DELETE USING (auth.uid() = created_by);

-- Create updated_at trigger
CREATE TRIGGER update_firearms_updated_at BEFORE UPDATE ON firearms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE firearms 
ADD CONSTRAINT check_firearms_name_length 
CHECK (LENGTH(name) <= 255);

ALTER TABLE firearms 
ADD CONSTRAINT check_firearms_manufacturer_length 
CHECK (manufacturer IS NULL OR LENGTH(manufacturer) <= 255);

ALTER TABLE firearms 
ADD CONSTRAINT check_firearms_model_length 
CHECK (model IS NULL OR LENGTH(model) <= 255);

ALTER TABLE firearms 
ADD CONSTRAINT check_firearms_caliber_length 
CHECK (LENGTH(caliber) <= 100);

ALTER TABLE firearms 
ADD CONSTRAINT check_firearms_barrel_length 
CHECK (barrel_length IS NULL OR (barrel_length > 0 AND barrel_length <= 50));

COMMENT ON TABLE firearms IS 'User firearms for load development tracking';
COMMENT ON COLUMN firearms.barrel_twist_rate IS 'Rifling twist rate (e.g., 1:8, 1:10) - affects bullet stability';
COMMENT ON COLUMN firearms.barrel_length IS 'Barrel length in inches - affects velocity';
COMMENT ON COLUMN firearms.action_type IS 'Type of action: bolt, semi-auto, lever, pump, etc.';
