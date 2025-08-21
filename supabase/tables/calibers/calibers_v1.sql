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
