import { NextRequest, NextResponse } from 'next/server';
import { initiateCall } from '@/lib/elevenlabs';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Call } from '@/types/database';

/**
 * Cron job to initiate scheduled calls
 * Runs every minute via Vercel Cron
 *
 * Finds calls that are:
 * - status: 'scheduled'
 * - payment_status: 'paid'
 * - scheduled_at: any time in the past or within the next minute
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this in the Authorization header)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('Unauthorized cron request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find calls ready to be made (scheduled within the next 60 seconds)
    const now = new Date();
    const oneMinuteFromNow = new Date(now.getTime() + 60000);

    const { data: calls, error: fetchError } = await supabaseAdmin
      .from('calls')
      .select('*')
      .eq('call_status', 'scheduled')
      .eq('payment_status', 'paid')
      .lte('scheduled_at', oneMinuteFromNow.toISOString());

    if (fetchError) {
      console.error('Error fetching scheduled calls:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!calls || calls.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No calls to process' });
    }

    const results: Array<{
      callId: string;
      success: boolean;
      error?: string;
      conversationId?: string;
    }> = [];

    for (const call of calls as Call[]) {
      try {
        // Initiate the call via ElevenLabs
        const result = await initiateCall(call.phone_number, {
          childName: call.child_name,
          childAge: call.child_age,
          giftBudget: call.gift_budget,
          childInfoText: call.child_info_text || undefined,
          childInfoVoiceTranscript: call.child_info_voice_transcript || undefined,
        });

        // Update call record with ElevenLabs/Twilio IDs
        const { error: updateError } = await supabaseAdmin
          .from('calls')
          .update({
            call_status: 'queued',
            twilio_call_sid: result.callSid,
            elevenlabs_conversation_id: result.conversationId,
            call_started_at: new Date().toISOString(),
          })
          .eq('id', call.id);

        if (updateError) {
          console.error(`Failed to update call ${call.id}:`, updateError);
        }

        // Log the event
        await supabaseAdmin.from('call_events').insert({
          call_id: call.id,
          event_type: 'call_initiated',
          event_data: {
            conversation_id: result.conversationId,
            call_sid: result.callSid,
            success: result.success,
          },
        });

        results.push({
          callId: call.id,
          success: true,
          conversationId: result.conversationId || undefined,
        });

        console.log(`Initiated call ${call.id} for ${call.child_name}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to initiate call ${call.id}:`, errorMessage);

        // Mark the call as failed
        await supabaseAdmin
          .from('calls')
          .update({ call_status: 'failed' })
          .eq('id', call.id);

        // Log the failure
        await supabaseAdmin.from('call_events').insert({
          call_id: call.id,
          event_type: 'call_failed',
          event_data: { error: errorMessage },
        });

        results.push({
          callId: call.id,
          success: false,
          error: errorMessage,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      processed: results.length,
      success: successCount,
      failed: failCount,
      results,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
