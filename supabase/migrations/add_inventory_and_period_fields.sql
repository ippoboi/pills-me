-- Add inventory tracking (only for indefinite supplements)
ALTER TABLE supplements ADD COLUMN inventory_total INTEGER;
ALTER TABLE supplements ADD COLUMN low_inventory_threshold INTEGER DEFAULT 10;

-- Add constraint: inventory must be positive if set
ALTER TABLE supplements ADD CONSTRAINT inventory_positive 
  CHECK (inventory_total IS NULL OR inventory_total >= 0);

-- Add comment
COMMENT ON COLUMN supplements.inventory_total IS 'Total capsules remaining. NULL for fixed-period supplements, tracked only for indefinite ones';
COMMENT ON COLUMN supplements.low_inventory_threshold IS 'Alert threshold for low inventory warning (default 10 pills)';
