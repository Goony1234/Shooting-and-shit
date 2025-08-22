-- User actions table v1
-- Track user actions for rate limiting and security monitoring

CREATE TABLE IF NOT EXISTS user_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id_created_at ON user_actions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_actions_action_type_created_at ON user_actions(action_type, created_at);
CREATE INDEX IF NOT EXISTS idx_user_actions_ip_created_at ON user_actions(ip_address, created_at);

-- Enable RLS
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own actions (admins could see all in future)
CREATE POLICY "Users can view their own actions" ON user_actions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: System can insert actions (we'll handle this in triggers)
CREATE POLICY "System can insert actions" ON user_actions
    FOR INSERT WITH CHECK (true);

-- Auto-cleanup old records (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_user_actions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_actions 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (you can set this up as a cron job in Supabase)
-- SELECT cron.schedule('cleanup-user-actions', '0 2 * * *', 'SELECT cleanup_old_user_actions();');

COMMENT ON TABLE user_actions IS 'Tracks user actions for rate limiting and security monitoring';
COMMENT ON COLUMN user_actions.action_type IS 'Type of action: component_create, load_create, login_attempt, etc.';
COMMENT ON COLUMN user_actions.metadata IS 'Additional data about the action (component type, error details, etc.)';
