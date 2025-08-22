-- Weather conditions table v1
-- Store detailed weather data from API for load testing sessions

CREATE TABLE IF NOT EXISTS weather_conditions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES load_development_sessions(id) ON DELETE CASCADE,
    load_test_id UUID REFERENCES load_tests(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Location data
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    location_name VARCHAR(255),
    
    -- Weather API data
    temperature DECIMAL(5,2) NOT NULL, -- Fahrenheit
    feels_like DECIMAL(5,2), -- Apparent temperature
    humidity DECIMAL(5,2) NOT NULL, -- Percentage (0-100)
    barometric_pressure DECIMAL(6,2) NOT NULL, -- inHg
    
    -- Wind conditions
    wind_speed DECIMAL(4,1), -- mph
    wind_direction DECIMAL(5,1), -- degrees (0-360)
    wind_direction_text VARCHAR(10), -- N, NE, E, SE, S, SW, W, NW
    wind_gust DECIMAL(4,1), -- mph
    
    -- Atmospheric conditions
    visibility DECIMAL(4,1), -- miles
    uv_index DECIMAL(3,1),
    cloud_cover DECIMAL(5,2), -- percentage
    
    -- Precipitation
    precipitation DECIMAL(5,2), -- inches
    precipitation_type VARCHAR(20), -- rain, snow, sleet, etc.
    
    -- Additional weather data
    dew_point DECIMAL(5,2), -- Fahrenheit
    weather_description VARCHAR(255), -- "Clear sky", "Partly cloudy", etc.
    weather_icon VARCHAR(10), -- Weather API icon code
    
    -- API metadata
    api_provider VARCHAR(50), -- OpenWeatherMap, WeatherAPI, etc.
    api_response JSONB, -- Full API response for debugging
    
    -- Timestamps
    weather_timestamp TIMESTAMP WITH TIME ZONE NOT NULL, -- When weather was recorded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_weather_conditions_session_id ON weather_conditions(session_id);
CREATE INDEX IF NOT EXISTS idx_weather_conditions_load_test_id ON weather_conditions(load_test_id);
CREATE INDEX IF NOT EXISTS idx_weather_conditions_created_by ON weather_conditions(created_by);
CREATE INDEX IF NOT EXISTS idx_weather_conditions_weather_timestamp ON weather_conditions(weather_timestamp);
CREATE INDEX IF NOT EXISTS idx_weather_conditions_location ON weather_conditions(latitude, longitude);

-- Enable RLS
ALTER TABLE weather_conditions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own weather data
CREATE POLICY "Users can view their own weather conditions" ON weather_conditions
    FOR SELECT USING (auth.uid() = created_by);

-- Policy: Users can insert their own weather data
CREATE POLICY "Users can insert their own weather conditions" ON weather_conditions
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy: Users can update their own weather data
CREATE POLICY "Users can update their own weather conditions" ON weather_conditions
    FOR UPDATE USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Policy: Users can delete their own weather data
CREATE POLICY "Users can delete their own weather conditions" ON weather_conditions
    FOR DELETE USING (auth.uid() = created_by);

-- Add constraints
ALTER TABLE weather_conditions 
ADD CONSTRAINT check_weather_conditions_location_name_length 
CHECK (location_name IS NULL OR LENGTH(location_name) <= 255);

ALTER TABLE weather_conditions 
ADD CONSTRAINT check_weather_conditions_humidity_range 
CHECK (humidity >= 0 AND humidity <= 100);

ALTER TABLE weather_conditions 
ADD CONSTRAINT check_weather_conditions_wind_direction_range 
CHECK (wind_direction IS NULL OR (wind_direction >= 0 AND wind_direction <= 360));

ALTER TABLE weather_conditions 
ADD CONSTRAINT check_weather_conditions_cloud_cover_range 
CHECK (cloud_cover IS NULL OR (cloud_cover >= 0 AND cloud_cover <= 100));

-- Ensure either session_id or load_test_id is provided
ALTER TABLE weather_conditions 
ADD CONSTRAINT check_weather_conditions_reference 
CHECK (session_id IS NOT NULL OR load_test_id IS NOT NULL);

COMMENT ON TABLE weather_conditions IS 'Detailed weather conditions from API for load development sessions';
COMMENT ON COLUMN weather_conditions.barometric_pressure IS 'Barometric pressure in inches of mercury (inHg)';
COMMENT ON COLUMN weather_conditions.wind_direction IS 'Wind direction in degrees (0-360, where 0/360 = North)';
COMMENT ON COLUMN weather_conditions.api_response IS 'Full API response stored for debugging and future data extraction';
COMMENT ON COLUMN weather_conditions.weather_timestamp IS 'Timestamp when weather conditions were actually recorded';
