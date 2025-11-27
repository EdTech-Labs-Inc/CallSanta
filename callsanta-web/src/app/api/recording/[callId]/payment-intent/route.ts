import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';

const RECORDING_PRICE_CENTS = 499; // $4.99

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

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: RECORDING_PRICE_CENTS,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        call_id: callId,
        type: 'recording_purchase',
        child_name: call.child_name,
      },
      receipt_email: call.parent_email,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: RECORDING_PRICE_CENTS,
      currency: 'usd',
    });
  } catch (err) {
    console.error('Error creating recording payment intent:', err);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

