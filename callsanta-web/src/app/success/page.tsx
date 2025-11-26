import Link from "next/link";
import { redirect } from "next/navigation";
import { getCheckoutSession } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Snowfall, Footer } from "@/components/layout";

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

interface PageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function SuccessPage({ searchParams }: PageProps) {
  const { session_id } = await searchParams;

  if (!session_id) {
    redirect("/");
  }

  // Fetch session details from Stripe
  let session;
  try {
    session = await getCheckoutSession(session_id);
  } catch {
    redirect("/");
  }

  const callId = session.metadata?.call_id;
  if (!callId) {
    redirect("/");
  }

  // Fetch call details from database
  const { data: call } = await supabaseAdmin
    .from("calls")
    .select("*")
    .eq("id", callId)
    .single();

  if (!call) {
    redirect("/");
  }

  // Format the scheduled date
  const scheduledDate = new Date(call.scheduled_at);
  const formattedDate = scheduledDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = scheduledDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });

  const includesRecording = call.recording_purchased;

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
          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
            {/* Success Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircleIcon className="w-12 h-12 text-green-600" />
            </div>

            {/* Heading */}
            <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ho Ho Ho! Booking Confirmed!
            </h1>

            <p className="text-lg text-gray-600 mb-8">
              Santa has received the booking for{" "}
              <span className="font-semibold text-santa-red">{call.child_name}</span>!
            </p>

            {/* Call Details */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
              <h2 className="font-display text-lg font-semibold text-gray-900 mb-4">
                Call Details
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="w-5 h-5 text-santa-red mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{formattedDate}</p>
                    <p className="text-gray-600">{formattedTime}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <PhoneIcon className="w-5 h-5 text-santa-red mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {call.phone_number}
                    </p>
                    <p className="text-sm text-gray-600">
                      Santa will call this number
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MailIcon className="w-5 h-5 text-santa-red mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{call.parent_email}</p>
                    <p className="text-sm text-gray-600">
                      Confirmation sent to this email
                    </p>
                  </div>
                </div>

                {includesRecording && (
                  <div className="flex items-start gap-3">
                    <MicrophoneIcon className="w-5 h-5 text-santa-green mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Recording Included</p>
                      <p className="text-sm text-gray-600">
                        You&apos;ll receive the recording via email after the call
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* What Happens Next */}
            <div className="text-left mb-8">
              <h2 className="font-display text-lg font-semibold text-gray-900 mb-4">
                What Happens Next?
              </h2>

              <ol className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-santa-red text-white text-sm flex items-center justify-center">
                    1
                  </span>
                  <span>
                    Make sure the phone is available at the scheduled time
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-santa-red text-white text-sm flex items-center justify-center">
                    2
                  </span>
                  <span>
                    Santa will call from our special North Pole number
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-santa-red text-white text-sm flex items-center justify-center">
                    3
                  </span>
                  <span>
                    After the call, you&apos;ll receive a transcript by email
                    {includesRecording && " along with the recording"}
                  </span>
                </li>
              </ol>
            </div>

            {/* CTA */}
            <div className="space-y-4">
              <Link
                href="/"
                className="inline-block w-full bg-santa-red hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Back to Home
              </Link>

              <p className="text-sm text-gray-500">
                Questions?{" "}
                <a
                  href="mailto:support@callsanta.com"
                  className="text-santa-red hover:underline"
                >
                  Contact us
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
