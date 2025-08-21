-- Complete database setup for Reloading Calculator v2
-- Run this entire script in your Supabase SQL editor

-- Components table v1 with v2 updates
-- This table stores individual reloading components (brass, powder, primer, bullet)

CREATE TABLE IF NOT EXISTS components (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('brass', 'powder', 'primer', 'bullet')),
    cost_per_unit DECIMAL(10, 4) NOT NULL CHECK (cost_per_unit >= 0),
    unit VARCHAR(50) NOT NULL, -- e.g., 'piece', 'grain', 'pound', 'ounce'
    manufacturer VARCHAR(255),
    notes TEXT,
    -- v2 additions for bulk pricing
    box_price DECIMAL(10, 2),
    quantity_per_box INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments to explain the fields
COMMENT ON COLUMN components.box_price IS 'The price paid for a box/package of this component';
COMMENT ON COLUMN components.quantity_per_box IS 'The number of units in the box/package';
COMMENT ON COLUMN components.cost_per_unit IS 'The calculated or entered cost per individual unit';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_components_type ON components(type);
CREATE INDEX IF NOT EXISTS idx_components_name ON components(name);
CREATE INDEX IF NOT EXISTS idx_components_manufacturer ON components(manufacturer);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for components table
DROP TRIGGER IF EXISTS update_components_updated_at ON components;
CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON components
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Create trigger for saved_loads table
DROP TRIGGER IF EXISTS update_saved_loads_updated_at ON saved_loads;
CREATE TRIGGER update_saved_loads_updated_at BEFORE UPDATE ON saved_loads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Create trigger for factory_ammo table
DROP TRIGGER IF EXISTS update_factory_ammo_updated_at ON factory_ammo;
CREATE TRIGGER update_factory_ammo_updated_at BEFORE UPDATE ON factory_ammo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample components with box pricing to get started (optional)
-- You can uncomment these if you want some sample data

/*
-- Sample Brass (with box pricing)
INSERT INTO components (name, type, cost_per_unit, unit, manufacturer, box_price, quantity_per_box) VALUES
('308 Winchester Brass', 'brass', 0.50, 'piece', 'Lapua', 100.00, 200),
('223 Remington Brass', 'brass', 0.30, 'piece', 'Federal', 45.00, 150),
('9mm Luger Brass', 'brass', 0.15, 'piece', 'Starline', 30.00, 200);

-- Sample Powder (sold by the pound)
INSERT INTO components (name, type, cost_per_unit, unit, manufacturer, box_price, quantity_per_box, notes) VALUES
('Varget', 'powder', 0.005, 'grain', 'Hodgdon', 35.00, 7000, '1 pound = 7000 grains'),
('H4350', 'powder', 0.0054, 'grain', 'Hodgdon', 38.00, 7000, '1 pound = 7000 grains'),
('Titegroup', 'powder', 0.004, 'grain', 'Hodgdon', 28.00, 7000, '1 pound = 7000 grains');

-- Sample Primers (with box pricing)
INSERT INTO components (name, type, cost_per_unit, unit, manufacturer, box_price, quantity_per_box) VALUES
('Large Rifle Primers', 'primer', 0.08, 'piece', 'CCI', 79.99, 1000),
('Small Rifle Primers', 'primer', 0.075, 'piece', 'Federal', 74.99, 1000),
('Small Pistol Primers', 'primer', 0.065, 'piece', 'Winchester', 64.99, 1000);

-- Sample Bullets (with box pricing)
INSERT INTO components (name, type, cost_per_unit, unit, manufacturer, box_price, quantity_per_box) VALUES
('168gr BTHP Match', 'bullet', 0.35, 'piece', 'Sierra', 175.00, 500),
('175gr SMK', 'bullet', 0.38, 'piece', 'Sierra', 95.00, 250),
('55gr FMJ', 'bullet', 0.12, 'piece', 'Hornady', 119.99, 1000),
('115gr FMJ', 'bullet', 0.15, 'piece', 'Berry''s', 74.99, 500);

-- Sample Factory Ammo
INSERT INTO factory_ammo (name, manufacturer, caliber, bullet_weight, cost_per_box, rounds_per_box) VALUES
('Match 308 Win 168gr', 'Federal', '.308 Winchester', 168, 35.99, 20),
('M80 Ball', 'Lake City', '.308 Winchester', 147, 18.99, 20),
('XM193', 'Federal', '.223 Remington', 55, 12.99, 20),
('Range 9mm 115gr', 'Blazer Brass', '9mm Luger', 115, 15.99, 50);
*/
