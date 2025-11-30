/**
 * Remotion Lambda Video Rendering Service
 *
 * Triggers video rendering on AWS Lambda via Remotion's API.
 * Videos are rendered in ~30-60 seconds instead of ~20 minutes locally.
 */

import { renderMediaOnLambda, AwsRegion } from '@remotion/lambda/client';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface TriggerLambdaRenderOptions {
  callId: string;
  audioUrl: string;
  childName: string;
  parentEmail: string;
}

interface LambdaRenderResult {
  success: boolean;
  renderId?: string;
  bucketName?: string;
  error?: string;
}

/**
 * Generate synthetic waveform data for visualization
 */
function generateWaveform(length: number): number[] {
  const waveform: number[] = [];
  for (let i = 0; i < length; i++) {
    const base = 0.3 + Math.random() * 0.4;
    const speech = Math.sin(i * 0.1) * 0.2;
    waveform.push(Math.max(0.1, Math.min(1, base + speech)));
  }
  return waveform;
}

/**
 * Trigger a video render on Remotion Lambda
 *
 * This sends the render job to AWS Lambda which renders in parallel.
 * When complete, Lambda calls our webhook at /api/webhooks/remotion
 */
export async function triggerLambdaRender(options: TriggerLambdaRenderOptions): Promise<LambdaRenderResult> {
  const { callId, audioUrl, childName, parentEmail } = options;

  // Validate environment variables
  const region = process.env.REMOTION_AWS_REGION as AwsRegion;
  const functionName = process.env.REMOTION_FUNCTION_NAME;
  const serveUrl = process.env.REMOTION_SERVE_URL;
  const webhookSecret = process.env.REMOTION_WEBHOOK_SECRET || null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!region || !functionName || !serveUrl || !appUrl) {
    const missing = [];
    if (!region) missing.push('REMOTION_AWS_REGION');
    if (!functionName) missing.push('REMOTION_FUNCTION_NAME');
    if (!serveUrl) missing.push('REMOTION_SERVE_URL');
    if (!appUrl) missing.push('NEXT_PUBLIC_APP_URL');

    console.error('[Lambda] Missing environment variables:', missing.join(', '));
    return { success: false, error: `Missing env vars: ${missing.join(', ')}` };
  }

  try {
    // Update status to processing
    await supabaseAdmin
      .from('calls')
      .update({ video_status: 'processing' })
      .eq('id', callId);

    // Download audio to calculate duration
    console.log(`[Lambda] Fetching audio to calculate duration for call ${callId}`);
    const audioResponse = await fetch(audioUrl);
    const audioBuffer = await audioResponse.arrayBuffer();

    // Estimate duration from file size (rough approximation for MP3)
    const durationSeconds = Math.max(5, Math.round(audioBuffer.byteLength / 20000));
    const fps = 60;
    const introDurationSeconds = 2;
    const audioDurationFrames = durationSeconds * fps;
    const totalDurationFrames = (introDurationSeconds * fps) + audioDurationFrames;

    // Generate waveform visualization data
    const waveformData = generateWaveform(durationSeconds * 100);

    console.log(`[Lambda] Starting render for call ${callId}`, {
      childName,
      durationSeconds,
      totalDurationFrames,
    });

    // Log the render initiation event
    await supabaseAdmin.from('call_events').insert({
      call_id: callId,
      event_type: 'lambda_render_started',
      event_data: {
        duration_seconds: durationSeconds,
        total_frames: totalDurationFrames,
        region,
        function_name: functionName,
      },
    });

    // Trigger Lambda render
    const { renderId, bucketName } = await renderMediaOnLambda({
      region,
      functionName,
      serveUrl,
      composition: 'SantaCallVideo',
      codec: 'h264',
      inputProps: {
        audioUrl,
        childName,
        audioDurationInFrames: totalDurationFrames,
        waveformData,
      },
      webhook: {
        url: `${appUrl}/api/webhooks/remotion`,
        secret: webhookSecret,
        customData: {
          callId,
          childName,
          parentEmail,
          audioUrl,
        },
      },
      // Performance settings
      framesPerLambda: 20,
      timeoutInMilliseconds: 240000,
      // Output settings
      privacy: 'public',
      // Video quality
      crf: 28,
      pixelFormat: 'yuv420p',
    });

    console.log(`[Lambda] Render initiated for call ${callId}`, { renderId, bucketName });

    // Update call with render ID for tracking
    await supabaseAdmin
      .from('calls')
      .update({
        video_status: 'processing',
        // Store render ID in metadata if needed for debugging
      })
      .eq('id', callId);

    return { success: true, renderId, bucketName };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Lambda] Failed to trigger render for call ${callId}:`, errorMessage);

    // Update status to failed
    await supabaseAdmin
      .from('calls')
      .update({ video_status: 'failed' })
      .eq('id', callId);

    // Log the error
    await supabaseAdmin.from('call_events').insert({
      call_id: callId,
      event_type: 'lambda_render_failed',
      event_data: { error: errorMessage },
    });

    return { success: false, error: errorMessage };
  }
}
