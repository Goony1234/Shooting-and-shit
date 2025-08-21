-- Factory ammo table v1
-- This table stores factory ammunition data for comparison

CREATE TABLE IF NOT EXISTS factory_ammo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255) NOT NULL,
    caliber VARCHAR(100) NOT NULL,
    bullet_weight INTEGER NOT NULL CHECK (bullet_weight > 0), -- in grains
    cost_per_box DECIMAL(10, 2) NOT NULL CHECK (cost_per_box > 0),
    rounds_per_box INTEGER NOT NULL CHECK (rounds_per_box > 0),
    cost_per_round DECIMAL(10, 4) GENERATED ALWAYS AS (cost_per_box / rounds_per_box) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_factory_ammo_caliber ON factory_ammo(caliber);
CREATE INDEX IF NOT EXISTS idx_factory_ammo_manufacturer ON factory_ammo(manufacturer);
CREATE INDEX IF NOT EXISTS idx_factory_ammo_cost_per_round ON factory_ammo(cost_per_round);
CREATE INDEX IF NOT EXISTS idx_factory_ammo_bullet_weight ON factory_ammo(bullet_weight);

-- Create updated_at trigger
CREATE TRIGGER update_factory_ammo_updated_at BEFORE UPDATE ON factory_ammo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
