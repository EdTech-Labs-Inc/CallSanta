'use client';

import { BookingWizard } from '@/components/forms';
import { BookingFormData } from '@/lib/schemas/booking';
import { Snowfall } from '@/components/layout';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Pricing in cents
const PRICING = {
  basePrice: 999, // $9.99
  recordingPrice: 499, // $4.99
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
  // Use FormData to send both JSON data and the audio file
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
    throw new Error('Failed to create booking');
  }

  return response.json();
}

export default function BookPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-santa-green/5 via-white to-santa-red/5">
      <Snowfall />

      {/* Header */}
      <header className="relative z-10 py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center text-santa-green hover:text-santa-red transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <Link href="/" className="text-2xl font-display font-bold text-santa-red">
            Call Santa
          </Link>

          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 py-8 pb-20">
        <BookingWizard
          onSubmit={handleBookingSubmit}
          pricing={PRICING}
        />

        {/* Trust Indicators */}
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-santa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Secure Payment
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-santa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Privacy Protected
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-santa-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Made with Love
            </div>
          </div>
        </div>
      </main>

      {/* Decorative Elements */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </div>
  );
}
