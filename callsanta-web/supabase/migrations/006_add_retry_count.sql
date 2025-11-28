-- Add retry_count column to track call retry attempts
-- Default 0 means original attempt, max 3 retries allowed (4 total attempts)

ALTER TABLE calls ADD COLUMN retry_count INTEGER DEFAULT 0 NOT NULL;

-- Add index for cron job efficiency when querying for scheduled calls eligible for retry
CREATE INDEX idx_calls_retry_eligible ON calls(scheduled_at, retry_count)
  WHERE call_status = 'scheduled' AND payment_status = 'paid' AND call_now = false;
