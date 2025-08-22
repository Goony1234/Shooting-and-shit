-- User Settings Table v1
-- Stores user preferences and settings

CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sales_tax_enabled BOOLEAN DEFAULT false NOT NULL,
  sales_tax_rate DECIMAL(5,4) DEFAULT 0.0000 NOT NULL, -- Supports rates like 8.25% (stored as 0.0825)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure one settings record per user
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view and modify their own settings
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON user_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row changes
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- Insert some example data (optional - remove in production)
-- This would typically be handled by the application when a user first accesses settings
/*
INSERT INTO user_settings (user_id, sales_tax_enabled, sales_tax_rate) 
VALUES 
  ('example-user-id-1', false, 0.0000),
  ('example-user-id-2', true, 0.0825); -- 8.25% tax rate
*/
