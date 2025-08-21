-- Saved loads table v5
-- Add Row Level Security (RLS) policies for saved_loads table

-- Enable RLS on saved_loads table
ALTER TABLE saved_loads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own saved loads
CREATE POLICY "Users can insert their own saved loads" ON saved_loads
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy: Users can view only their own saved loads
CREATE POLICY "Users can view only their own saved loads" ON saved_loads
    FOR SELECT USING (auth.uid() = created_by);

-- Policy: Users can update their own saved loads
CREATE POLICY "Users can update their own saved loads" ON saved_loads
    FOR UPDATE USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Policy: Users can delete their own saved loads
CREATE POLICY "Users can delete their own saved loads" ON saved_loads
    FOR DELETE USING (auth.uid() = created_by);

-- Note: This allows users to:
-- 1. Create their own saved loads
-- 2. View ONLY their own saved loads (complete privacy)
-- 3. Update/delete only their own saved loads
-- 4. Legacy loads with created_by = NULL will not be visible to any user
