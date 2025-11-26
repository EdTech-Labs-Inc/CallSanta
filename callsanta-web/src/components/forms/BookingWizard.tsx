'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookingFormData, bookingSchema } from '@/lib/schemas/booking';
import { Input, Button } from '@/components/ui';
import { PhoneInput } from './PhoneInput';
import { DateTimePicker } from './DateTimePicker';
import { VoiceRecorder } from './VoiceRecorder';
import { parsePhoneNumber } from 'react-phone-number-input';
import { CreditCard, Loader2, Mic } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';

type BookingResult = {
  callId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  checkoutUrl: string;
};

type PricingInfo = {
  basePrice: number;
  recordingPrice?: number;
};

interface BookingWizardProps {
  onSubmit: (data: BookingFormData, voiceFile: File | null) => Promise<BookingResult>;
  pricing: PricingInfo;
}

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export function BookingWizard({ onSubmit, pricing }: BookingWizardProps) {
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [expressReady, setExpressReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [showVoice, setShowVoice] = useState(false);
  const [preparingPayment, setPreparingPayment] = useState(false);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      childName: '',
      childAge: undefined,
      childInfoText: '',
      phoneNumber: '',
      phoneCountryCode: '',
      scheduledAt: '',
      timezone: '',
      parentEmail: '',
      purchaseRecording: false,
    },
  });

  const { control, handleSubmit, formState: { errors }, setValue, watch, trigger } = form;
  const watchedValues = watch();

  const preparePayment = useCallback(async (values: BookingFormData) => {
    setIsSubmitting(true);
    setFlowError(null);
    try {
      const normalized = { ...values, purchaseRecording: values.purchaseRecording ?? false };
      const result = await onSubmit(normalized, voiceFile);
      setBookingResult(result);
    } catch (error) {
      console.error('Booking creation failed:', error);
      setFlowError(error instanceof Error ? error.message : 'Unable to create booking.');
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, voiceFile]);

  const handleCheckoutRedirect = () => {
    if (!bookingResult) return;
    setFlowError(null);
    setIsSubmitting(true);
    window.location.href = bookingResult.checkoutUrl;
  };

  // Automatically prepare payment options when required fields are filled and valid
  useEffect(() => {
    const autoPrepare = async () => {
      if (bookingResult || preparingPayment || isSubmitting) return;

      const hasRequired =
        Boolean(watchedValues.childName) &&
        Boolean(watchedValues.childAge) &&
        Boolean(watchedValues.phoneNumber) &&
        Boolean(watchedValues.scheduledAt) &&
        Boolean(watchedValues.timezone) &&
        Boolean(watchedValues.parentEmail);

      if (!hasRequired) return;

      setPreparingPayment(true);
      const valid = await trigger([
        'childName',
        'childAge',
        'phoneNumber',
        'scheduledAt',
        'timezone',
        'parentEmail',
      ]);

      if (valid) {
        await handleSubmit(preparePayment)();
      }

      setPreparingPayment(false);
    };

    void autoPrepare();
  }, [
    bookingResult,
    handleSubmit,
    isSubmitting,
    preparePayment,
    preparingPayment,
    trigger,
    watchedValues.childAge,
    watchedValues.childName,
    watchedValues.parentEmail,
    watchedValues.phoneNumber,
    watchedValues.scheduledAt,
    watchedValues.timezone,
  ]);

  const totalDisplay = useMemo(
    () => `$${((pricing.basePrice + (watchedValues.purchaseRecording ? pricing.recordingPrice ?? 0 : 0)) / 100).toFixed(2)}`,
    [pricing.basePrice, pricing.recordingPrice, watchedValues.purchaseRecording]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2 px-0 sm:px-0">
        <h2 className="text-2xl font-semibold text-gray-900">Schedule &amp; Pay</h2>
        <p className="text-gray-600">
          Give Santa some details so he knows when and who to call.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-2 px-0 sm:px-0">
        <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit(preparePayment)}>
          <div className="space-y-6 rounded-xl border border-gray-200 p-4 sm:p-5 bg-white shadow-sm w-full">
            <p className="text-sm font-semibold text-gray-900">Contact</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="childName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Child's Name"
                    placeholder="Enter first name"
                    error={errors.childName?.message}
                  />
                )}
              />

              <Controller
                name="childAge"
                control={control}
                render={({ field }) => (
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age
                    </label>
                    <select
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent border-gray-300 bg-white"
                    >
                      <option value="">Select age</option>
                      {Array.from({ length: 18 }, (_, i) => i + 1).map((age) => (
                        <option key={age} value={age}>{age} years old</option>
                      ))}
                    </select>
                    {errors.childAge && (
                      <p className="mt-1 text-sm text-red-500">{errors.childAge.message}</p>
                    )}
                  </div>
                )}
              />
            </div>

            <Controller
              name="phoneNumber"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value ?? '');
                    if (value) {
                      const parsed = parsePhoneNumber(value);
                      if (parsed?.countryCallingCode) {
                        setValue('phoneCountryCode', `+${parsed.countryCallingCode}`);
                      }
                    }
                  }}
                  label="Phone Number"
                  error={errors.phoneNumber?.message}
                />
              )}
            />

            <Controller
              name="parentEmail"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="email"
                  label="Your Email"
                  placeholder="you@example.com"
                  error={errors.parentEmail?.message}
                />
              )}
            />
          </div>

          <div className="space-y-4 rounded-xl border border-gray-200 p-4 sm:p-5 bg-white shadow-sm w-full">
            <p className="text-sm font-semibold text-gray-900">Time</p>
            <Controller
              name="scheduledAt"
              control={control}
              render={({ field }) => (
                <Controller
                  name="timezone"
                  control={control}
                  render={({ field: tzField }) => (
                    <DateTimePicker
                      value={field.value}
                      onChange={field.onChange}
                      onTimezoneChange={tzField.onChange}
                      label="When should Santa call?"
                      error={errors.scheduledAt?.message}
                    />
                  )}
                />
              )}
            />
          </div>

          <div className="space-y-4 rounded-xl border border-gray-200 p-4 sm:p-5 bg-white shadow-sm w-full">
            <p className="text-sm font-semibold text-gray-900">Notes</p>
            <Controller
              name="childInfoText"
              control={control}
              render={({ field }) => (
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes for Santa (optional)
                  </label>
                  <textarea
                    {...field}
                    rows={4}
                    placeholder="Interests, wins, anything Santa should mention."
                    className="w-full px-4 py-3 rounded-lg border transition-colors resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 border-gray-300 bg-white"
                  />
                </div>
              )}
            />

            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-gray-700">
                  Prefer voice? Add a quick note.
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="bg-black text-white hover:bg-gray-800"
                  onClick={() => setShowVoice((prev) => !prev)}
                  aria-label={showVoice ? 'Hide voice recorder' : 'Add voice note'}
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
              {showVoice && (
                <div className="mt-3">
                  <VoiceRecorder
                    onRecordingChange={setVoiceFile}
                    description="Record up to 2 minutes."
                    maxDuration={120}
                  />
                </div>
              )}
            </div>
          </div>

          {flowError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {flowError}
            </div>
          )}

          <p className="text-xs text-gray-500">
            {preparingPayment && ' Preparing payment…'}
          </p>
        </form>

        <div className="space-y-4 border border-gray-200 rounded-lg p-4 sm:p-5 bg-white lg:bg-gray-50 w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Payment</h3>
            <span className="text-2xl font-bold text-gray-900">{totalDisplay}</span>
          </div>

            {bookingResult ? (
              <div className="space-y-4">
                {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && stripePromise ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret: bookingResult.clientSecret,
                      appearance: { theme: 'flat', variables: { colorPrimaryText: '#111' } },
                    }}
                  >
                    <div className="space-y-3">
                      <ExpressCheckoutWrapper
                        bookingResult={bookingResult}
                        setFlowError={setFlowError}
                        setIsSubmitting={setIsSubmitting}
                        setExpressReady={setExpressReady}
                      />
                      {!expressReady && (
                        <p className="text-xs text-gray-500">
                          Apple Pay / Google Pay appears automatically if supported.
                        </p>
                      )}
                    </div>
                  </Elements>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg p-3">
                    Stripe keys missing; payment buttons unavailable.
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-300" />
                  <span className="text-xs uppercase tracking-wide text-gray-400">or</span>
                  <div className="flex-1 h-px bg-gray-300" />
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCheckoutRedirect}
                  disabled={isSubmitting}
                  className="w-full bg-gray-200 text-gray-800 border border-gray-300 hover:bg-gray-300"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  Pay with card
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Payment buttons appear once the form is complete and validated.
              </p>
            )}
          </div>
        </div>
      </div>
  );
}

function ExpressCheckoutWrapper({
  bookingResult,
  setFlowError,
  setIsSubmitting,
  setExpressReady,
}: {
  bookingResult: {
    callId: string;
    clientSecret: string;
  };
  setFlowError: (value: string | null) => void;
  setIsSubmitting: (value: boolean) => void;
  setExpressReady: (value: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  return (
    <ExpressCheckoutElement
      onReady={({ availablePaymentMethods }) => {
        setExpressReady(Boolean(availablePaymentMethods));
      }}
      onConfirm={async (event) => {
        if (!stripe || !elements) {
          event.paymentFailed?.({ reason: 'fail' });
          setFlowError('Payment is not ready yet. Please try again.');
          return;
        }

        setIsSubmitting(true);
        setFlowError(null);
        try {
          const { error } = await stripe.confirmPayment({
            elements,
            clientSecret: bookingResult.clientSecret,
            confirmParams: {
              return_url: `${window.location.origin}/success?call_id=${bookingResult.callId}`,
            },
            redirect: 'if_required',
          });

          if (error) {
            event.paymentFailed?.({ reason: 'fail' });
            setFlowError(error.message || 'Payment failed. Please try again.');
            setIsSubmitting(false);
            return;
          }

          window.location.href = `/success?call_id=${bookingResult.callId}`;
        } catch (err) {
          console.error('Express checkout error:', err);
          event.paymentFailed?.({ reason: 'fail' });
          setFlowError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
          setIsSubmitting(false);
        }
      }}
    />
  );
}
