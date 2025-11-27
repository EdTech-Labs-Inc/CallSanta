'use client';

import { Button } from '@/components/ui';

type BookingHeroProps = {
  onBookNow?: () => void;
};

export function BookingHero({ onBookNow }: BookingHeroProps) {
  return (
    <section className="relative min-h-[25vh] sm:min-h-[30vh] flex items-center justify-center px-3 py-4 overflow-hidden">
      {/* Layered background */}
      <div className="absolute inset-0">
        {/* Deep rich gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0505] via-[#3d0f0f] to-[#1a0a0a]" />
        
        {/* Radial glow from center */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(180,50,50,0.3)_0%,_transparent_70%)]" />
        
        {/* Subtle pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L30 60M0 30L60 30' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />
        
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
      </div>

      {/* Decorative floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated ornament glows */}
        <div className="absolute top-20 left-[15%] w-2 h-2 rounded-full bg-amber-400/60 blur-sm animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute top-40 right-[20%] w-3 h-3 rounded-full bg-red-400/50 blur-sm animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute bottom-40 left-[25%] w-2 h-2 rounded-full bg-emerald-400/50 blur-sm animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
        <div className="absolute bottom-60 right-[15%] w-2 h-2 rounded-full bg-amber-300/60 blur-sm animate-pulse" style={{ animationDuration: '4.5s', animationDelay: '2s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-md mx-auto">
        {/* Typography */}
        <div className="space-y-3 mb-5">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-medium text-white tracking-tight leading-snug">
            <span className="block text-amber-200/90">Get a Call From</span>
            <span className="block mt-1 bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent">
              Santa Claus
            </span>
          </h1>
          
          <p className="text-xs sm:text-sm text-white/70 font-light leading-relaxed max-w-sm mx-auto">
            Book a magical 3-minute personalized call where Santa chats with your child
            about their Christmas wishes and sends you the list!
          </p>
        </div>

        {/* CTA Button */}
        <div className="relative inline-block group mb-5">
          {/* Button glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-red-400 to-amber-400 rounded-full blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
          
          <Button
            size="sm"
            onClick={onBookNow}
            className="relative bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-[#2d1010] hover:from-amber-300 hover:via-amber-200 hover:to-amber-300 text-xs sm:text-sm px-6 py-3 rounded-full font-semibold shadow-lg shadow-amber-500/20 transition-all duration-300 hover:scale-105 hover:shadow-amber-500/40 border border-amber-200/20"
          >
            Book Now — $2.99
          </Button>

          <a
            href="#demo"
            className="mt-2 block text-[11px] text-white underline underline-offset-4 decoration-white/40 hover:text-amber-100 transition-colors"
          >
            See a demo
          </a>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { emoji: '🎅🏻', text: '3-min call' },
            { emoji: '📧', text: 'Wish list emailed to you' },
            { emoji: '🔒', text: 'Safety Guardrails' },
          ].map((feature, index) => (
            <span
              key={feature.text}
              className="inline-flex items-center gap-0.5 px-1.5 py-[2px] rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-[9px] text-white/70 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              style={{
                animation: 'fadeInUp 0.6s ease-out forwards',
                animationDelay: `${0.3 + index * 0.1}s`,
                opacity: 0,
              }}
            >
              <span className="text-[9px] leading-none">{feature.emoji}</span>
              <span className="font-light tracking-wide">{feature.text}</span>
            </span>
          ))}
        </div>
      </div>

      {/* See details link positioned lower in the hero */}
      <a
        href="#booking-wizard"
        className="absolute bottom-16 left-1/2 -translate-x-1/2 text-[11px] text-white/70 underline underline-offset-4 decoration-white/30 hover:text-white transition-colors"
      >
        Learn how we keep calls safe & magical
      </a>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" style={{ animationDuration: '2s' }}>
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
          <div className="w-1 h-2 rounded-full bg-white/40 animate-pulse" />
        </div>
      </div>

      {/* Inline keyframes */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
