import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createRecordingCheckoutSession } from '@/lib/stripe';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params;

    // Fetch call details
    const { data: call, error } = await supabaseAdmin
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (error || !call) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      );
    }

    // Check if already purchased
    if (call.recording_purchased) {
      return NextResponse.json(
        { error: 'Recording already purchased' },
        { status: 400 }
      );
    }

    // Check if call is completed
    if (call.call_status !== 'completed') {
      return NextResponse.json(
        { error: 'Recording not available yet - call not completed' },
        { status: 400 }
      );
    }

    // Create checkout session
    const session = await createRecordingCheckoutSession(callId, call.parent_email);

    return NextResponse.json({
      sessionId: session.sessionId,
      url: session.url,
    });
  } catch (err) {
    console.error('Error creating recording checkout session:', err);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

