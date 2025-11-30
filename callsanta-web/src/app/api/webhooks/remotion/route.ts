/**
 * Remotion Lambda Webhook Handler
 *
 * Called by Remotion Lambda when video rendering completes, fails, or times out.
 * Downloads the rendered video from Lambda's S3 and uploads to Supabase Storage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateWebhookSignature } from '@remotion/lambda/client';
import { createClient } from '@supabase/supabase-js';
import { sendPostCallEmail } from '@/lib/email';
import { Call } from '@/types/database';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface WebhookCustomData {
  callId: string;
  childName: string;
  parentEmail: string;
  audioUrl: string;
}

interface SuccessPayload {
  type: 'success';
  renderId: string;
  expectedBucketOwner: string;
  bucketName: string;
  outputUrl: string;
  outputFile: string;
  timeToFinish: number;
  costs: {
    accruedSoFar: number;
    displayCost: string;
    currency: string;
    disclaimer: string;
  };
  customData: WebhookCustomData;
}

interface ErrorPayload {
  type: 'error';
  renderId: string;
  expectedBucketOwner: string;
  bucketName: string;
  errors: Array<{ message: string; name: string; stack: string }>;
  customData: WebhookCustomData;
}

interface TimeoutPayload {
  type: 'timeout';
  renderId: string;
  expectedBucketOwner: string;
  bucketName: string;
  customData: WebhookCustomData;
}

type WebhookPayload = SuccessPayload | ErrorPayload | TimeoutPayload;

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.REMOTION_WEBHOOK_SECRET;

  // Read raw body for signature verification
  const rawBody = await request.text();

  // Verify webhook signature if secret is configured
  if (webhookSecret) {
    const signature = request.headers.get('X-Remotion-Signature');

    if (!signature || signature === 'NO_SECRET_PROVIDED') {
      console.error('[Remotion Webhook] Missing or invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    try {
      validateWebhookSignature({
        secret: webhookSecret,
        body: rawBody,
        signatureHeader: signature,
      });
    } catch (error) {
      console.error('[Remotion Webhook] Signature validation failed:', error);
      return NextResponse.json({ error: 'Signature validation failed' }, { status: 401 });
    }
  }

  try {
    const payload: WebhookPayload = JSON.parse(rawBody);
    const status = request.headers.get('X-Remotion-Status');
    const mode = request.headers.get('X-Remotion-Mode');

    console.log(`[Remotion Webhook] Received: status=${status}, mode=${mode}, type=${payload.type}`);

    // Handle demo/test requests
    if (mode === 'demo') {
      console.log('[Remotion Webhook] Demo request received - acknowledging');
      return NextResponse.json({ received: true, mode: 'demo' });
    }

    // Route to appropriate handler
    switch (payload.type) {
      case 'success':
        return await handleSuccess(payload);
      case 'error':
        return await handleError(payload);
      case 'timeout':
        return await handleTimeout(payload);
      default:
        console.warn('[Remotion Webhook] Unknown payload type:', (payload as WebhookPayload).type);
        return NextResponse.json({ received: true, warning: 'Unknown type' });
    }
  } catch (error) {
    console.error('[Remotion Webhook] Processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful render completion
 */
async function handleSuccess(payload: SuccessPayload): Promise<NextResponse> {
  const { renderId, outputUrl, timeToFinish, costs, customData } = payload;
  const { callId, childName, parentEmail } = customData;

  console.log(`[Remotion Webhook] Success for call ${callId}`, {
    renderId,
    timeToFinish: `${(timeToFinish / 1000).toFixed(1)}s`,
    cost: costs.displayCost,
  });

  try {
    // Download the rendered video from Lambda's S3
    console.log(`[Remotion Webhook] Downloading video from Lambda S3: ${outputUrl}`);
    const videoResponse = await fetch(outputUrl);

    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status}`);
    }

    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    const videoFileName = `${callId}.mp4`;

    console.log(`[Remotion Webhook] Downloaded video: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Upload to Supabase Storage
    console.log(`[Remotion Webhook] Uploading to Supabase Storage: ${videoFileName}`);
    const { error: uploadError } = await supabaseAdmin.storage
      .from('call-videos')
      .upload(videoFileName, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload video: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('call-videos')
      .getPublicUrl(videoFileName);

    console.log(`[Remotion Webhook] Video uploaded: ${publicUrl}`);

    // Update call record
    await supabaseAdmin
      .from('calls')
      .update({
        video_url: publicUrl,
        video_status: 'completed',
        video_generated_at: new Date().toISOString(),
      })
      .eq('id', callId);

    // Log success event
    await supabaseAdmin.from('call_events').insert({
      call_id: callId,
      event_type: 'lambda_render_completed',
      event_data: {
        render_id: renderId,
        time_to_finish_ms: timeToFinish,
        cost: costs.displayCost,
        video_url: publicUrl,
      },
    });

    // Fetch full call data for email
    const { data: fullCall, error: fetchError } = await supabaseAdmin
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (fetchError || !fullCall) {
      console.error(`[Remotion Webhook] Failed to fetch call for email:`, fetchError);
    } else if (!fullCall.transcript_sent_at) {
      // Send post-call email with video link
      console.log(`[Remotion Webhook] Sending post-call email for call ${callId}`);
      await sendPostCallEmail(fullCall as Call);

      await supabaseAdmin
        .from('calls')
        .update({ transcript_sent_at: new Date().toISOString() })
        .eq('id', callId);

      await supabaseAdmin.from('call_events').insert({
        call_id: callId,
        event_type: 'post_call_email_sent',
        event_data: { with_video: true, video_url: publicUrl },
      });

      console.log(`[Remotion Webhook] Post-call email sent for call ${callId}`);
    } else {
      console.log(`[Remotion Webhook] Email already sent for call ${callId}, skipping`);
    }

    console.log(`[Remotion Webhook] Successfully processed call ${callId}`);

    return NextResponse.json({
      received: true,
      callId,
      videoUrl: publicUrl,
      renderTime: `${(timeToFinish / 1000).toFixed(1)}s`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Remotion Webhook] Failed to process success for call ${callId}:`, errorMessage);

    // Update status to failed
    await supabaseAdmin
      .from('calls')
      .update({ video_status: 'failed' })
      .eq('id', callId);

    await supabaseAdmin.from('call_events').insert({
      call_id: callId,
      event_type: 'lambda_webhook_failed',
      event_data: { error: errorMessage, render_id: renderId },
    });

    return NextResponse.json({ received: true, error: errorMessage }, { status: 500 });
  }
}

/**
 * Handle render error
 */
async function handleError(payload: ErrorPayload): Promise<NextResponse> {
  const { renderId, errors, customData } = payload;
  const { callId } = customData;

  const errorMessage = errors[0]?.message || 'Unknown render error';
  console.error(`[Remotion Webhook] Error for call ${callId}:`, errorMessage);

  // Update call status
  await supabaseAdmin
    .from('calls')
    .update({ video_status: 'failed' })
    .eq('id', callId);

  // Log error event
  await supabaseAdmin.from('call_events').insert({
    call_id: callId,
    event_type: 'lambda_render_error',
    event_data: {
      render_id: renderId,
      errors: errors.map((e) => ({ message: e.message, name: e.name })),
    },
  });

  return NextResponse.json({ received: true, callId, error: errorMessage });
}

/**
 * Handle render timeout
 */
async function handleTimeout(payload: TimeoutPayload): Promise<NextResponse> {
  const { renderId, customData } = payload;
  const { callId } = customData;

  console.error(`[Remotion Webhook] Timeout for call ${callId}, renderId: ${renderId}`);

  // Update call status
  await supabaseAdmin
    .from('calls')
    .update({ video_status: 'failed' })
    .eq('id', callId);

  // Log timeout event
  await supabaseAdmin.from('call_events').insert({
    call_id: callId,
    event_type: 'lambda_render_timeout',
    event_data: { render_id: renderId },
  });

  return NextResponse.json({ received: true, callId, error: 'Render timed out' });
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: 'Remotion webhook endpoint active' });
}
