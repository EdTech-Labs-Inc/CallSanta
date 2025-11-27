import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createRecordingCheckoutSession } from "@/lib/stripe";
import { Snowfall, Footer } from "@/components/layout";

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

interface PageProps {
  params: Promise<{ callId: string }>;
}

export default async function RecordingPurchasePage({ params }: PageProps) {
  const { callId } = await params;

  // Fetch call details
  const { data: call, error } = await supabaseAdmin
    .from("calls")
    .select("*")
    .eq("id", callId)
    .single();

  if (error || !call) {
    notFound();
  }

  // If already purchased, redirect to download page
  if (call.recording_purchased) {
    redirect(`/recording/${callId}`);
  }

  // Check if call is completed (only allow purchase after call is done)
  if (call.call_status !== "completed") {
    return (
      <div className="min-h-screen">
        <Snowfall />
        <section className="relative min-h-screen festive-gradient overflow-hidden">
          <div className="relative max-w-2xl mx-auto px-4 py-16 md:py-24">
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
                <MicrophoneIcon className="w-12 h-12 text-yellow-600" />
              </div>
              <h1 className="font-display text-3xl font-bold text-gray-900 mb-4">
                Recording Not Available Yet
              </h1>
              <p className="text-gray-600 mb-8">
                The recording will be available for purchase after Santa&apos;s call with {call.child_name} is complete.
              </p>
              <Link
                href="/"
                className="inline-block bg-santa-red hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
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

  // Create checkout session for recording purchase
  let checkoutUrl = "";
  try {
    const session = await createRecordingCheckoutSession(callId, call.parent_email);
    checkoutUrl = session.url;
  } catch (err) {
    console.error("Failed to create checkout session:", err);
  }

  return (
    <div className="min-h-screen">
      <Snowfall />
      <section className="relative min-h-screen festive-gradient overflow-hidden">
        {/* Stars background */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-2xl mx-auto px-4 py-16 md:py-24">
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-santa-green/10 rounded-full mb-6">
              <MicrophoneIcon className="w-12 h-12 text-santa-green" />
            </div>

            {/* Heading */}
            <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Keep This Magical Memory Forever
            </h1>

            <p className="text-lg text-gray-600 mb-8">
              Download the audio recording of Santa&apos;s call with{" "}
              <span className="font-semibold text-santa-red">{call.child_name}</span>
            </p>

            {/* Benefits */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
              <h2 className="font-display text-lg font-semibold text-gray-900 mb-4">
                What You Get
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-santa-green flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">High-quality MP3 recording of the full call</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-santa-green flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Download unlimited times</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-santa-green flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Share with family and friends</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-santa-green flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Treasure this memory for years to come</span>
                </li>
              </ul>
            </div>

            {/* Price */}
            <div className="mb-8">
              <span className="text-4xl font-bold text-gray-900">$4.99</span>
              <span className="text-gray-500 ml-2">one-time purchase</span>
            </div>

            {/* CTA */}
            {checkoutUrl ? (
              <a
                href={checkoutUrl}
                className="inline-block w-full bg-santa-green hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
              >
                Purchase Recording
              </a>
            ) : (
              <p className="text-red-600">
                Unable to create checkout. Please try again later.
              </p>
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
