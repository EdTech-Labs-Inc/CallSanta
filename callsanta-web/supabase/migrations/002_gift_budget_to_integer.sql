-- Migration: Change gift_budget from VARCHAR to INTEGER
-- This allows storing budget as a dollar amount (0-1000) instead of enum values

-- Convert gift_budget column from VARCHAR(20) to INTEGER
-- Handle any existing data by mapping old enum values to reasonable defaults
ALTER TABLE calls
ALTER COLUMN gift_budget TYPE INTEGER
USING CASE
    WHEN gift_budget = 'low' THEN 50
    WHEN gift_budget = 'medium' THEN 150
    WHEN gift_budget = 'high' THEN 300
    WHEN gift_budget = 'unlimited' THEN 1000
    WHEN gift_budget ~ '^\d+$' THEN gift_budget::INTEGER
    ELSE 0
END;

-- Add constraint to ensure budget is within valid range
ALTER TABLE calls
ADD CONSTRAINT check_gift_budget_range
CHECK (gift_budget >= 0 AND gift_budget <= 1000);

-- Add comment for documentation
COMMENT ON COLUMN calls.gift_budget IS 'Gift budget guidance in dollars (0-1000)';
