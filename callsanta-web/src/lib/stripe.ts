import Stripe from 'stripe';
import { Call } from '@/types/database';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

/**
 * Creates a Stripe checkout session for a Santa call booking
 */
export async function createCheckoutSession(
  call: Call,
  includeRecording: boolean
): Promise<CheckoutSessionResult> {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price: process.env.STRIPE_CALL_PRICE_ID!,
      quantity: 1,
    },
  ];

  if (includeRecording) {
    lineItems.push({
      price: process.env.STRIPE_RECORDING_PRICE_ID!,
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancelled?call_id=${call.id}`,
    customer_email: call.parent_email,
    metadata: {
      call_id: call.id,
      child_name: call.child_name,
      include_recording: includeRecording.toString(),
    },
    payment_intent_data: {
      metadata: {
        call_id: call.id,
        child_name: call.child_name,
      },
    },
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session URL');
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Creates a payment link for post-call recording purchase
 */
export async function createRecordingPaymentLink(callId: string): Promise<string> {
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price: process.env.STRIPE_RECORDING_PRICE_ID!,
        quantity: 1,
      },
    ],
    metadata: {
      call_id: callId,
      type: 'recording_purchase',
    },
    after_completion: {
      type: 'redirect',
      redirect: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/recording/${callId}`,
      },
    },
  });

  return paymentLink.url;
}

/**
 * Creates a Stripe checkout session for post-call recording purchase
 */
export async function createRecordingCheckoutSession(
  callId: string,
  customerEmail: string
): Promise<{ sessionId: string; url: string }> {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price: process.env.STRIPE_RECORDING_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/recording/${callId}?purchased=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/recording/${callId}/purchase`,
    customer_email: customerEmail,
    metadata: {
      call_id: callId,
      type: 'recording_purchase',
    },
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session URL');
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Retrieves a checkout session by ID
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent', 'line_items'],
  });
}

/**
 * Verifies a webhook signature and returns the event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
