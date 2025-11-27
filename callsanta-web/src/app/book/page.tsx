'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BookingWizard } from '@/components/forms';
import { BookingFormData } from '@/lib/schemas/booking';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Footer } from '@/components/layout';
import Image from 'next/image';

// Pricing in cents
const PRICING = {
  basePrice: 299, // $2.99
  recordingPrice: 299, // $2.99
};

async function handleBookingSubmit(
  data: BookingFormData,
  voiceFile: File | null
): Promise<{
  callId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  checkoutUrl: string;
}> {
  const formData = new FormData();
  formData.append('data', JSON.stringify(data));
  if (voiceFile) {
    formData.append('voiceRecording', voiceFile);
  }

  const response = await fetch('/api/calls', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let message = 'Failed to create booking';
    try {
      const err = await response.json();
      if (err?.error || err?.details) {
        message = `${err.error || message}${err.details ? `: ${err.details}` : ''}`;
      }
    } catch {
      /* ignore json parse errors */
    }
    throw new Error(message);
  }

  return response.json();
}

export default function BookPage() {
  const [showWizard, setShowWizard] = useState(false);
  const wizardRef = useRef<HTMLDivElement | null>(null);

  const handleBookNow = useCallback(() => {
    setShowWizard(true);
    setTimeout(() => {
      wizardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, []);

  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* White As Seen Bar at very top - snow falls FROM here */}
      <AsSeenBar className="w-full rounded-b-xl" />
      
      {/* Main red background starts AFTER the white bar */}
      <div className="bg-[#c41e3a] min-h-screen relative">
        {/* Snow falling from the white bar */}
        <Snowfall />

        {/* Main Content */}
        <main className="relative z-10">
          <div className="-mt-4">
            <BookingHero onBookNow={handleBookNow} />
          </div>

          {/* Booking Section */}
          <div
          id="booking-wizard"
          ref={wizardRef}
          className="max-w-6xl mx-auto scroll-mt-10 px-4 sm:px-6 pt-6 pb-16"
        >
          {showWizard ? (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <BookingWizard onSubmit={handleBookingSubmit} pricing={PRICING} />
            </div>
          ) : null}
        </div>

        </main>

        {/* Bottom snow accumulation effect */}
        <div className="fixed bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white/30 to-transparent pointer-events-none z-10" />

        <Footer />
      </div>
    </div>
  );
}

/* ============================================
   SVG ICONS
   ============================================ */
function ShieldIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

/* ============================================
   AS SEEN BAR COMPONENT - WHITE BACKGROUND
   ============================================ */
const PLATFORMS = [
  { name: 'Instagram', src: '/1.png', size: 30 },
  { name: 'TikTok', src: '/2.png', size: 30 },
  { name: 'X', src: '/3.png', size: 30 },
  { name: 'Facebook', src: '/4.png', size: 30 },
  { name: 'YouTube', src: '/5.png', size: 30 },
  { name: 'Reddit', src: '/6.png', size: 30 },
];

function AsSeenBar({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white relative z-40', className)}>
      {/* Gold top accent line */}
      <div className="h-0.5 bg-[#d4a849]" />
      
      <div className="py-3 px-3">
        {/* Label */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-px w-8 bg-[#d4a849]" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#c41e3a]">
            As seen on
          </p>
          <div className="h-px w-8 bg-[#d4a849]" />
        </div>

      {/* Platform logos */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {PLATFORMS.map((platform) => (
          <div key={platform.name} className="transition-transform duration-300">
            <Image
                src={platform.src}
                alt={platform.name}
                width={platform.size}
                height={platform.size}
                className="opacity-80 hover:opacity-100 transition-opacity"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================
   BOOKING HERO COMPONENT - CLEAN & ELEGANT
   ============================================ */
function BookingHero({ onBookNow }: { onBookNow?: () => void }) {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center px-6 py-12">
      {/* Main content card */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* White card with gold border */}
        <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-2xl border-2 border-[#d4a849] relative">
          {/* Top badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <div className="bg-[#d4a849] text-white px-6 py-2 rounded-full font-bold text-xs tracking-wide shadow-lg whitespace-nowrap uppercase">
              Magical Experience
            </div>
          </div>

          {/* Santa illustration */}
          <div className="relative inline-block mb-4 mt-2">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-[#c41e3a]/15 flex items-center justify-center">
              <div className="text-5xl sm:text-6xl text-white drop-shadow-lg">🎅🏼</div>
            </div>
          </div>

          {/* Typography - single color */}
          <div className="space-y-3 mb-5">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#c41e3a]">
              Call with Santa!
            </h1>
            
            <p className="text-lg sm:text-xl text-[#c41e3a]/70 leading-relaxed max-w-lg mx-auto">
            Our real santa will call a number, ask your child or friend about their wishlist and then email it to you!
            </p>
          </div>

          {/* CTA Button */}
          <div className="relative inline-block group mb-4">
            <Button
              size="lg"
              onClick={onBookNow}
              className="bg-[#c41e3a] hover:bg-[#a01830] text-white text-xl sm:text-2xl px-12 py-6 rounded-full font-bold shadow-xl transition-all duration-300 hover:scale-105 border-2 border-[#d4a849]"
            >
              Book Now — $2.99
            </Button>
            <a
              href="#demo"
              className="mt-3 block text-sm text-[#c41e3a] underline underline-offset-4 decoration-[#d4a849]/60 hover:text-[#a01830] transition-colors"
            >
              See a demo
            </a>
            <div className="mt-12 text-xs text-gray-500 underline cursor-pointer font-normal">
              Learn how we keep calls safe & magical
            </div>
          </div>

        </div>
      </div>

    </section>
  );
}

/* ============================================
   SNOWFALL COMPONENT - White circle drops
   ============================================ */
function Snowfall() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Deterministic pseudo-random generator so SSR and client match
  const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Normalize numbers so server/client stringification is identical
  const formatPx = (value: number) => `${value.toFixed(3)}px`;
  const formatPercent = (value: number) => `${value.toFixed(3)}%`;
  const formatSeconds = (value: number) => `${value.toFixed(3)}s`;

  const flakes = Array.from({ length: 80 }).map((_, i) => {
    const rand = (offset: number) => pseudoRandom(i * 13.37 + offset);
    const size = rand(1) * 6 + 3; // 3-9px
    return {
      left: formatPercent(rand(2) * 100),
      width: formatPx(size),
      height: formatPx(size),
      opacity: Number((rand(3) * 0.5 + 0.4).toFixed(3)),
      animationDuration: formatSeconds(rand(4) * 6 + 6),
      animationDelay: formatSeconds(rand(5) * 8),
    };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      {/* Generate 80 snowflakes as white circles */}
      {flakes.map((flake, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-snowfall"
          style={{
            left: flake.left,
            top: '-10px',
            width: flake.width,
            height: flake.height,
            opacity: flake.opacity,
            animationDuration: flake.animationDuration,
            animationDelay: flake.animationDelay,
            boxShadow: '0 0 4px rgba(255,255,255,0.5)',
          }}
        />
      ))}
      
      <style jsx global>{`
        @keyframes snowfall {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0.9;
          }
          25% {
            transform: translateY(25vh) translateX(10px);
          }
          50% {
            transform: translateY(50vh) translateX(-10px);
          }
          75% {
            transform: translateY(75vh) translateX(5px);
          }
          100% {
            transform: translateY(105vh) translateX(-5px);
            opacity: 0.3;
          }
        }
        .animate-snowfall {
          animation: snowfall linear infinite;
        }
      `}</style>
    </div>
  );
}
