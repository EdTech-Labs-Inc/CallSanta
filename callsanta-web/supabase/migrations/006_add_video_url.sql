-- Add video_url column for Remotion-generated viral videos
ALTER TABLE calls ADD COLUMN video_url TEXT;
ALTER TABLE calls ADD COLUMN video_generated_at TIMESTAMPTZ;
ALTER TABLE calls ADD COLUMN video_status VARCHAR(20) DEFAULT NULL;

-- Index for finding calls that need video generation
CREATE INDEX idx_calls_video_status ON calls(video_status) WHERE video_status IS NOT NULL;

COMMENT ON COLUMN calls.video_url IS 'URL to the Remotion-generated viral video (MP4)';
COMMENT ON COLUMN calls.video_generated_at IS 'Timestamp when video was generated';
COMMENT ON COLUMN calls.video_status IS 'Video generation status: pending, processing, completed, failed';

