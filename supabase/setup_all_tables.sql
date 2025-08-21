-- Complete database setup for Reloading Calculator
-- Run this entire script in your Supabase SQL editor

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

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for components table
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
CREATE TRIGGER update_factory_ammo_updated_at BEFORE UPDATE ON factory_ammo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample components to get started (optional)
-- You can uncomment these if you want some sample data

/*
-- Sample Brass
INSERT INTO components (name, type, cost_per_unit, unit, manufacturer) VALUES
('308 Winchester Brass', 'brass', 0.50, 'piece', 'Lapua'),
('223 Remington Brass', 'brass', 0.30, 'piece', 'Federal'),
('9mm Luger Brass', 'brass', 0.15, 'piece', 'Starline');

-- Sample Powder
INSERT INTO components (name, type, cost_per_unit, unit, manufacturer) VALUES
('Varget', 'powder', 35.00, 'pound', 'Hodgdon'),
('H4350', 'powder', 38.00, 'pound', 'Hodgdon'),
('Titegroup', 'powder', 28.00, 'pound', 'Hodgdon');

-- Sample Primers
INSERT INTO components (name, type, cost_per_unit, unit, manufacturer) VALUES
('Large Rifle Primers', 'primer', 0.08, 'piece', 'CCI'),
('Small Rifle Primers', 'primer', 0.08, 'piece', 'Federal'),
('Small Pistol Primers', 'primer', 0.07, 'piece', 'Winchester');

-- Sample Bullets
INSERT INTO components (name, type, cost_per_unit, unit, manufacturer) VALUES
('168gr BTHP Match', 'bullet', 0.35, 'piece', 'Sierra'),
('175gr SMK', 'bullet', 0.38, 'piece', 'Sierra'),
('55gr FMJ', 'bullet', 0.12, 'piece', 'Hornady'),
('115gr FMJ', 'bullet', 0.15, 'piece', 'Berry''s');

-- Sample Factory Ammo
INSERT INTO factory_ammo (name, manufacturer, caliber, bullet_weight, cost_per_box, rounds_per_box) VALUES
('Match 308 Win 168gr', 'Federal', '.308 Winchester', 168, 35.99, 20),
('M80 Ball', 'Lake City', '.308 Winchester', 147, 18.99, 20),
('XM193', 'Federal', '.223 Remington', 55, 12.99, 20),
('Range 9mm 115gr', 'Blazer Brass', '9mm Luger', 115, 15.99, 50);
*/
