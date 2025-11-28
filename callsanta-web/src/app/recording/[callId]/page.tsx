import Link from "next/link";
import { notFound } from "next/navigation";
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

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
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

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

interface PageProps {
  params: Promise<{ callId: string }>;
  searchParams: Promise<{ purchased?: string; tab?: string }>;
}

export default async function RecordingDownloadPage({ params, searchParams }: PageProps) {
  const { callId } = await params;
  const { purchased, tab } = await searchParams;

  // Fetch call details
  const { data: call, error } = await supabaseAdmin
    .from("calls")
    .select("*")
    .eq("id", callId)
    .single();

  if (error || !call) {
    notFound();
  }

  // Check if recording/video is available
  const hasRecording = !!call.recording_url;
  // Video fields may not exist if migration hasn't run - safely access them
  const hasVideo = !!(call as Record<string, unknown>).video_url;
  const videoStatus = (call as Record<string, unknown>).video_status as string | null;
  const videoUrl = (call as Record<string, unknown>).video_url as string | null;
  const justPurchased = purchased === "true";
  const activeTab = tab === "video" ? "video" : "audio";

  // Generate signed URLs for download (valid for 1 hour)
  let downloadUrl = call.recording_url;
  let videoDownloadUrl = call.video_url;

  if (hasRecording && call.recording_url) {
    const fileName = `${call.id}.mp3`;
    const { data } = await supabaseAdmin.storage
      .from("call-recordings")
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    if (data?.signedUrl) {
      downloadUrl = data.signedUrl;
    }
  }

  if (hasVideo && videoUrl) {
    const fileName = `${call.id}.mp4`;
    const { data } = await supabaseAdmin.storage
      .from("call-videos")
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    if (data?.signedUrl) {
      videoDownloadUrl = data.signedUrl;
    }
  }

  return (
    <div className="min-h-screen bg-[#c41e3a]">
      <Snowfall />

      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#c41e3a] via-[#b01a33] to-[#8d142a]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.12)_0%,_transparent_55%)]" />

        <div className="relative max-w-3xl mx-auto px-4 py-16 md:py-24">
          {/* Recording Card */}
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#d4a849] p-8 md:p-12 text-center relative">
            {/* Top badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="bg-[#d4a849] text-white px-6 py-2 rounded-full font-bold text-xs tracking-wide shadow-lg whitespace-nowrap uppercase">
                {hasRecording ? "Recording Ready" : "Processing"}
              </div>
            </div>

            {/* Success message if just purchased */}
            {justPurchased && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center gap-2 mt-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">Purchase successful!</span>
              </div>
            )}

            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#c41e3a]/10 rounded-full mb-6 border border-[#d4a849]/60">
              {hasRecording ? (
                <PlayIcon className="w-12 h-12 text-[#c41e3a]" />
              ) : (
                <LockIcon className="w-12 h-12 text-[#c41e3a]/50" />
              )}
            </div>

            {/* Heading */}
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[#c41e3a] mb-4">
              {hasRecording ? "Your Recording is Ready!" : "Recording Processing"}
            </h1>

            <p className="text-lg text-[#c41e3a]/80 mb-8">
              {hasRecording ? (
                <>
                  Santa&apos;s magical call with{" "}
                  <span className="font-semibold text-[#c41e3a]">{call.child_name}</span> is ready to download.
                </>
              ) : (
                <>
                  We&apos;re preparing Santa&apos;s call with{" "}
                  <span className="font-semibold text-[#c41e3a]">{call.child_name}</span>.
                  This usually takes just a few minutes.
                </>
              )}
            </p>

            {/* Tab Switcher (if video is available or processing) */}
            {(hasVideo || videoStatus === 'processing' || videoStatus === 'pending') && (
              <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-full">
                <Link
                  href={`/recording/${callId}`}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-semibold text-sm transition-all ${
                    activeTab === "audio"
                      ? "bg-white text-[#c41e3a] shadow-md"
                      : "text-gray-600 hover:text-[#c41e3a]"
                  }`}
                >
                  <PlayIcon className="w-4 h-4" />
                  Audio Recording
                </Link>
                <Link
                  href={`/recording/${callId}?tab=video`}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-semibold text-sm transition-all ${
                    activeTab === "video"
                      ? "bg-white text-[#c41e3a] shadow-md"
                      : "text-gray-600 hover:text-[#c41e3a]"
                  }`}
                >
                  <VideoIcon className="w-4 h-4" />
                  Shareable Video
                  {!hasVideo && (videoStatus === 'processing' || videoStatus === 'pending') && (
                    <span className="ml-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                      NEW
                    </span>
                  )}
                </Link>
              </div>
            )}

            {/* Audio Tab Content */}
            {activeTab === "audio" && (
              <>
                {/* Audio Player (if recording available) */}
                {hasRecording && downloadUrl && (
                  <div className="bg-white rounded-2xl p-6 mb-8 border border-[#d4a849]/40 shadow-sm">
                    <p className="text-sm text-[#c41e3a]/60 mb-4">Preview</p>
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

                {/* Download Button */}
                {hasRecording && downloadUrl ? (
                  <a
                    href={downloadUrl}
                    download={`santa-call-${call.child_name.toLowerCase().replace(/\s+/g, "-")}.mp3`}
                    className="inline-flex items-center justify-center gap-2 w-full bg-[#c41e3a] hover:bg-[#a01830] text-white font-bold py-4 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-[#d4a849]"
                  >
                    <DownloadIcon className="w-5 h-5" />
                    Download Audio Recording
                  </a>
                ) : (
                  <button
                    disabled
                    className="inline-flex items-center justify-center gap-2 w-full bg-gray-300 text-gray-500 font-semibold py-4 px-6 rounded-full cursor-not-allowed"
                  >
                    <DownloadIcon className="w-5 h-5" />
                    Download Not Available Yet
                  </button>
                )}
              </>
            )}

            {/* Video Tab Content */}
            {activeTab === "video" && (
              <>
                {hasVideo && videoDownloadUrl ? (
                  <>
                    {/* Video Preview */}
                    <div className="bg-gradient-to-br from-[#1a0a0a] to-[#4a1515] rounded-2xl p-4 mb-6 border border-[#d4a849]/40 shadow-lg">
                      <video
                        controls
                        className="w-full rounded-xl"
                        preload="metadata"
                        poster=""
                      >
                        <source src={videoDownloadUrl} type="video/mp4" />
                        Your browser does not support the video element.
                      </video>
                    </div>

                    {/* Social Share Callout */}
                    <div className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 p-[2px] rounded-2xl mb-6">
                      <div className="bg-white rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                          <ShareIcon className="w-8 h-8 text-[#c41e3a]" />
                          <div className="text-left">
                            <p className="font-bold text-gray-800">Share the Magic! ✨</p>
                            <p className="text-sm text-gray-600">
                              Perfect for TikTok, Instagram Reels, or sharing with family!
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Video Download Button */}
                    <a
                      href={videoDownloadUrl}
                      download={`santa-call-${call.child_name.toLowerCase().replace(/\s+/g, "-")}.mp4`}
                      className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#c41e3a] to-[#8b0000] hover:from-[#a01830] hover:to-[#6b0000] text-white font-bold py-4 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-[#d4a849]"
                    >
                      <VideoIcon className="w-5 h-5" />
                      Download Video (MP4)
                    </a>

                    <p className="text-sm text-gray-500 mt-3">
                      1080×1920 format • Perfect for social media
                    </p>
                  </>
                ) : videoStatus === 'processing' || videoStatus === 'pending' ? (
                  <div className="bg-gradient-to-br from-[#fff8e7] to-[#fef3c7] rounded-2xl p-8 mb-6 border-2 border-[#d4a849]/40">
                    <SpinnerIcon className="w-12 h-12 text-[#c41e3a] mx-auto mb-4" />
                    <h3 className="font-bold text-xl text-[#c41e3a] mb-2">Creating Your Video...</h3>
                    <p className="text-[#c41e3a]/70">
                      We&apos;re generating a beautiful shareable video of {call.child_name}&apos;s call with Santa.
                      This usually takes 2-5 minutes.
                    </p>
                    <p className="text-sm text-[#c41e3a]/50 mt-4">
                      Refresh this page to check if it&apos;s ready!
                    </p>
                  </div>
                ) : videoStatus === 'failed' ? (
                  <div className="bg-red-50 rounded-2xl p-8 mb-6 border border-red-200">
                    <p className="text-red-700 font-medium">
                      There was an issue generating the video. Please contact support.
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-2xl p-8 mb-6 border border-gray-200">
                    <VideoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Video will be available once your recording is processed.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Call Details */}
            <div className="bg-white rounded-2xl p-6 mt-8 text-left border border-[#d4a849]/40 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-[#c41e3a] mb-4">
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

            <p className="text-sm text-gray-500 mt-4">
              {hasRecording
                ? "Download links expire in 1 hour. You can always come back to this page for new links."
                : "Please check back in a few minutes. We'll also email you when it's ready."}
            </p>

            <hr className="my-8 border-[#d4a849]/30" />

            <Link
              href="/"
              className="inline-block w-full border-2 border-[#d4a849]/60 hover:border-[#d4a849] text-[#c41e3a] font-semibold py-3 px-6 rounded-full transition-all duration-300 bg-white"
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
