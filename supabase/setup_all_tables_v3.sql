-- Complete database setup for Reloading Calculator v3
-- Adds standardized calibers system
-- Run this entire script in your Supabase SQL editor

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Calibers table v1
-- This table stores standardized caliber information

CREATE TABLE IF NOT EXISTS calibers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g., "9mm Luger", ".308 Winchester"
    display_name VARCHAR(100) NOT NULL, -- e.g., "9mm Luger", ".308 Winchester" 
    short_name VARCHAR(20) NOT NULL, -- e.g., "9mm", ".308"
    bullet_diameter DECIMAL(6, 4), -- bullet diameter in inches (e.g., 0.3080 for .308)
    case_length DECIMAL(6, 4), -- case length in inches
    category VARCHAR(50) NOT NULL DEFAULT 'rifle' CHECK (category IN ('rifle', 'pistol', 'magnum')),
    common_bullet_weights TEXT, -- JSON array of common bullet weights in grains
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_calibers_name ON calibers(name);
CREATE INDEX IF NOT EXISTS idx_calibers_short_name ON calibers(short_name);
CREATE INDEX IF NOT EXISTS idx_calibers_category ON calibers(category);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_calibers_updated_at ON calibers;
CREATE TRIGGER update_calibers_updated_at BEFORE UPDATE ON calibers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Components table with caliber reference
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
    -- v3 addition for caliber reference
    caliber_id UUID REFERENCES calibers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments to explain the fields
COMMENT ON COLUMN components.box_price IS 'The price paid for a box/package of this component';
COMMENT ON COLUMN components.quantity_per_box IS 'The number of units in the box/package';
COMMENT ON COLUMN components.cost_per_unit IS 'The calculated or entered cost per individual unit';
COMMENT ON COLUMN components.caliber_id IS 'Reference to standardized caliber (optional - for caliber-specific components like brass and bullets)';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_components_type ON components(type);
CREATE INDEX IF NOT EXISTS idx_components_name ON components(name);
CREATE INDEX IF NOT EXISTS idx_components_manufacturer ON components(manufacturer);
CREATE INDEX IF NOT EXISTS idx_components_caliber_id ON components(caliber_id);

-- Create trigger for components table
DROP TRIGGER IF EXISTS update_components_updated_at ON components;
CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON components
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Saved loads table with caliber reference
CREATE TABLE IF NOT EXISTS saved_loads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    caliber VARCHAR(100) NOT NULL, -- kept for backward compatibility
    caliber_id UUID REFERENCES calibers(id) ON DELETE RESTRICT,
    brass_id UUID REFERENCES components(id) ON DELETE RESTRICT,
    powder_id UUID NOT NULL REFERENCES components(id) ON DELETE RESTRICT,
    powder_weight DECIMAL(8, 2) NOT NULL CHECK (powder_weight > 0), -- in grains
    primer_id UUID NOT NULL REFERENCES components(id) ON DELETE RESTRICT,
    bullet_id UUID NOT NULL REFERENCES components(id) ON DELETE RESTRICT,
    total_cost DECIMAL(10, 4) NOT NULL CHECK (total_cost >= 0),
    cost_per_round DECIMAL(10, 4) NOT NULL CHECK (cost_per_round >= 0),
    notes TEXT,
    -- v2 additions for brass reuse
    brass_reuse_option VARCHAR(20) DEFAULT 'new' CHECK (brass_reuse_option IN ('new', 'reuse', 'amortize')),
    brass_reuse_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON COLUMN saved_loads.brass_reuse_option IS 'How brass cost is calculated: new (full cost), reuse (no cost), amortize (cost divided by reuse count)';
COMMENT ON COLUMN saved_loads.brass_reuse_count IS 'Number of times brass is expected to be reused for amortization calculation';
COMMENT ON COLUMN saved_loads.caliber_id IS 'Reference to standardized caliber';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_saved_loads_name ON saved_loads(name);
CREATE INDEX IF NOT EXISTS idx_saved_loads_caliber ON saved_loads(caliber);
CREATE INDEX IF NOT EXISTS idx_saved_loads_caliber_id ON saved_loads(caliber_id);
CREATE INDEX IF NOT EXISTS idx_saved_loads_cost_per_round ON saved_loads(cost_per_round);

-- Create trigger for saved_loads table
DROP TRIGGER IF EXISTS update_saved_loads_updated_at ON saved_loads;
CREATE TRIGGER update_saved_loads_updated_at BEFORE UPDATE ON saved_loads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Factory ammo table with caliber reference
CREATE TABLE IF NOT EXISTS factory_ammo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255) NOT NULL,
    caliber VARCHAR(100) NOT NULL, -- kept for backward compatibility
    caliber_id UUID REFERENCES calibers(id) ON DELETE RESTRICT,
    bullet_weight INTEGER NOT NULL CHECK (bullet_weight > 0), -- in grains
    cost_per_box DECIMAL(10, 2) NOT NULL CHECK (cost_per_box > 0),
    rounds_per_box INTEGER NOT NULL CHECK (rounds_per_box > 0),
    cost_per_round DECIMAL(10, 4) GENERATED ALWAYS AS (cost_per_box / rounds_per_box) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment
COMMENT ON COLUMN factory_ammo.caliber_id IS 'Reference to standardized caliber';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_factory_ammo_caliber ON factory_ammo(caliber);
CREATE INDEX IF NOT EXISTS idx_factory_ammo_caliber_id ON factory_ammo(caliber_id);
CREATE INDEX IF NOT EXISTS idx_factory_ammo_manufacturer ON factory_ammo(manufacturer);
CREATE INDEX IF NOT EXISTS idx_factory_ammo_cost_per_round ON factory_ammo(cost_per_round);
CREATE INDEX IF NOT EXISTS idx_factory_ammo_bullet_weight ON factory_ammo(bullet_weight);

-- Create trigger for factory_ammo table
DROP TRIGGER IF EXISTS update_factory_ammo_updated_at ON factory_ammo;
CREATE TRIGGER update_factory_ammo_updated_at BEFORE UPDATE ON factory_ammo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert common calibers
INSERT INTO calibers (name, display_name, short_name, bullet_diameter, case_length, category, common_bullet_weights) VALUES
-- Pistol calibers
('9mm Luger', '9mm Luger', '9mm', 0.3550, 0.7540, 'pistol', '[115, 124, 147]'),
('.40 S&W', '.40 S&W', '.40', 0.4005, 0.8500, 'pistol', '[155, 165, 180]'),
('.45 ACP', '.45 ACP', '.45', 0.4515, 0.8980, 'pistol', '[185, 200, 230]'),
('.380 ACP', '.380 ACP', '.380', 0.3550, 0.6800, 'pistol', '[90, 95, 100]'),
('10mm Auto', '10mm Auto', '10mm', 0.4005, 0.9920, 'pistol', '[155, 180, 200]'),
('.357 Magnum', '.357 Magnum', '.357', 0.3570, 1.2900, 'magnum', '[125, 158, 180]'),

-- Rifle calibers
('.223 Remington', '.223 Remington', '.223', 0.2240, 1.7600, 'rifle', '[40, 55, 62, 69, 77]'),
('5.56x45mm NATO', '5.56x45mm NATO', '5.56', 0.2240, 1.7600, 'rifle', '[55, 62, 77]'),
('.308 Winchester', '.308 Winchester', '.308', 0.3080, 2.0150, 'rifle', '[150, 168, 175, 180]'),
('7.62x51mm NATO', '7.62x51mm NATO', '7.62', 0.3080, 2.0150, 'rifle', '[147, 175]'),
('6.5 Creedmoor', '6.5 Creedmoor', '6.5', 0.2640, 1.9200, 'rifle', '[120, 140, 143, 147]'),
('.30-06 Springfield', '.30-06 Springfield', '.30-06', 0.3080, 2.4940, 'rifle', '[150, 165, 180]'),
('.270 Winchester', '.270 Winchester', '.270', 0.2770, 2.5400, 'rifle', '[130, 140, 150]'),
('6.5 Grendel', '6.5 Grendel', '6.5 Grendel', 0.2640, 1.5200, 'rifle', '[123, 129, 147]'),

-- Magnum calibers
('.300 Winchester Magnum', '.300 Winchester Magnum', '.300 WM', 0.3080, 2.6200, 'magnum', '[150, 180, 200]'),
('.338 Lapua Magnum', '.338 Lapua Magnum', '.338', 0.3380, 2.7240, 'magnum', '[250, 285, 300]'),
('7mm Remington Magnum', '7mm Remington Magnum', '7mm RM', 0.2840, 2.5000, 'magnum', '[140, 160, 175]')

ON CONFLICT (name) DO NOTHING;
