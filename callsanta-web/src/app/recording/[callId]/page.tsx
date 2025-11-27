import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Snowfall, Footer } from "@/components/layout";

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

interface PageProps {
  params: Promise<{ callId: string }>;
  searchParams: Promise<{ purchased?: string }>;
}

export default async function RecordingDownloadPage({ params, searchParams }: PageProps) {
  const { callId } = await params;
  const { purchased } = await searchParams;

  // Fetch call details
  const { data: call, error } = await supabaseAdmin
    .from("calls")
    .select("*")
    .eq("id", callId)
    .single();

  if (error || !call) {
    notFound();
  }

  // If not purchased, redirect to purchase page
  if (!call.recording_purchased) {
    redirect(`/recording/${callId}/purchase`);
  }

  // Check if recording is available
  const hasRecording = !!call.recording_url;
  const justPurchased = purchased === "true";

  // Generate a signed URL for download (valid for 1 hour)
  let downloadUrl = call.recording_url;
  if (hasRecording && call.recording_url) {
    // If the recording is stored in Supabase, create a signed URL
    // For now, we'll use the public URL from the storage
    // In Phase 9, this should be a signed URL for security
    const fileName = `${call.id}.mp3`;
    const { data } = await supabaseAdmin.storage
      .from("call-recordings")
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    if (data?.signedUrl) {
      downloadUrl = data.signedUrl;
    }
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
            {/* Success message if just purchased */}
            {justPurchased && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">Purchase successful!</span>
              </div>
            )}

            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-santa-green/10 rounded-full mb-6">
              {hasRecording ? (
                <PlayIcon className="w-12 h-12 text-santa-green" />
              ) : (
                <LockIcon className="w-12 h-12 text-gray-400" />
              )}
            </div>

            {/* Heading */}
            <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {hasRecording ? "Your Recording is Ready!" : "Recording Processing"}
            </h1>

            <p className="text-lg text-gray-600 mb-8">
              {hasRecording ? (
                <>
                  Santa&apos;s magical call with{" "}
                  <span className="font-semibold text-santa-red">{call.child_name}</span> is ready to download.
                </>
              ) : (
                <>
                  We&apos;re preparing Santa&apos;s call with{" "}
                  <span className="font-semibold text-santa-red">{call.child_name}</span>.
                  This usually takes just a few minutes.
                </>
              )}
            </p>

            {/* Audio Player (if recording available) */}
            {hasRecording && downloadUrl && (
              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <p className="text-sm text-gray-500 mb-4">Preview</p>
                <audio
                  controls
                  className="w-full"
                  preload="metadata"
                >
                  <source src={downloadUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {/* Call Details */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
              <h2 className="font-display text-lg font-semibold text-gray-900 mb-4">
                Call Details
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Child&apos;s Name:</span>
                  <span className="text-gray-900 font-medium">{call.child_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Call Date:</span>
                  <span className="text-gray-900 font-medium">
                    {new Date(call.scheduled_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {call.call_duration_seconds && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration:</span>
                    <span className="text-gray-900 font-medium">
                      {Math.floor(call.call_duration_seconds / 60)}:{String(call.call_duration_seconds % 60).padStart(2, "0")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Download Button */}
            {hasRecording && downloadUrl ? (
              <a
                href={downloadUrl}
                download={`santa-call-${call.child_name.toLowerCase().replace(/\s+/g, "-")}.mp3`}
                className="inline-flex items-center justify-center gap-2 w-full bg-santa-green hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
              >
                <DownloadIcon className="w-5 h-5" />
                Download Recording
              </a>
            ) : (
              <button
                disabled
                className="inline-flex items-center justify-center gap-2 w-full bg-gray-300 text-gray-500 font-semibold py-4 px-6 rounded-lg cursor-not-allowed text-lg"
              >
                <DownloadIcon className="w-5 h-5" />
                Download Not Available Yet
              </button>
            )}

            <p className="text-sm text-gray-500 mt-4">
              {hasRecording
                ? "Download link expires in 1 hour. You can always come back to this page for a new link."
                : "Please check back in a few minutes. We'll also email you when it's ready."}
            </p>

            <hr className="my-8 border-gray-200" />

            <Link
              href="/"
              className="text-santa-red hover:underline font-medium"
            >
              Book Another Call
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
