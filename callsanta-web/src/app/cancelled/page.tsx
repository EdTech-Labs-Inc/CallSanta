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
          {/* Cancelled Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-6">
              <XCircleIcon className="w-12 h-12 text-amber-600" />
            </div>

            {/* Heading */}
            <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Payment Not Completed
            </h1>

            <p className="text-lg text-gray-600 mb-8">
              Don&apos;t worry! Your booking hasn&apos;t been lost. You can return to complete
              your payment whenever you&apos;re ready.
            </p>

            {/* Message from Santa */}
            <div className="bg-santa-cream rounded-xl p-6 mb-8 border-2 border-dashed border-santa-gold">
              <p className="text-gray-700 italic">
                &ldquo;Ho ho ho! Santa&apos;s workshop is always here when you&apos;re ready.
                The elves have saved your spot!&rdquo;
              </p>
              <p className="text-santa-red font-display mt-2">— Santa Claus</p>
            </div>

            {/* Why Book Section */}
            <div className="text-left mb-8">
              <h2 className="font-display text-lg font-semibold text-gray-900 mb-4">
                Why Book a Call with Santa?
              </h2>

              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="text-santa-red">✨</span>
                  <span>Create magical Christmas memories that last a lifetime</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-santa-red">✨</span>
                  <span>Personalized conversation just for your child</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-santa-red">✨</span>
                  <span>Receive a transcript (and optional recording) to treasure</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-santa-red">✨</span>
                  <span>Limited spots available before Christmas!</span>
                </li>
              </ul>
            </div>

            {/* CTAs */}
            <div className="space-y-4">
              <Link
                href="/book"
                className="inline-flex items-center justify-center w-full bg-santa-red hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors gap-2"
              >
                Try Again
              </Link>

              <Link
                href="/"
                className="inline-flex items-center justify-center w-full border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors gap-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Home
              </Link>
            </div>

            <p className="text-sm text-gray-500 mt-6">
              Having trouble?{" "}
              <a
                href="mailto:support@callsanta.com"
                className="text-santa-red hover:underline"
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
