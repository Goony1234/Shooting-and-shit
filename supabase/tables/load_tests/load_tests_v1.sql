-- Load tests table v1
-- Record individual load test results and shot data

CREATE TABLE IF NOT EXISTS load_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES load_development_sessions(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Test identification
    test_number INTEGER NOT NULL, -- Sequential test number within session
    test_name VARCHAR(255), -- Optional descriptive name
    
    -- Load specifications for this test
    powder_charge DECIMAL(6,3) NOT NULL, -- in grains (e.g., 42.5)
    bullet_seating_depth DECIMAL(6,4), -- COAL in inches (e.g., 2.8050)
    case_overall_length DECIMAL(6,4), -- COL in inches
    
    -- Performance results
    shot_count INTEGER DEFAULT 0,
    average_velocity DECIMAL(8,2), -- fps
    velocity_std_dev DECIMAL(8,2), -- standard deviation
    extreme_spread DECIMAL(8,2), -- ES (highest - lowest velocity)
    group_size DECIMAL(6,4), -- in inches
    group_size_moa DECIMAL(6,3), -- in MOA
    
    -- Individual shot velocities (JSON array)
    shot_velocities JSONB DEFAULT '[]', -- [2850, 2845, 2860, ...]
    
    -- Environmental conditions
    temperature DECIMAL(5,2), -- Fahrenheit
    humidity DECIMAL(5,2), -- percentage
    barometric_pressure DECIMAL(6,2), -- inHg
    wind_speed DECIMAL(4,1), -- mph
    wind_direction VARCHAR(10), -- N, NE, E, SE, S, SW, W, NW
    
    -- Range conditions
    distance_yards INTEGER, -- shooting distance
    target_type VARCHAR(100),
    
    -- Notes and observations
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_load_tests_session_id ON load_tests(session_id);
CREATE INDEX IF NOT EXISTS idx_load_tests_created_by ON load_tests(created_by);
CREATE INDEX IF NOT EXISTS idx_load_tests_test_number ON load_tests(session_id, test_number);
CREATE INDEX IF NOT EXISTS idx_load_tests_powder_charge ON load_tests(powder_charge);
CREATE INDEX IF NOT EXISTS idx_load_tests_created_at ON load_tests(created_at);

-- Enable RLS
ALTER TABLE load_tests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own load tests
CREATE POLICY "Users can view their own load tests" ON load_tests
    FOR SELECT USING (auth.uid() = created_by);

-- Policy: Users can insert their own load tests
CREATE POLICY "Users can insert their own load tests" ON load_tests
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy: Users can update their own load tests
CREATE POLICY "Users can update their own load tests" ON load_tests
    FOR UPDATE USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Policy: Users can delete their own load tests
CREATE POLICY "Users can delete their own load tests" ON load_tests
    FOR DELETE USING (auth.uid() = created_by);

-- Create updated_at trigger
CREATE TRIGGER update_load_tests_updated_at BEFORE UPDATE ON load_tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE load_tests 
ADD CONSTRAINT check_load_tests_test_name_length 
CHECK (test_name IS NULL OR LENGTH(test_name) <= 255);

ALTER TABLE load_tests 
ADD CONSTRAINT check_load_tests_powder_charge_positive 
CHECK (powder_charge > 0 AND powder_charge <= 200); -- reasonable range

ALTER TABLE load_tests 
ADD CONSTRAINT check_load_tests_shot_count_positive 
CHECK (shot_count >= 0 AND shot_count <= 100); -- reasonable range

ALTER TABLE load_tests 
ADD CONSTRAINT check_load_tests_group_size_positive 
CHECK (group_size IS NULL OR group_size >= 0);

ALTER TABLE load_tests 
ADD CONSTRAINT check_load_tests_distance_positive 
CHECK (distance_yards IS NULL OR (distance_yards > 0 AND distance_yards <= 2000));

-- Unique constraint for test numbers within a session
ALTER TABLE load_tests 
ADD CONSTRAINT unique_session_test_number 
UNIQUE (session_id, test_number);

COMMENT ON TABLE load_tests IS 'Individual load test results with performance data and environmental conditions';
COMMENT ON COLUMN load_tests.powder_charge IS 'Powder charge weight in grains';
COMMENT ON COLUMN load_tests.bullet_seating_depth IS 'Cartridge Overall Length (COAL) in inches';
COMMENT ON COLUMN load_tests.case_overall_length IS 'Case Overall Length (COL) in inches';
COMMENT ON COLUMN load_tests.shot_velocities IS 'Array of individual shot velocities in fps';
COMMENT ON COLUMN load_tests.extreme_spread IS 'Difference between highest and lowest velocity';
COMMENT ON COLUMN load_tests.group_size_moa IS 'Group size converted to Minutes of Angle';
