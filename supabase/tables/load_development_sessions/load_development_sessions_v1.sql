-- Load development sessions table v1
-- Track load development testing sessions

CREATE TABLE IF NOT EXISTS load_development_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    firearm_id UUID REFERENCES firearms(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Base load components (what we're testing variations of)
    bullet_id UUID REFERENCES components(id) ON DELETE RESTRICT,
    powder_id UUID REFERENCES components(id) ON DELETE RESTRICT,
    case_id UUID REFERENCES components(id) ON DELETE RESTRICT,
    primer_id UUID REFERENCES components(id) ON DELETE RESTRICT,
    
    -- Session goals and notes
    goal VARCHAR(500), -- What are we trying to achieve?
    testing_variable VARCHAR(100), -- What variable are we changing? (powder_charge, seating_depth, etc.)
    
    -- Session status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_load_dev_sessions_created_by ON load_development_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_load_dev_sessions_firearm_id ON load_development_sessions(firearm_id);
CREATE INDEX IF NOT EXISTS idx_load_dev_sessions_status ON load_development_sessions(status);
CREATE INDEX IF NOT EXISTS idx_load_dev_sessions_created_at ON load_development_sessions(created_at);

-- Enable RLS
ALTER TABLE load_development_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own sessions
CREATE POLICY "Users can view their own load dev sessions" ON load_development_sessions
    FOR SELECT USING (auth.uid() = created_by);

-- Policy: Users can insert their own sessions
CREATE POLICY "Users can insert their own load dev sessions" ON load_development_sessions
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy: Users can update their own sessions
CREATE POLICY "Users can update their own load dev sessions" ON load_development_sessions
    FOR UPDATE USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Policy: Users can delete their own sessions
CREATE POLICY "Users can delete their own load dev sessions" ON load_development_sessions
    FOR DELETE USING (auth.uid() = created_by);

-- Create updated_at trigger
CREATE TRIGGER update_load_dev_sessions_updated_at BEFORE UPDATE ON load_development_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE load_development_sessions 
ADD CONSTRAINT check_load_dev_sessions_name_length 
CHECK (LENGTH(name) <= 255);

ALTER TABLE load_development_sessions 
ADD CONSTRAINT check_load_dev_sessions_goal_length 
CHECK (goal IS NULL OR LENGTH(goal) <= 500);

ALTER TABLE load_development_sessions 
ADD CONSTRAINT check_load_dev_sessions_testing_variable_length 
CHECK (testing_variable IS NULL OR LENGTH(testing_variable) <= 100);

COMMENT ON TABLE load_development_sessions IS 'Load development testing sessions for systematic load optimization';
COMMENT ON COLUMN load_development_sessions.testing_variable IS 'Primary variable being tested: powder_charge, seating_depth, case_length, etc.';
COMMENT ON COLUMN load_development_sessions.goal IS 'Session objective: accuracy, velocity, consistency, etc.';
COMMENT ON COLUMN load_development_sessions.status IS 'Session status: active, completed, paused, archived';
