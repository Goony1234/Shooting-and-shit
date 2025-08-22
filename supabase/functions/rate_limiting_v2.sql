-- Rate limiting functions v2
-- Optimized database functions for checking and enforcing rate limits
-- This version reduces API calls by combining multiple queries

-- Function to check if user has exceeded rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_user_id UUID,
    p_action_type VARCHAR(50),
    p_max_actions INTEGER,
    p_time_window INTERVAL
)
RETURNS BOOLEAN AS $$
DECLARE
    action_count INTEGER;
BEGIN
    -- Count actions in the time window
    SELECT COUNT(*)
    INTO action_count
    FROM user_actions
    WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND created_at > NOW() - p_time_window;
    
    -- Return true if under limit, false if over limit
    RETURN action_count < p_max_actions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limit by IP (for anonymous users or additional protection)
CREATE OR REPLACE FUNCTION check_ip_rate_limit(
    p_ip_address INET,
    p_action_type VARCHAR(50),
    p_max_actions INTEGER,
    p_time_window INTERVAL
)
RETURNS BOOLEAN AS $$
DECLARE
    action_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO action_count
    FROM user_actions
    WHERE ip_address = p_ip_address
    AND action_type = p_action_type
    AND created_at > NOW() - p_time_window;
    
    RETURN action_count < p_max_actions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log an action and check rate limit in one go
CREATE OR REPLACE FUNCTION log_and_check_rate_limit(
    p_user_id UUID,
    p_action_type VARCHAR(50),
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}',
    p_max_actions INTEGER DEFAULT 10,
    p_time_window INTERVAL DEFAULT INTERVAL '1 hour'
)
RETURNS BOOLEAN AS $$
DECLARE
    can_proceed BOOLEAN;
BEGIN
    -- Check rate limit first
    can_proceed := check_rate_limit(p_user_id, p_action_type, p_max_actions, p_time_window);
    
    -- If under limit, log the action
    IF can_proceed THEN
        INSERT INTO user_actions (user_id, action_type, ip_address, user_agent, metadata)
        VALUES (p_user_id, p_action_type, p_ip_address, p_user_agent, p_metadata);
    END IF;
    
    RETURN can_proceed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- OPTIMIZED: Combined function to get remaining actions and reset time in one call
-- This reduces the number of API calls from 2 to 1
CREATE OR REPLACE FUNCTION get_rate_limit_status(
    p_user_id UUID,
    p_action_type VARCHAR(50),
    p_max_actions INTEGER,
    p_time_window INTERVAL
)
RETURNS TABLE(
    remaining_actions INTEGER,
    reset_time TIMESTAMP WITH TIME ZONE,
    used_actions INTEGER
) AS $$
DECLARE
    used_count INTEGER;
    oldest_action TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get count and oldest action in a single query
    SELECT COUNT(*), MIN(created_at)
    INTO used_count, oldest_action
    FROM user_actions
    WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND created_at > NOW() - p_time_window;
    
    -- Calculate remaining actions
    remaining_actions := GREATEST(0, p_max_actions - used_count);
    used_actions := used_count;
    
    -- Calculate reset time
    IF oldest_action IS NULL THEN
        reset_time := NOW();
    ELSE
        reset_time := oldest_action + p_time_window;
    END IF;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get remaining actions for a user (kept for backward compatibility)
CREATE OR REPLACE FUNCTION get_remaining_actions(
    p_user_id UUID,
    p_action_type VARCHAR(50),
    p_max_actions INTEGER,
    p_time_window INTERVAL
)
RETURNS INTEGER AS $$
DECLARE
    used_actions INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO used_actions
    FROM user_actions
    WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND created_at > NOW() - p_time_window;
    
    RETURN GREATEST(0, p_max_actions - used_actions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get time until rate limit resets (kept for backward compatibility)
CREATE OR REPLACE FUNCTION get_rate_limit_reset_time(
    p_user_id UUID,
    p_action_type VARCHAR(50),
    p_time_window INTERVAL
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    oldest_action TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT MIN(created_at)
    INTO oldest_action
    FROM user_actions
    WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND created_at > NOW() - p_time_window;
    
    IF oldest_action IS NULL THEN
        RETURN NOW();
    ELSE
        RETURN oldest_action + p_time_window;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION check_ip_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION log_and_check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION get_rate_limit_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_remaining_actions TO authenticated;
GRANT EXECUTE ON FUNCTION get_rate_limit_reset_time TO authenticated;
