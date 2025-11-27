import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { constructWebhookEvent } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  sendBookingConfirmationEmail,
  sendRecordingPurchaseConfirmationEmail,
} from '@/lib/email';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      }

      case 'payment_intent.succeeded': {
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const callId = session.metadata?.call_id;
  const isRecordingPurchase = session.metadata?.type === 'recording_purchase';

  if (!callId) {
    console.error('No call_id in session metadata');
    return;
  }

  if (isRecordingPurchase) {
    // Post-call recording purchase
    const { error } = await supabaseAdmin
      .from('calls')
      .update({
        recording_purchased: true,
        recording_purchased_at: new Date().toISOString(),
      })
      .eq('id', callId);

    if (error) {
      console.error('Error updating recording purchase:', error);
      throw error;
    }

    await logCallEvent(callId, 'recording_purchased', {
      session_id: session.id,
      amount: session.amount_total,
    });

    // Fetch the call to send confirmation email
    const { data: call } = await supabaseAdmin
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (call) {
      await sendRecordingPurchaseConfirmationEmail(call);
      await logCallEvent(callId, 'recording_purchase_email_sent', {});
    }
  } else {
    // Initial call booking payment
    const includeRecording = session.metadata?.include_recording === 'true';

    const { error } = await supabaseAdmin
      .from('calls')
      .update({
        payment_status: 'paid',
        call_status: 'scheduled',
        stripe_payment_intent_id: session.payment_intent as string,
        recording_purchased: includeRecording,
      })
      .eq('id', callId);

    if (error) {
      console.error('Error updating call after payment:', error);
      throw error;
    }

    await logCallEvent(callId, 'payment_received', {
      session_id: session.id,
      payment_intent: session.payment_intent,
      amount: session.amount_total,
      include_recording: includeRecording,
    });

    // Fetch the call to send confirmation email
    const { data: call } = await supabaseAdmin
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (call) {
      await sendBookingConfirmationEmail(call);
      await logCallEvent(callId, 'booking_confirmation_email_sent', {});
    }
  }

  console.log(`Checkout completed for call ${callId}`);
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const callId = paymentIntent.metadata?.call_id;

  if (!callId) {
    // This might be from a payment link without metadata
    console.log('Payment intent succeeded without call_id metadata');
    return;
  }

  const isRecordingPurchase = paymentIntent.metadata?.type === 'recording_purchase';
  const includeRecording = paymentIntent.metadata?.include_recording === 'true';

  const updates: Record<string, unknown> = {
    stripe_payment_intent_id: paymentIntent.id,
  };

  if (isRecordingPurchase) {
    updates.recording_purchased = true;
    updates.recording_purchased_at = new Date().toISOString();
  } else {
    updates.payment_status = 'paid';
    updates.call_status = 'scheduled';
    updates.recording_purchased = includeRecording;
  }

  const { error: updateError } = await supabaseAdmin
    .from('calls')
    .update(updates)
    .eq('id', callId);

  if (updateError) {
    console.error('Error updating call after payment intent success:', updateError);
    throw updateError;
  }

  await logCallEvent(callId, 'payment_intent_succeeded', {
    payment_intent_id: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    include_recording: includeRecording,
    type: paymentIntent.metadata?.type,
  });

  // Send confirmation email for recording purchases via Express Checkout
  if (isRecordingPurchase) {
    const { data: call } = await supabaseAdmin
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (call) {
      await sendRecordingPurchaseConfirmationEmail(call);
      await logCallEvent(callId, 'recording_purchase_email_sent', {});
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const callId = paymentIntent.metadata?.call_id;

  if (!callId) {
    console.log('Payment failed without call_id metadata');
    return;
  }

  const { error } = await supabaseAdmin
    .from('calls')
    .update({
      payment_status: 'failed',
      stripe_payment_intent_id: paymentIntent.id,
    })
    .eq('id', callId);

  if (error) {
    console.error('Error updating call after payment failure:', error);
    throw error;
  }

  await logCallEvent(callId, 'payment_failed', {
    payment_intent_id: paymentIntent.id,
    error: paymentIntent.last_payment_error?.message,
  });

  console.log(`Payment failed for call ${callId}`);
}

async function logCallEvent(
  callId: string,
  eventType: string,
  eventData: Record<string, unknown>
) {
  const { error } = await supabaseAdmin.from('call_events').insert({
    call_id: callId,
    event_type: eventType,
    event_data: eventData,
  });

  if (error) {
    console.error('Error logging call event:', error);
  }
}
