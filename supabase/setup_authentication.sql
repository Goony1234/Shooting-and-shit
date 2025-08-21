-- Authentication setup for Reloading Calculator
-- Run this script after setting up the main tables

-- Enable Row Level Security on saved_loads table
ALTER TABLE saved_loads ENABLE ROW LEVEL SECURITY;

-- Add user_id column to saved_loads (if not already added)
ALTER TABLE saved_loads 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add created_by columns to components and factory_ammo (if not already added)
ALTER TABLE components 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE factory_ammo 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_loads_user_id ON saved_loads(user_id);
CREATE INDEX IF NOT EXISTS idx_components_created_by ON components(created_by);
CREATE INDEX IF NOT EXISTS idx_factory_ammo_created_by ON factory_ammo(created_by);

-- Add comments
COMMENT ON COLUMN saved_loads.user_id IS 'User who owns this saved load (for privacy and data isolation)';
COMMENT ON COLUMN components.created_by IS 'User who created this component (for attribution and filtering)';
COMMENT ON COLUMN factory_ammo.created_by IS 'User who created this factory ammo entry (for attribution)';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own saved loads" ON saved_loads;
DROP POLICY IF EXISTS "Users can insert own saved loads" ON saved_loads;
DROP POLICY IF EXISTS "Users can update own saved loads" ON saved_loads;
DROP POLICY IF EXISTS "Users can delete own saved loads" ON saved_loads;

-- Create RLS policies for saved_loads
CREATE POLICY "Users can view own saved loads" ON saved_loads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved loads" ON saved_loads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved loads" ON saved_loads
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved loads" ON saved_loads
    FOR DELETE USING (auth.uid() = user_id);

-- Components table policies (public read, authenticated users can add)
ALTER TABLE components ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view components" ON components;
DROP POLICY IF EXISTS "Authenticated users can insert components" ON components;
DROP POLICY IF EXISTS "Users can update own components" ON components;
DROP POLICY IF EXISTS "Users can delete own components" ON components;

CREATE POLICY "Anyone can view components" ON components
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert components" ON components
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own components" ON components
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own components" ON components
    FOR DELETE USING (auth.uid() = created_by);

-- Factory ammo table policies (public read, authenticated users can add)
ALTER TABLE factory_ammo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view factory ammo" ON factory_ammo;
DROP POLICY IF EXISTS "Authenticated users can insert factory ammo" ON factory_ammo;
DROP POLICY IF EXISTS "Users can update own factory ammo" ON factory_ammo;
DROP POLICY IF EXISTS "Users can delete own factory ammo" ON factory_ammo;

CREATE POLICY "Anyone can view factory ammo" ON factory_ammo
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert factory ammo" ON factory_ammo
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own factory ammo" ON factory_ammo
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own factory ammo" ON factory_ammo
    FOR DELETE USING (auth.uid() = created_by);

-- Calibers table policies (public read-only)
ALTER TABLE calibers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view calibers" ON calibers;

CREATE POLICY "Anyone can view calibers" ON calibers
    FOR SELECT USING (true);
