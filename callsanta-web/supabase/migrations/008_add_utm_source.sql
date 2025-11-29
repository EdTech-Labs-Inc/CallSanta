-- Add utm_source column to track marketing attribution
ALTER TABLE calls ADD COLUMN utm_source TEXT DEFAULT NULL;
