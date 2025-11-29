-- Add video_retry_count column for tracking render retry attempts
-- This allows the worker to implement exponential backoff on failures

ALTER TABLE calls
ADD COLUMN IF NOT EXISTS video_retry_count INTEGER DEFAULT 0;

-- Index for efficiently finding pending video jobs
CREATE INDEX IF NOT EXISTS idx_calls_video_pending
ON calls(created_at)
WHERE video_status = 'pending';

-- Comment for documentation
COMMENT ON COLUMN calls.video_retry_count IS 'Number of video render retry attempts (max 3)';
