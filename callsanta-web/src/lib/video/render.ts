/**
 * Video Render Service
 * 
 * NOTE: Remotion bundler/renderer can't be imported directly in Next.js due to 
 * native binary dependencies. Video rendering is handled via:
 * 1. CLI script: npm run remotion:render-call -- --callId xxx
 * 2. Cron job that processes pending videos
 * 3. Remotion Lambda (recommended for production scale)
 * 
 * This module provides queue/status management only.
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

interface RenderVideoOptions {
  callId: string;
  audioUrl?: string;
  childName: string;
}

interface RenderResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
}

/**
 * Queue a video for rendering
 * The actual rendering is done by a separate worker process
 */
export async function queueVideoRender(options: RenderVideoOptions): Promise<void> {
  const { callId, childName } = options;
  
  console.log(`[Video] Queueing video render for call ${callId} (${childName})`);
  
  // Mark as pending (graceful - ignore if column doesn't exist)
  try {
    await supabaseAdmin
      .from('calls')
      .update({ video_status: 'pending' })
      .eq('id', callId);
    
    // Log the queue event
    await supabaseAdmin.from('call_events').insert({
      call_id: callId,
      event_type: 'video_render_queued',
      event_data: { child_name: childName },
    });
    
    console.log(`[Video] Call ${callId} queued for video rendering`);
  } catch (e) {
    console.log('[Video] Could not update video_status (column may not exist yet)');
  }
}

/**
 * Get pending video render jobs
 * Used by the worker/cron to find jobs to process
 */
export async function getPendingVideoRenders(): Promise<Array<{ id: string; child_name: string; recording_url: string }>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('calls')
      .select('id, child_name, recording_url')
      .eq('video_status', 'pending')
      .not('recording_url', 'is', null)
      .limit(10);

    if (error) {
      console.error('[Video] Failed to get pending renders:', error);
      return [];
    }

    return data || [];
  } catch {
    return [];
  }
}

/**
 * Mark a video render as complete
 * Called by the worker after successful render
 */
export async function markVideoComplete(callId: string, videoUrl: string): Promise<void> {
  try {
    await supabaseAdmin
      .from('calls')
      .update({
        video_url: videoUrl,
        video_status: 'completed',
        video_generated_at: new Date().toISOString(),
      })
      .eq('id', callId);

    await supabaseAdmin.from('call_events').insert({
      call_id: callId,
      event_type: 'video_render_completed',
      event_data: { video_url: videoUrl },
    });

    console.log(`[Video] Marked call ${callId} as complete`);
  } catch (e) {
    console.log('[Video] Could not update video status');
  }
}

/**
 * Mark a video render as failed
 * Called by the worker on render failure
 */
export async function markVideoFailed(callId: string, error: string): Promise<void> {
  try {
    await supabaseAdmin
      .from('calls')
      .update({ video_status: 'failed' })
      .eq('id', callId);

    await supabaseAdmin.from('call_events').insert({
      call_id: callId,
      event_type: 'video_render_failed',
      event_data: { error },
    });

    console.log(`[Video] Marked call ${callId} as failed: ${error}`);
  } catch {
    // Ignore
  }
}

// Placeholder for backwards compatibility - actual rendering done by worker
export async function renderSantaVideo(options: RenderVideoOptions): Promise<RenderResult> {
  console.log(`[Video] renderSantaVideo called for ${options.callId}`);
  console.log('[Video] NOTE: Actual rendering must be done via CLI worker');
  
  // Just queue it
  await queueVideoRender(options);
  
  return {
    success: true,
    error: 'Video queued for rendering by worker process',
  };
}
