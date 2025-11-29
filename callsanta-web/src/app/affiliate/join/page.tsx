'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';
import { AffiliateLinksPanel } from '@/components/AffiliateLinksPanel';
import {
  getMyAffiliateFromStorage,
  saveMyAffiliateToStorage,
  StoredAffiliate,
} from '@/lib/affiliate/storage';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';
import { Footer } from '@/components/layout';

const joinSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Valid email required'),
  slug: z
    .string()
    .min(3, 'At least 3 characters')
    .max(50, 'Max 50 characters')
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, {
      message: 'Lowercase letters, numbers, and hyphens only',
    }),
});

type JoinFormData = z.infer<typeof joinSchema>;

type SlugStatus = 'idle' | 'checking' | 'available' | 'unavailable';

export default function AffiliateJoinPage() {
  const [existingAffiliate, setExistingAffiliate] =
    useState<StoredAffiliate | null>(null);
  const [createdAffiliate, setCreatedAffiliate] =
    useState<StoredAffiliate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [slugError, setSlugError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
    mode: 'onBlur',
  });

  const watchedSlug = watch('slug');

  // Check for existing affiliate on mount
  useEffect(() => {
    const stored = getMyAffiliateFromStorage();
    if (stored) {
      setExistingAffiliate(stored);
    }
  }, []);

  // Check slug availability on blur
  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugStatus('idle');
      return;
    }

    // Validate format first
    const slugRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    if (!slugRegex.test(slug.toLowerCase())) {
      setSlugStatus('idle');
      return;
    }

    setSlugStatus('checking');
    setSlugError(null);

    try {
      const response = await fetch(
        `/api/affiliates/check-slug?slug=${encodeURIComponent(slug)}`
      );
      const data = await response.json();

      if (data.available) {
        setSlugStatus('available');
        setSlugError(null);
      } else {
        setSlugStatus('unavailable');
        setSlugError(data.reason || 'Slug is not available');
      }
    } catch {
      setSlugStatus('idle');
      setSlugError('Error checking availability');
    }
  }, []);

  const handleSlugBlur = useCallback(async () => {
    const isValid = await trigger('slug');
    if (isValid && watchedSlug) {
      checkSlugAvailability(watchedSlug);
    }
  }, [trigger, watchedSlug, checkSlugAvailability]);

  const onSubmit = async (data: JoinFormData) => {
    // Don't submit if slug is not available
    if (slugStatus !== 'available') {
      setSubmitError('Please choose an available slug');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create affiliate');
      }

      // Save to localStorage
      const storedAffiliate: StoredAffiliate = {
        id: result.affiliate.id,
        slug: result.affiliate.slug,
        public_code: result.affiliate.public_code,
        name: result.affiliate.name,
        links: result.links,
      };

      saveMyAffiliateToStorage(storedAffiliate);
      setCreatedAffiliate(storedAffiliate);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Something went wrong'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user already has an affiliate, show their links
  if (existingAffiliate) {
    return (
      <div className="min-h-screen bg-[#c41e3a]">
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-[#d4a849]">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🎅</div>
              <h1 className="text-2xl font-bold text-[#c41e3a]">
                Welcome Back!
              </h1>
              <p className="text-gray-600 mt-1">
                You&apos;re already an affiliate, {existingAffiliate.name}!
              </p>
            </div>

            <AffiliateLinksPanel
              affiliate={existingAffiliate}
              showHeader={false}
              showBookButton={true}
            />

            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                Not you?{' '}
                <button
                  onClick={() => {
                    setExistingAffiliate(null);
                  }}
                  className="text-[#c41e3a] hover:underline"
                >
                  Create a new affiliate
                </button>
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // If affiliate was just created, show success
  if (createdAffiliate) {
    return (
      <div className="min-h-screen bg-[#c41e3a]">
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-[#d4a849]">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🎉</div>
              <h1 className="text-2xl font-bold text-[#c41e3a]">
                You&apos;re In!
              </h1>
              <p className="text-gray-600 mt-1">
                Share these links to start earning
              </p>
            </div>

            <AffiliateLinksPanel
              affiliate={createdAffiliate}
              showHeader={false}
              showBookButton={true}
            />

            <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <strong>Save these links!</strong> We&apos;ve stored them in your
                  browser, but we recommend copying them somewhere safe too.
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show the join form
  return (
    <div className="min-h-screen bg-[#c41e3a]">
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-[#d4a849]">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🎅</div>
            <h1 className="text-2xl font-bold text-[#c41e3a]">
              Become an Affiliate
            </h1>
            <p className="text-gray-600 mt-1">
              Earn <span className="font-bold text-green-600">20%</span> on
              every booking you refer!
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <Input
                {...register('name')}
                placeholder="Santa Mike"
                className="w-full"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                {...register('email')}
                type="email"
                placeholder="santa@northpole.com"
                className="w-full"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Custom Link
              </label>
              <div className="relative">
                <Input
                  {...register('slug')}
                  onBlur={handleSlugBlur}
                  placeholder="santa-mike"
                  className="w-full pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {slugStatus === 'checking' && (
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  )}
                  {slugStatus === 'available' && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                  {slugStatus === 'unavailable' && (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>

              {/* Preview */}
              {watchedSlug && watchedSlug.length >= 3 && (
                <p className="text-xs text-gray-500 mt-1">
                  santasnumber.com/
                  <span className="font-medium">{watchedSlug.toLowerCase()}</span>
                </p>
              )}

              {/* Errors */}
              {errors.slug && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.slug.message}
                </p>
              )}
              {slugError && slugStatus === 'unavailable' && (
                <p className="text-red-500 text-xs mt-1">{slugError}</p>
              )}
            </div>

            {/* Submit Error */}
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {submitError}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isSubmitting || slugStatus !== 'available'}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create My Affiliate Link'
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-xs text-gray-500 text-center mt-4">
            By creating an affiliate link, you agree to our terms of service.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
