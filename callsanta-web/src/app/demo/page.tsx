'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Footer } from '@/components/layout';
import { FaInstagram, FaTiktok, FaXTwitter, FaFacebook, FaYoutube, FaReddit } from 'react-icons/fa6';
import type { IconType } from 'react-icons';
import Link from 'next/link';

export default function DemoPage() {
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
          <DemoHero />
        </main>

        {/* Bottom snow accumulation effect */}
        <div className="fixed bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white/30 to-transparent pointer-events-none z-10" />

        <Footer />
      </div>
    </div>
  );
}

/* ============================================
   AS SEEN BAR COMPONENT - WHITE BACKGROUND
   ============================================ */
const PLATFORMS: { name: string; icon: IconType; link?: string }[] = [
  { name: 'Instagram', icon: FaInstagram, link: 'https://www.instagram.com/santasnumberdotcom' },
  { name: 'TikTok', icon: FaTiktok },
  { name: 'X', icon: FaXTwitter },
  { name: 'Facebook', icon: FaFacebook },
  { name: 'YouTube', icon: FaYoutube },
  { name: 'Reddit', icon: FaReddit },
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
              {platform.link ? (
                <a href={platform.link} target="_blank" rel="noopener noreferrer">
                  <platform.icon
                    size={24}
                    className="text-[#c41e3a] opacity-80 hover:opacity-100 transition-opacity"
                  />
                </a>
              ) : (
                <platform.icon
                  size={24}
                  className="text-[#c41e3a] opacity-80 hover:opacity-100 transition-opacity"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================
   DEMO HERO COMPONENT - VIDEO SHOWCASE
   ============================================ */
function DemoHero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center px-6 py-12">
      {/* Main content card */}
      <div className="relative z-10 text-center max-w-3xl mx-auto">
        {/* White card with gold border */}
        <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-2xl border-2 border-[#d4a849] relative">
          {/* Top badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <div className="bg-[#d4a849] text-white px-6 py-2 rounded-full font-bold text-xs tracking-wide shadow-lg whitespace-nowrap uppercase">
              See How It Works
            </div>
          </div>

          {/* Santa illustration */}
          <div className="relative inline-block mb-4 mt-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-[#c41e3a]/15 flex items-center justify-center">
              <div className="text-4xl sm:text-5xl text-white drop-shadow-lg">🎬</div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#c41e3a] mb-6">
            Watch Santa in Action!
          </h1>

          {/* Video Container */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg border-2 border-[#d4a849]/30 mb-6">
            {/* Replace the src with your actual video URL */}
            {/* For YouTube: https://www.youtube.com/embed/VIDEO_ID */}
            {/* For Vimeo: https://player.vimeo.com/video/VIDEO_ID */}
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/uP_0oe79qzw"
              title="Call Santa Demo Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          {/* Description text */}
          <div className="space-y-4 mb-6">
            <p className="text-lg sm:text-xl text-[#c41e3a]/80 leading-relaxed max-w-lg mx-auto">
              Watch how Santa calls your child, asks about their wishlist, and creates a magical holiday memory they&apos;ll never forget!
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-[#c41e3a]/60">
              <span className="flex items-center gap-2">
                <span className="text-lg">📞</span> Real phone call
              </span>
              <span className="hidden sm:block">•</span>
              <span className="flex items-center gap-2">
                <span className="text-lg">🎅🏼</span> Authentic Santa voice
              </span>
              <span className="hidden sm:block">•</span>
              <span className="flex items-center gap-2">
                <span className="text-lg">📧</span> Wishlist sent to you
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="relative inline-block group">
            <Link href="/book?book=true">
              <Button
                size="lg"
                className="bg-[#c41e3a] hover:bg-[#a01830] text-white text-xl sm:text-2xl px-12 py-6 rounded-full font-bold shadow-xl transition-all duration-300 hover:scale-105 border-2 border-[#d4a849]"
              >
                Book Your Call — $0.99
              </Button>
            </Link>
            <p className="mt-4 text-sm text-[#c41e3a]/60">
              Create magical memories this holiday season ✨
            </p>
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

