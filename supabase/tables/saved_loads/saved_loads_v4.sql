-- Saved loads table v4
-- Add user ownership and Row Level Security

-- Add user_id column to saved_loads table
ALTER TABLE saved_loads 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add index for user_id
CREATE INDEX IF NOT EXISTS idx_saved_loads_user_id ON saved_loads(user_id);

-- Add comment to explain the field
COMMENT ON COLUMN saved_loads.user_id IS 'User who owns this saved load (for privacy and data isolation)';

-- Enable Row Level Security
ALTER TABLE saved_loads ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only see their own saved loads
CREATE POLICY "Users can view own saved loads" ON saved_loads
    FOR SELECT USING (auth.uid() = user_id);

-- Create RLS policy: Users can only insert their own saved loads
CREATE POLICY "Users can insert own saved loads" ON saved_loads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: Users can only update their own saved loads
CREATE POLICY "Users can update own saved loads" ON saved_loads
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policy: Users can only delete their own saved loads
CREATE POLICY "Users can delete own saved loads" ON saved_loads
    FOR DELETE USING (auth.uid() = user_id);
