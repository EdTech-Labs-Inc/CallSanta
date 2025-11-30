import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { CallStatus, Call } from '@/types/database';
import { createHmac, timingSafeEqual } from 'crypto';
import { sendPostCallEmail } from '@/lib/email';
import { triggerLambdaRender } from '@/lib/video/lambda';

/**
 * Verify HMAC signature from ElevenLabs webhook
 * Header format: ElevenLabs-Signature: t=timestamp,v0=hash
 * Hash = HMAC-SHA256(timestamp.body)
 */
function verifyWebhookSignature(
  body: string,
  signatureHeader: string | null,
  secret: string
): { valid: boolean; error?: string } {
  if (!signatureHeader) {
    return { valid: false, error: 'Missing signature header' };
  }

  // Parse header: t=timestamp,v0=hash
  const parts = signatureHeader.split(',');
  const timestampPart = parts.find((p) => p.startsWith('t='));
  const signaturePart = parts.find((p) => p.startsWith('v0='));

  if (!timestampPart || !signaturePart) {
    return { valid: false, error: 'Invalid signature format' };
  }

  const timestamp = timestampPart.substring(2);
  const signature = signaturePart;

  // Validate timestamp (within 30 minutes)
  const reqTimestamp = Number(timestamp) * 1000;
  const tolerance = Date.now() - 30 * 60 * 1000;
  if (reqTimestamp < tolerance) {
    return { valid: false, error: 'Request expired' };
  }

  // Validate hash: HMAC-SHA256 of "timestamp.body"
  const message = `${timestamp}.${body}`;
  const expectedSignature = 'v0=' + createHmac('sha256', secret).update(message).digest('hex');

  try {
    const valid = timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
    return { valid };
  } catch {
    return { valid: false, error: 'Signature mismatch' };
  }
}

/**
 * ElevenLabs Post-Call Webhooks Handler
 *
 * Handles two event types:
 * 1. post_call_transcription - Contains transcript, analysis, metadata (no audio)
 * 2. post_call_audio - Contains base64-encoded MP3 audio (chunked delivery)
 *
 * Authentication: HMAC-SHA256 via ElevenLabs-Signature header
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET;

  // Read raw body (handles chunked transfer encoding automatically in Next.js)
  const rawBody = await request.text();

  // Verify HMAC signature
  if (webhookSecret) {
    const signatureHeader = request.headers.get('ElevenLabs-Signature');
    const { valid, error } = verifyWebhookSignature(rawBody, signatureHeader, webhookSecret);

    if (!valid) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json({ error: error || 'Invalid signature' }, { status: 401 });
    }
  } else {
    console.warn('ELEVENLABS_WEBHOOK_SECRET not configured - skipping signature verification');
  }

  try {
    const payload = JSON.parse(rawBody);
    const eventType = payload.type;
    const eventTimestamp = payload.event_timestamp;

    console.log(`ElevenLabs webhook received: type=${eventType}, timestamp=${eventTimestamp}`);

    // Route to appropriate handler
    switch (eventType) {
      case 'post_call_transcription':
        return await handleTranscriptionWebhook(payload.data);

      case 'post_call_audio':
        return await handleAudioWebhook(payload.data);

      case 'call_initiation_failure':
        return await handleCallFailureWebhook(payload.data);

      default:
        console.log(`Unknown webhook type: ${eventType}`);
        return NextResponse.json({ received: true, type: eventType });
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Handle post_call_transcription webhook
 * Contains: transcript, analysis, metadata (no audio)
 */
async function handleTranscriptionWebhook(data: {
  agent_id: string;
  conversation_id: string;
  status: string;
  transcript: Array<{ role: string; message: string; time_in_call_secs: number }>;
  metadata: {
    start_time_unix_secs: number;
    call_duration_secs: number;
    cost: number;
  };
  analysis?: {
    call_successful: string;
    transcript_summary: string;
  };
}) {
  const conversationId = data.conversation_id;

  // Find the call by conversation ID
  const { data: call, error: fetchError } = await supabaseAdmin
    .from('calls')
    .select('*')
    .eq('elevenlabs_conversation_id', conversationId)
    .single();

  if (fetchError || !call) {
    console.error('Call not found for conversation:', conversationId);
    return NextResponse.json({ received: true, warning: 'Call not found' });
  }

  // Format transcript as readable text
  const transcriptText = data.transcript
    ?.map((turn) => `${turn.role === 'agent' ? 'Santa' : 'Child'}: ${turn.message}`)
    .join('\n\n');

  // Map status
  const statusMap: Record<string, CallStatus> = {
    done: 'completed',
    completed: 'completed',
    failed: 'failed',
    error: 'failed',
  };

  const mappedStatus = statusMap[data.status?.toLowerCase()] || 'completed';

  // Update call record
  const updates: Record<string, unknown> = {
    call_status: mappedStatus,
    transcript: transcriptText || null,
    call_duration_seconds: data.metadata?.call_duration_secs || null,
    call_ended_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabaseAdmin
    .from('calls')
    .update(updates)
    .eq('id', call.id);

  if (updateError) {
    console.error('Failed to update call:', updateError);
  }

  // Log the event
  await supabaseAdmin.from('call_events').insert({
    call_id: call.id,
    event_type: 'post_call_transcription',
    event_data: {
      status: data.status,
      duration_secs: data.metadata?.call_duration_secs,
      call_successful: data.analysis?.call_successful,
      summary: data.analysis?.transcript_summary,
    },
  });

  console.log(`Transcription webhook processed for call ${call.id}`);

  // If recording was NOT purchased, send post-call email now (no need to wait for audio)
  // If recording WAS purchased, wait for audio webhook to send email
  if (!call.recording_purchased && transcriptText) {
    const updatedCall = { ...call, transcript: transcriptText, call_status: mappedStatus } as Call;
    await sendPostCallEmail(updatedCall);
    await supabaseAdmin
      .from('calls')
      .update({ transcript_sent_at: new Date().toISOString() })
      .eq('id', call.id);
    await supabaseAdmin.from('call_events').insert({
      call_id: call.id,
      event_type: 'post_call_email_sent',
      event_data: { recording_purchased: false },
    });
    console.log(`Post-call email sent for call ${call.id} (no recording)`);
  }

  return NextResponse.json({ received: true, callId: call.id, type: 'transcription' });
}

/**
 * Handle post_call_audio webhook
 * Contains: conversation_id, agent_id, full_audio (base64 MP3)
 * Delivered as chunked transfer encoding
 */
async function handleAudioWebhook(data: {
  agent_id: string;
  conversation_id: string;
  full_audio: string;
}) {
  const conversationId = data.conversation_id;

  // Find the call by conversation ID
  const { data: call, error: fetchError } = await supabaseAdmin
    .from('calls')
    .select('*')
    .eq('elevenlabs_conversation_id', conversationId)
    .single();

  if (fetchError || !call) {
    console.error('Call not found for conversation:', conversationId);
    return NextResponse.json({ received: true, warning: 'Call not found' });
  }

  // Decode base64 audio
  const audioBuffer = Buffer.from(data.full_audio, 'base64');
  const fileName = `${call.id}.mp3`;

  console.log(`Saving audio for call ${call.id}, size: ${audioBuffer.length} bytes`);

  // Upload to Supabase Storage
  const { error: uploadError } = await supabaseAdmin.storage
    .from('call-recordings')
    .upload(fileName, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

  if (uploadError) {
    console.error('Failed to upload recording:', uploadError);
    return NextResponse.json({ received: true, error: 'Upload failed' });
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from('call-recordings').getPublicUrl(fileName);

  // Update call record with recording URL
  const { error: updateError } = await supabaseAdmin
    .from('calls')
    .update({ recording_url: publicUrl })
    .eq('id', call.id);

  if (updateError) {
    console.error('Failed to update call with recording URL:', updateError);
  }

  // Log the event
  await supabaseAdmin.from('call_events').insert({
    call_id: call.id,
    event_type: 'post_call_audio',
    event_data: {
      file_name: fileName,
      file_size_bytes: audioBuffer.length,
      recording_url: publicUrl,
    },
  });

  console.log(`Audio saved for call ${call.id}: ${publicUrl}`);

  // Trigger video rendering on Remotion Lambda
  // This creates a shareable social media video in ~30-60 seconds
  try {
    const lambdaResult = await triggerLambdaRender({
      callId: call.id,
      audioUrl: publicUrl,
      childName: call.child_name,
      parentEmail: call.parent_email,
    });

    if (lambdaResult.success) {
      console.log(`[Webhook] Lambda render triggered for call ${call.id}`, {
        renderId: lambdaResult.renderId,
      });
    } else {
      console.error(`[Webhook] Lambda render failed for call ${call.id}:`, lambdaResult.error);
    }
  } catch (videoError) {
    console.error(`[Webhook] Failed to trigger Lambda render for call ${call.id}:`, videoError);
    // Don't fail the webhook if video render fails
  }

  // NOTE: Email is now sent by the Remotion webhook AFTER video is rendered
  // This ensures users get the email with the video link included
  // For calls without recording purchased, email is sent in handleTranscriptionWebhook
  console.log(`[Webhook] Email will be sent after video is rendered for call ${call.id}`);

  return NextResponse.json({ received: true, callId: call.id, type: 'audio' });
}

/**
 * Handle call_initiation_failure webhook
 * Sent when call fails to connect (busy, no answer, etc.)
 *
 * Retry Logic:
 * - If failure_reason is 'no-answer' or 'busy' AND retry_count < 3:
 *   - Reset call_status to 'scheduled' for next cron pickup
 *   - Increment retry_count
 *   - Set call_now to false (so cron handles it)
 *   - Clear conversation/call IDs for fresh attempt
 * - Otherwise: mark as final failure
 */
async function handleCallFailureWebhook(data: {
  agent_id: string;
  conversation_id: string;
  failure_reason: string;
  metadata?: {
    type: 'twilio' | 'sip';
    body: Record<string, unknown>;
  };
}) {
  const conversationId = data.conversation_id;

  // Find the call by conversation ID
  const { data: call, error: fetchError } = await supabaseAdmin
    .from('calls')
    .select('*')
    .eq('elevenlabs_conversation_id', conversationId)
    .single();

  if (fetchError || !call) {
    console.error('Call not found for conversation:', conversationId);
    return NextResponse.json({ received: true, warning: 'Call not found' });
  }

  // Determine if this failure reason is retryable
  const retryableReasons = ['no-answer', 'no_answer', 'busy'];
  const isRetryable = retryableReasons.includes(data.failure_reason);
  const currentRetryCount = call.retry_count || 0;
  const maxRetries = 3;
  const canRetry = isRetryable && currentRetryCount < maxRetries;

  if (canRetry) {
    // Queue for retry on next cron run
    const { error: updateError } = await supabaseAdmin
      .from('calls')
      .update({
        call_status: 'scheduled',
        retry_count: currentRetryCount + 1,
        call_now: false,
        // Clear previous attempt identifiers for fresh attempt
        elevenlabs_conversation_id: null,
        twilio_call_sid: null,
        call_started_at: null,
        call_ended_at: null,
      })
      .eq('id', call.id);

    if (updateError) {
      console.error('Failed to update call for retry:', updateError);
    }

    // Log the retry event
    await supabaseAdmin.from('call_events').insert({
      call_id: call.id,
      event_type: 'call_retry_scheduled',
      event_data: {
        failure_reason: data.failure_reason,
        previous_retry_count: currentRetryCount,
        new_retry_count: currentRetryCount + 1,
        provider_type: data.metadata?.type,
        provider_details: data.metadata?.body,
      },
    });

    console.log(
      `Call ${call.id} scheduled for retry (attempt ${currentRetryCount + 2} of 4): ${data.failure_reason}`
    );
  } else {
    // Final failure - no more retries
    const statusMap: Record<string, CallStatus> = {
      busy: 'failed',
      'no-answer': 'no_answer',
      'no_answer': 'no_answer',
      unknown: 'failed',
    };

    const mappedStatus = statusMap[data.failure_reason] || 'failed';

    const { error: updateError } = await supabaseAdmin
      .from('calls')
      .update({
        call_status: mappedStatus,
        call_ended_at: new Date().toISOString(),
      })
      .eq('id', call.id);

    if (updateError) {
      console.error('Failed to update call:', updateError);
    }

    // Log the final failure event
    await supabaseAdmin.from('call_events').insert({
      call_id: call.id,
      event_type: 'call_initiation_failure',
      event_data: {
        failure_reason: data.failure_reason,
        retry_count: currentRetryCount,
        max_retries_reached: isRetryable && currentRetryCount >= maxRetries,
        is_retryable_reason: isRetryable,
        provider_type: data.metadata?.type,
        provider_details: data.metadata?.body,
      },
    });

    console.log(
      `Call ${call.id} failed permanently: ${data.failure_reason} (retries: ${currentRetryCount})`
    );
  }

  return NextResponse.json({ received: true, callId: call.id, type: 'failure' });
}

// Handle GET for health check
export async function GET() {
  return NextResponse.json({ status: 'Webhook endpoint active' });
}
