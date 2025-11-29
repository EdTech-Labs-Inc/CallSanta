/**
 * Shared types for video worker
 */

export interface Call {
  id: string;
  child_name: string;
  recording_url: string;
  parent_email: string;
  transcript: string | null;
  call_duration_seconds: number | null;
  transcript_sent_at: string | null;
  recording_purchased: boolean;
  video_status: string | null;
  video_retry_count: number;
}

export interface VideoJob {
  id: string;
  child_name: string;
  recording_url: string;
  parent_email: string;
  transcript: string | null;
  call_duration_seconds: number | null;
  transcript_sent_at: string | null;
  recording_purchased: boolean;
  video_retry_count: number;
}

export interface RenderResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
}

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  // Backoff delays in milliseconds: 30s, 2min, 10min
  backoffDelays: [30_000, 120_000, 600_000],
} as const;

// Worker configuration
export const WORKER_CONFIG = {
  pollIntervalMs: 5_000, // 5 seconds
  compositionId: 'SantaCallVideo',
  fps: 60,
  introDurationSeconds: 2,
} as const;
