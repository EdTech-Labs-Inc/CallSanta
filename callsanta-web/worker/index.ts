/**
 * Video Worker - Continuous Background Process
 *
 * Polls for pending video renders and processes them.
 * Designed to run on Render as a background worker.
 *
 * Usage:
 *   npm run worker:dev    # Development with hot reload
 *   npm run worker:start  # Production
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import type { VideoJob } from './types';
import { RETRY_CONFIG, WORKER_CONFIG } from './types';
import { log, logError } from './logger';
import { renderVideo } from './render';

// Load environment variables (for local development)
config({ path: path.join(process.cwd(), '.env.local') });
config({ path: path.join(process.cwd(), '.env') });

// Worker state
let shuttingDown = false;
let currentJobId: string | null = null;

// Initialize Supabase
let supabase: SupabaseClient;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }

    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Claim the next pending job
 * Sets status to 'processing' atomically
 */
async function claimNextJob(): Promise<VideoJob | null> {
  const db = getSupabase();

  // Find oldest pending job that's not being retried yet (or retry delay has passed)
  const { data: jobs, error } = await db
    .from('calls')
    .select('id, child_name, recording_url, parent_email, transcript, call_duration_seconds, transcript_sent_at, recording_purchased, video_retry_count')
    .eq('video_status', 'pending')
    .not('recording_url', 'is', null)
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    logError('CLAIM', 'Failed to query pending jobs', error);
    return null;
  }

  if (!jobs || jobs.length === 0) {
    return null;
  }

  const job = jobs[0];

  // Atomically claim the job by updating status
  const { error: updateError } = await db
    .from('calls')
    .update({ video_status: 'processing' })
    .eq('id', job.id)
    .eq('video_status', 'pending'); // Only update if still pending

  if (updateError) {
    logError('CLAIM', 'Failed to claim job', updateError);
    return null;
  }

  return job as VideoJob;
}

/**
 * Handle job failure with retry logic
 */
async function handleFailure(jobId: string, error: string, currentRetryCount: number): Promise<void> {
  const db = getSupabase();
  const newRetryCount = currentRetryCount + 1;

  if (newRetryCount >= RETRY_CONFIG.maxRetries) {
    // Max retries reached - mark as permanently failed
    log('RETRY', `Job ${jobId} failed after ${RETRY_CONFIG.maxRetries} attempts, marking as failed`);

    await db
      .from('calls')
      .update({
        video_status: 'failed',
        video_retry_count: newRetryCount,
      })
      .eq('id', jobId);

    await db.from('call_events').insert({
      call_id: jobId,
      event_type: 'video_render_failed_permanently',
      event_data: { error, attempts: newRetryCount },
    });
  } else {
    // Schedule retry by setting back to pending
    const backoffDelay = RETRY_CONFIG.backoffDelays[currentRetryCount] || 600_000;
    log('RETRY', `Job ${jobId} failed, scheduling retry ${newRetryCount}/${RETRY_CONFIG.maxRetries} in ${backoffDelay / 1000}s`);

    await db
      .from('calls')
      .update({
        video_status: 'pending',
        video_retry_count: newRetryCount,
      })
      .eq('id', jobId);

    await db.from('call_events').insert({
      call_id: jobId,
      event_type: 'video_render_retry_scheduled',
      event_data: { error, attempt: newRetryCount, backoff_ms: backoffDelay },
    });

    // Note: For simplicity, we're setting back to pending immediately.
    // The job will be picked up on the next poll.
    // For true delayed retry, you'd need a scheduled_retry_at column.
  }
}

/**
 * Mark job as completed
 */
async function markCompleted(jobId: string, videoUrl: string): Promise<void> {
  const db = getSupabase();

  await db
    .from('calls')
    .update({
      video_url: videoUrl,
      video_status: 'completed',
      video_generated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  log('DB', `Job ${jobId} marked as completed`);
}

/**
 * Main worker loop
 */
async function runWorkerLoop(): Promise<void> {
  log('LOOP', 'Starting worker loop...');

  while (!shuttingDown) {
    try {
      const job = await claimNextJob();

      if (!job) {
        // No pending jobs, wait before polling again
        await sleep(WORKER_CONFIG.pollIntervalMs);
        continue;
      }

      currentJobId = job.id;
      log('JOB', `Processing job for: ${job.child_name}`, { jobId: job.id, retryCount: job.video_retry_count });

      const result = await renderVideo(job);

      if (result.success && result.videoUrl) {
        // Video already marked as completed in renderVideo
        log('JOB', `Job completed successfully`, { jobId: job.id });
      } else {
        // Render failed
        await handleFailure(job.id, result.error || 'Unknown error', job.video_retry_count);
      }

      currentJobId = null;
    } catch (err) {
      // Unexpected error - don't crash the worker
      logError('LOOP', 'Unexpected error in worker loop', err);

      if (currentJobId) {
        try {
          await handleFailure(currentJobId, err instanceof Error ? err.message : 'Unexpected error', 0);
        } catch (retryErr) {
          logError('LOOP', 'Failed to handle failure', retryErr);
        }
        currentJobId = null;
      }

      // Wait before continuing
      await sleep(WORKER_CONFIG.pollIntervalMs);
    }
  }

  log('LOOP', 'Worker loop ended');
}

/**
 * Graceful shutdown handler
 */
function setupShutdownHandlers(): void {
  const shutdown = async (signal: string) => {
    log('SHUTDOWN', `Received ${signal}, initiating graceful shutdown...`);
    shuttingDown = true;

    if (currentJobId) {
      log('SHUTDOWN', `Waiting for current job to complete: ${currentJobId}`);
      // The loop will finish the current job before exiting
    } else {
      log('SHUTDOWN', 'No job in progress, exiting immediately');
    }

    // Give time for current job to complete (max 5 minutes)
    const maxWait = 300_000;
    const startWait = Date.now();

    while (currentJobId && Date.now() - startWait < maxWait) {
      await sleep(1000);
    }

    if (currentJobId) {
      log('SHUTDOWN', `Timeout waiting for job ${currentJobId}, forcing exit`);
    }

    log('SHUTDOWN', 'Goodbye!');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║             SANTA VIDEO WORKER (Continuous)                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    logError('INIT', 'Missing required environment variables');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  log('INIT', 'Configuration:', {
    supabaseUrl: supabaseUrl.substring(0, 40) + '...',
    pollInterval: `${WORKER_CONFIG.pollIntervalMs}ms`,
    maxRetries: RETRY_CONFIG.maxRetries,
  });

  // Setup graceful shutdown
  setupShutdownHandlers();

  // Start the worker loop
  try {
    await runWorkerLoop();
  } catch (err) {
    logError('MAIN', 'Fatal error', err);
    process.exit(1);
  }
}

// Run
main();
