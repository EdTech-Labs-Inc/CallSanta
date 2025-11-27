-- Remove the CHECK constraint on child_age that limits it to 1-18
ALTER TABLE calls DROP CONSTRAINT IF EXISTS calls_child_age_check;
