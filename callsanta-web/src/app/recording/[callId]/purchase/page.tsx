'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Snowfall, Footer } from '@/components/layout';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';

function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

type PaymentResult = {
  clientSecret: string;
  amount: number;
  currency: string;
};

type CallData = {
  id: string;
  child_name: string;
  call_status: string;
  recording_purchased: boolean;
  parent_email: string;
};

function ExpressCheckoutWrapper({
  callId,
  clientSecret,
  setFlowError,
  setIsSubmitting,
  setExpressReady,
}: {
  callId: string;
  clientSecret: string;
  setFlowError: (value: string | null) => void;
  setIsSubmitting: (value: boolean) => void;
  setExpressReady: (value: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  return (
    <ExpressCheckoutElement
      options={{
        buttonHeight: 48,
        buttonType: {
          applePay: 'buy',
          googlePay: 'buy',
        },
        layout: {
          maxColumns: 1,
          maxRows: 3,
        },
      }}
      onReady={({ availablePaymentMethods }) => {
        console.log('Stripe Express availablePaymentMethods', availablePaymentMethods);
        setExpressReady(Boolean(availablePaymentMethods));
      }}
      onConfirm={async (event) => {
        if (!stripe || !elements) {
          event.paymentFailed?.({ reason: 'fail' });
          setFlowError('Payment is not ready yet. Please try again.');
          return;
        }

        setIsSubmitting(true);
        setFlowError(null);
        try {
          const { error } = await stripe.confirmPayment({
            elements,
            clientSecret,
            confirmParams: {
              return_url: `${window.location.origin}/recording/${callId}?purchased=true`,
            },
            redirect: 'if_required',
          });

          if (error) {
            event.paymentFailed?.({ reason: 'fail' });
            setFlowError(error.message || 'Payment failed. Please try again.');
            setIsSubmitting(false);
            return;
          }

          window.location.href = `/recording/${callId}?purchased=true`;
        } catch (err) {
          console.error('Express checkout error:', err);
          event.paymentFailed?.({ reason: 'fail' });
          setFlowError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
          setIsSubmitting(false);
        }
      }}
    />
  );
}

export default function RecordingPurchasePage() {
  const params = useParams();
  const callId = params.callId as string;

  const [call, setCall] = useState<CallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [expressReady, setExpressReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  // Fetch call data and create payment intent
  useEffect(() => {
    async function fetchData() {
      try {
        // First fetch call details
        const callRes = await fetch(`/api/calls/${callId}`);
        if (!callRes.ok) {
          const err = await callRes.json();
          throw new Error(err.error || 'Failed to fetch call details');
        }
        const callData = await callRes.json();
        setCall(callData);

        // Check if already purchased - redirect
        if (callData.recording_purchased) {
          window.location.href = `/recording/${callId}`;
          return;
        }

        // Check if call is not completed yet
        if (callData.call_status !== 'completed') {
          setLoading(false);
          return;
        }

        // Create payment intent
        const paymentRes = await fetch(`/api/recording/${callId}/payment-intent`, {
          method: 'POST',
        });

        if (!paymentRes.ok) {
          const err = await paymentRes.json();
          throw new Error(err.error || 'Failed to create payment');
        }

        const paymentData = await paymentRes.json();
        setPaymentResult(paymentData);

        // Also create checkout URL as fallback
        // We'll construct it from the existing checkout session endpoint
        setCheckoutUrl(`/api/recording/${callId}/checkout`);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    if (callId) {
      fetchData();
    }
  }, [callId]);

  const handleCheckoutRedirect = useCallback(async () => {
    setIsSubmitting(true);
    setFlowError(null);
    try {
      // Create a checkout session and redirect
      const res = await fetch(`/api/recording/${callId}/checkout`, {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('Failed to create checkout session');
      }
      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      setFlowError(err instanceof Error ? err.message : 'Failed to redirect to checkout');
      setIsSubmitting(false);
    }
  }, [callId]);

  const stripeOptions = paymentResult
    ? {
        clientSecret: paymentResult.clientSecret,
        appearance: {
          theme: 'stripe' as const,
          variables: {
            colorPrimaryText: '#111827',
            borderRadius: '8px',
          },
        },
      }
    : null;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#c41e3a]">
        <Snowfall />
        <section className="relative min-h-screen overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#c41e3a] via-[#b01a33] to-[#8d142a]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.12)_0%,_transparent_55%)]" />
          <div className="relative max-w-3xl mx-auto px-4 py-16 md:py-24">
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#d4a849] p-8 md:p-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-[#c41e3a] mx-auto mb-4" />
              <p className="text-[#c41e3a]/80">Loading...</p>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !call) {
    return (
      <div className="min-h-screen bg-[#c41e3a]">
        <Snowfall />
        <section className="relative min-h-screen overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#c41e3a] via-[#b01a33] to-[#8d142a]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.12)_0%,_transparent_55%)]" />
          <div className="relative max-w-3xl mx-auto px-4 py-16 md:py-24">
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#d4a849] p-8 md:p-12 text-center relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-[#d4a849] text-white px-6 py-2 rounded-full font-bold text-xs tracking-wide shadow-lg whitespace-nowrap uppercase">
                  Error
                </div>
              </div>
              <h1 className="font-display text-3xl font-bold text-[#c41e3a] mb-4">
                Something went wrong
              </h1>
              <p className="text-[#c41e3a]/80 mb-8">{error || 'Call not found'}</p>
              <Link
                href="/"
                className="inline-block w-full bg-[#c41e3a] hover:bg-[#a01830] text-white font-bold py-3 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-[#d4a849]"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // Call not completed yet
  if (call.call_status !== 'completed') {
    return (
      <div className="min-h-screen bg-[#c41e3a]">
        <Snowfall />
        <section className="relative min-h-screen overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#c41e3a] via-[#b01a33] to-[#8d142a]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.12)_0%,_transparent_55%)]" />
          <div className="relative max-w-3xl mx-auto px-4 py-16 md:py-24">
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#d4a849] p-8 md:p-12 text-center relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-[#d4a849] text-white px-6 py-2 rounded-full font-bold text-xs tracking-wide shadow-lg whitespace-nowrap uppercase">
                  Not Ready Yet
                </div>
              </div>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#c41e3a]/10 rounded-full mb-6 border border-[#d4a849]/60">
                <MicrophoneIcon className="w-12 h-12 text-[#c41e3a]/50" />
              </div>
              <h1 className="font-display text-3xl font-bold text-[#c41e3a] mb-4">
                Recording Not Available Yet
              </h1>
              <p className="text-[#c41e3a]/80 mb-8">
                The recording will be available for purchase after Santa&apos;s call with {call.child_name} is complete.
              </p>
              <Link
                href="/"
                className="inline-block w-full bg-[#c41e3a] hover:bg-[#a01830] text-white font-bold py-3 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-[#d4a849]"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // Main purchase page with embedded checkout
  return (
    <div className="min-h-screen bg-[#c41e3a]">
      <Snowfall />

      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#c41e3a] via-[#b01a33] to-[#8d142a]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.12)_0%,_transparent_55%)]" />

        <div className="relative max-w-3xl mx-auto px-4 py-16 md:py-24">
          {/* Purchase Card */}
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#d4a849] p-8 md:p-12 text-center relative">
            {/* Top badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="bg-[#d4a849] text-white px-6 py-2 rounded-full font-bold text-xs tracking-wide shadow-lg whitespace-nowrap uppercase">
                Special Offer
              </div>
        </div>

            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#c41e3a]/10 rounded-full mb-6 border border-[#d4a849]/60">
              <MicrophoneIcon className="w-12 h-12 text-[#c41e3a]" />
            </div>

            {/* Heading */}
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[#c41e3a] mb-4">
              Download The Call Recording
            </h1>

            <p className="text-lg text-[#c41e3a]/80 mb-8">
              Download the audio recording of Santa&apos;s call with{' '}
              <span className="font-semibold text-[#c41e3a]">{call.child_name}</span>
            </p>

            {/* Benefits */}
            <div className="bg-white rounded-2xl p-6 mb-8 text-left border border-[#d4a849]/40 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-[#c41e3a] mb-4">
                What You Get
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-[#c41e3a] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">High-quality MP3 recording of the full call</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-[#c41e3a] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Download unlimited times</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-[#c41e3a] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Have fun listening to the call!</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-[#c41e3a] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Share with family and friends</span>
                </li>
              </ul>
            </div>

            {/* Price */}
            <div className="mb-8">
              <span className="text-4xl font-bold text-[#c41e3a]">$4.99</span>
            </div>

            {/* Payment Section */}
            {paymentResult && stripePromise && stripeOptions ? (
              <div className="space-y-4">
                <Elements
                  key={paymentResult.clientSecret}
                  stripe={stripePromise}
                  options={stripeOptions}
                >
                  <div className="space-y-3">
                    <ExpressCheckoutWrapper
                      callId={callId}
                      clientSecret={paymentResult.clientSecret}
                      setFlowError={setFlowError}
                      setIsSubmitting={setIsSubmitting}
                      setExpressReady={setExpressReady}
                    />
                    {!expressReady && (
                      <p className="text-xs text-gray-500">
                        Apple Pay / Google Pay appears automatically if supported.
                      </p>
                    )}
                  </div>
                </Elements>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-300" />
                  <span className="text-xs uppercase tracking-wide text-gray-400">or</span>
                  <div className="flex-1 h-px bg-gray-300" />
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCheckoutRedirect}
                  disabled={isSubmitting}
                  className="w-full bg-gray-200 text-gray-800 border border-gray-300 hover:bg-gray-300"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  Pay with card
                </Button>

                {flowError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                    {flowError}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  type="button"
                  onClick={handleCheckoutRedirect}
                  disabled={isSubmitting}
                  className="w-full bg-[#c41e3a] hover:bg-[#a01830] text-white font-bold py-4 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-[#d4a849]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Purchase Recording
                </Button>

                {flowError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                    {flowError}
                  </div>
                )}
              </div>
            )}

            <p className="text-sm text-gray-500 mt-4">
              Secure payment powered by Stripe
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
