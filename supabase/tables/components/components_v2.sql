-- Components table v2
-- Added box_price and quantity_per_box fields to track bulk purchasing information

-- Add new columns to existing components table
ALTER TABLE components 
ADD COLUMN IF NOT EXISTS box_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS quantity_per_box INTEGER;

-- Add a comment to explain the fields
COMMENT ON COLUMN components.box_price IS 'The price paid for a box/package of this component';
COMMENT ON COLUMN components.quantity_per_box IS 'The number of units in the box/package';
COMMENT ON COLUMN components.cost_per_unit IS 'The calculated or entered cost per individual unit';
