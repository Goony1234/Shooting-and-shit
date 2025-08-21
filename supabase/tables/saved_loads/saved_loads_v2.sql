-- Saved loads table v2
-- Allow brass_id to be nullable for reused brass scenarios

-- Modify existing saved_loads table to allow null brass_id
ALTER TABLE saved_loads 
ALTER COLUMN brass_id DROP NOT NULL;

-- Add columns for brass reuse tracking
ALTER TABLE saved_loads 
ADD COLUMN IF NOT EXISTS brass_reuse_option VARCHAR(20) DEFAULT 'new' CHECK (brass_reuse_option IN ('new', 'reuse', 'amortize')),
ADD COLUMN IF NOT EXISTS brass_reuse_count INTEGER DEFAULT 1;

-- Add comments to explain the new fields
COMMENT ON COLUMN saved_loads.brass_reuse_option IS 'How brass cost is calculated: new (full cost), reuse (no cost), amortize (cost divided by reuse count)';
COMMENT ON COLUMN saved_loads.brass_reuse_count IS 'Number of times brass is expected to be reused for amortization calculation';

