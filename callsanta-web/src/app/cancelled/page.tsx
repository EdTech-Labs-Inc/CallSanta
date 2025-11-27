import Link from "next/link";
import { Snowfall, Footer } from "@/components/layout";

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

export default function CancelledPage() {
  return (
    <div className="min-h-screen bg-[#c41e3a]">
      <Snowfall />

      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#c41e3a] via-[#b01a33] to-[#8d142a]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.12)_0%,_transparent_55%)]" />

        <div className="relative max-w-3xl mx-auto px-4 py-16 md:py-24">
          {/* Cancelled Card */}
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#d4a849] p-8 md:p-12 text-center relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="bg-[#d4a849] text-white px-6 py-2 rounded-full font-bold text-xs tracking-wide shadow-lg whitespace-nowrap uppercase">
                Payment Not Completed
              </div>
            </div>
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#c41e3a]/10 rounded-full mb-6 border border-[#d4a849]/60">
              <XCircleIcon className="w-12 h-12 text-[#c41e3a]" />
            </div>

            {/* Heading */}
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[#c41e3a] mb-4">
              Payment Not Completed
            </h1>

            <p className="text-lg text-[#c41e3a]/80 mb-8">
              Don&apos;t worry! Your booking hasn&apos;t been lost. You can return to complete
              your payment whenever you&apos;re ready.
            </p>

            {/* Message from Santa */}
            <div className="bg-white rounded-2xl p-6 mb-8 border border-[#d4a849]/40 shadow-sm">
              <p className="text-gray-700 italic text-center">
                &ldquo;Ho ho ho! Santa&apos;s workshop is always here when you&apos;re ready.
                The elves have saved your spot!&rdquo;
              </p>
              <p className="text-[#c41e3a] font-display mt-2 text-center">— Santa Claus</p>
            </div>

            {/* Why Book Section */}
            <div className="text-left mb-8">
              <h2 className="font-display text-lg font-semibold text-[#c41e3a] mb-4">
                Why Book a Call with Santa?
              </h2>

              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-[#c41e3a]">✨</span>
                  <span>Create magical Christmas memories that last a lifetime</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#c41e3a]">✨</span>
                  <span>Personalized conversation just for your child</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#c41e3a]">✨</span>
                  <span>Receive a transcript (and optional recording) to treasure</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#c41e3a]">✨</span>
                  <span>Limited spots available before Christmas!</span>
                </li>
              </ul>
            </div>

            {/* CTAs */}
            <div className="space-y-4">
              <Link
                href="/book"
                className="inline-flex items-center justify-center w-full bg-[#c41e3a] hover:bg-[#a01830] text-white font-bold py-3 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-[#d4a849] gap-2"
              >
                Try Again
              </Link>

              <Link
                href="/book"
                className="inline-flex items-center justify-center w-full border-2 border-[#d4a849]/60 hover:border-[#d4a849] text-[#c41e3a] font-semibold py-3 px-6 rounded-full transition-all duration-300 bg-white gap-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Bookings
              </Link>
            </div>

            <p className="text-sm text-gray-500 mt-6">
              Having trouble?{" "}
              <a
                href="mailto:questions@santasnumber.com"
                className="text-[#c41e3a] hover:underline"
              >
                Contact our support team
              </a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
