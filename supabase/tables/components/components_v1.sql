-- Components table v1
-- This table stores individual reloading components (brass, powder, primer, bullet)

CREATE TABLE IF NOT EXISTS components (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('brass', 'powder', 'primer', 'bullet')),
    cost_per_unit DECIMAL(10, 4) NOT NULL CHECK (cost_per_unit >= 0),
    unit VARCHAR(50) NOT NULL, -- e.g., 'piece', 'grain', 'pound', 'ounce'
    manufacturer VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_components_type ON components(type);
CREATE INDEX IF NOT EXISTS idx_components_name ON components(name);
CREATE INDEX IF NOT EXISTS idx_components_manufacturer ON components(manufacturer);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON components
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
