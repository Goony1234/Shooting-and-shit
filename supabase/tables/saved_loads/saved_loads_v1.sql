-- Saved loads table v1
-- This table stores complete bullet builds/loads with all components

CREATE TABLE IF NOT EXISTS saved_loads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    caliber VARCHAR(100) NOT NULL,
    brass_id UUID NOT NULL REFERENCES components(id) ON DELETE RESTRICT,
    powder_id UUID NOT NULL REFERENCES components(id) ON DELETE RESTRICT,
    powder_weight DECIMAL(8, 2) NOT NULL CHECK (powder_weight > 0), -- in grains
    primer_id UUID NOT NULL REFERENCES components(id) ON DELETE RESTRICT,
    bullet_id UUID NOT NULL REFERENCES components(id) ON DELETE RESTRICT,
    total_cost DECIMAL(10, 4) NOT NULL CHECK (total_cost >= 0),
    cost_per_round DECIMAL(10, 4) NOT NULL CHECK (cost_per_round >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_saved_loads_name ON saved_loads(name);
CREATE INDEX IF NOT EXISTS idx_saved_loads_caliber ON saved_loads(caliber);
CREATE INDEX IF NOT EXISTS idx_saved_loads_cost_per_round ON saved_loads(cost_per_round);

-- Create updated_at trigger
CREATE TRIGGER update_saved_loads_updated_at BEFORE UPDATE ON saved_loads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
