'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookingFormData, bookingSchema } from '@/lib/schemas/booking';
import { Input, Button, Card } from '@/components/ui';
import { PhoneInput } from './PhoneInput';
import { DateTimePicker } from './DateTimePicker';
import { VoiceRecorder } from './VoiceRecorder';
import { BudgetSlider } from './BudgetSlider';
import { cn } from '@/lib/utils';
import { parsePhoneNumber } from 'react-phone-number-input';
import {
  User,
  Phone,
  Mail,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, ExpressCheckoutElement } from '@stripe/react-stripe-js';

const STEPS = [
  { id: 1, title: "Child's Info", icon: User },
  { id: 2, title: 'Call Details', icon: Phone },
  { id: 3, title: 'Contact & Add-ons', icon: Mail },
  { id: 4, title: 'Review & Pay', icon: Check },
];

const NATIONALITIES = [
  'American', 'British', 'Canadian', 'Australian', 'Irish', 'German',
  'French', 'Spanish', 'Italian', 'Dutch', 'Swedish', 'Norwegian',
  'Danish', 'Finnish', 'Polish', 'Brazilian', 'Mexican', 'Japanese',
  'Chinese', 'Korean', 'Indian', 'Other'
];

interface BookingWizardProps {
  onSubmit: (
    data: BookingFormData,
    voiceFile: File | null
  ) => Promise<{
    callId: string;
    clientSecret: string;
    amount: number;
    currency: string;
    checkoutUrl: string;
  }>;
  pricing: {
    basePrice: number;
    recordingPrice: number;
  };
}

export function BookingWizard({ onSubmit, pricing }: BookingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    callId: string;
    clientSecret: string;
    amount: number;
    currency: string;
    checkoutUrl: string;
  } | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [expressReady, setExpressReady] = useState(false);
  const [preparingPayment, setPreparingPayment] = useState(false);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    mode: 'onChange',
    defaultValues: {
      childName: '',
      childAge: undefined,
      childGender: undefined,
      childNationality: '',
      childInfoText: '',
      phoneNumber: '',
      phoneCountryCode: '',
      scheduledAt: '',
      timezone: '',
      giftBudget: 0,
      parentEmail: '',
      purchaseRecording: false,
    },
  });

  const { control, formState: { errors }, trigger, watch, setValue } = form;

  const purchaseRecording = watch('purchaseRecording');
  const totalPrice = pricing.basePrice + (purchaseRecording ? pricing.recordingPrice : 0);

  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 1:
        return await trigger(['childName', 'childAge', 'childGender', 'childNationality']);
      case 2:
        return await trigger(['phoneNumber', 'scheduledAt', 'timezone', 'giftBudget']);
      case 3:
        return await trigger(['parentEmail']);
      default:
        return true;
    }
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitBookingIfNeeded = async () => {
    if (bookingResult) return bookingResult;

    const data = form.getValues();
    const result = await onSubmit(data, voiceFile);
    setBookingResult(result);
    return result;
  };

  const handleCheckoutRedirect = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    setIsSubmitting(true);
    setWalletError(null);
    try {
      const result = await submitBookingIfNeeded();
      window.location.href = result.checkoutUrl;
    } catch (error) {
      console.error('Booking submission failed:', error);
      setWalletError(error instanceof Error ? error.message : 'Payment failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderExpressCheckout = () => {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg p-3">
          Stripe publishable key is not configured.
        </div>
      );
    }

    if (!bookingResult) {
      return (
        <div className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-3">
          {preparingPayment
            ? 'Preparing Apple Pay / Google Pay options...'
            : 'Complete the form to see payment options.'}
        </div>
      );
    }

    const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret: bookingResult.clientSecret,
          appearance: {
            theme: 'flat',
            variables: { borderRadius: '12px' },
          },
        }}
      >
        <div className="space-y-3">
          <ExpressCheckoutElement
            onReady={({ availablePaymentMethods }) => {
              setExpressReady(Boolean(availablePaymentMethods));
            }}
            onConfirm={async (event) => {
              setIsSubmitting(true);
              setWalletError(null);
              try {
                const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
                if (!stripe) {
                  throw new Error('Failed to initialize Stripe');
                }
                const { error } = await stripe.confirmPayment({
                  clientSecret: bookingResult.clientSecret,
                  confirmParams: {
                    return_url: `${window.location.origin}/success?call_id=${bookingResult.callId}`,
                  },
                  redirect: 'if_required',
                });
                if (error) {
                  event.paymentFailed?.({ reason: 'fail' });
                  setWalletError(error.message || 'Payment failed. Please try again.');
                  setIsSubmitting(false);
                  return;
                }
                window.location.href = `/success?call_id=${bookingResult.callId}`;
              } catch (err) {
                console.error('Express checkout error:', err);
                event.paymentFailed?.({ reason: 'fail' });
                setWalletError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
                setIsSubmitting(false);
              }
            }}
          />
          {!expressReady && (
            <p className="text-sm text-gray-500">
              Wallet buttons appear automatically when available on this device.
            </p>
          )}
        </div>
      </Elements>
    );
  };

  // Automatically prepare payment intent when user reaches the review step so Express Checkout can render immediately.
  useEffect(() => {
    const preparePayment = async () => {
      if (currentStep !== 4 || bookingResult) return;
      const isValid = await form.trigger();
      if (!isValid) return;
      setPreparingPayment(true);
      setWalletError(null);
      try {
        await submitBookingIfNeeded();
      } catch (error) {
        console.error('Booking preparation failed:', error);
        setWalletError(error instanceof Error ? error.message : 'Unable to prepare payment.');
      } finally {
        setPreparingPayment(false);
      }
    };

    void preparePayment();
  }, [currentStep, bookingResult, form, submitBookingIfNeeded]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex-1 relative">
              {/* Connector line */}
              {index > 0 && (
                <div
                  className={cn(
                    "absolute top-5 -left-1/2 w-full h-0.5",
                    currentStep > index ? "bg-santa-green" : "bg-gray-200"
                  )}
                />
              )}

              <div className="relative flex flex-col items-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors"
                  style={{
                    backgroundColor: currentStep > step.id
                      ? '#165B33'
                      : currentStep === step.id
                      ? '#C41E3A'
                      : '#e5e7eb',
                    color: currentStep >= step.id ? 'white' : '#6b7280'
                  }}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className={cn(
                  "mt-2 text-xs font-medium hidden sm:block",
                  currentStep >= step.id ? "text-gray-900" : "text-gray-500"
                )}>
                  {step.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Steps */}
      <Card variant="festive" className="p-8">
        {/* Step 1: Child Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-display font-bold text-gray-900">
                Tell us about the child
              </h2>
              <p className="text-gray-600 mt-1">
                Santa needs to know who he&apos;s calling!
              </p>
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="childAge"
                control={control}
                render={({ field }) => (
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age
                    </label>
                    <select
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-santa-green focus:border-transparent",
                        errors.childAge ? "border-red-500" : "border-gray-300"
                      )}
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

              <Controller
                name="childGender"
                control={control}
                render={({ field }) => (
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={field.value || ''}
                      onChange={field.onChange}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-santa-green focus:border-transparent",
                        errors.childGender ? "border-red-500" : "border-gray-300"
                      )}
                    >
                      <option value="">Select</option>
                      <option value="boy">Boy</option>
                      <option value="girl">Girl</option>
                      <option value="other">Prefer not to say</option>
                    </select>
                    {errors.childGender && (
                      <p className="mt-1 text-sm text-red-500">{errors.childGender.message}</p>
                    )}
                  </div>
                )}
              />
            </div>

            <Controller
              name="childNationality"
              control={control}
              render={({ field }) => (
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nationality
                  </label>
                  <select
                    value={field.value}
                    onChange={field.onChange}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border transition-colors",
                      "focus:outline-none focus:ring-2 focus:ring-santa-green focus:border-transparent",
                      errors.childNationality ? "border-red-500" : "border-gray-300"
                    )}
                  >
                    <option value="">Select nationality</option>
                    {NATIONALITIES.map((nat) => (
                      <option key={nat} value={nat}>{nat}</option>
                    ))}
                  </select>
                  {errors.childNationality && (
                    <p className="mt-1 text-sm text-red-500">{errors.childNationality.message}</p>
                  )}
                </div>
              )}
            />

            <Controller
              name="childInfoText"
              control={control}
              render={({ field }) => (
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    What should Santa know? (optional)
                  </label>
                  <textarea
                    {...field}
                    rows={4}
                    placeholder="Tell Santa about their interests, hobbies, achievements, or anything special..."
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border transition-colors resize-none",
                      "focus:outline-none focus:ring-2 focus:ring-santa-green focus:border-transparent",
                      "placeholder:text-gray-400",
                      "border-gray-300 hover:border-gray-400"
                    )}
                  />
                </div>
              )}
            />

            <VoiceRecorder
              label="Or record a voice message for Santa"
              description="Record yourself telling Santa about the child (recommended!)"
              onRecordingChange={setVoiceFile}
            />
          </div>
        )}

        {/* Step 2: Call Configuration */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-display font-bold text-gray-900">
                Schedule the call
              </h2>
              <p className="text-gray-600 mt-1">
                When should Santa ring?
              </p>
            </div>

            <Controller
              name="phoneNumber"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value || '');
                    // Extract country calling code properly using parsePhoneNumber
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

            <Controller
              name="giftBudget"
              control={control}
              render={({ field }) => (
                <BudgetSlider
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.giftBudget?.message}
                />
              )}
            />
          </div>
        )}

        {/* Step 3: Contact & Add-ons */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-display font-bold text-gray-900">
                Almost there!
              </h2>
              <p className="text-gray-600 mt-1">
                Where should we send the call details?
              </p>
            </div>

            <Controller
              name="parentEmail"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="email"
                  label="Parent's Email"
                  placeholder="you@example.com"
                  error={errors.parentEmail?.message}
                />
              )}
            />

            <p className="text-sm text-gray-500">
              We&apos;ll send you a transcript of Santa&apos;s call after it happens.
            </p>

            {/* Recording Add-on */}
            <div className="bg-gradient-to-r from-santa-green/10 to-santa-red/10 rounded-xl p-6 border-2 border-dashed border-santa-gold/50">
              <Controller
                name="purchaseRecording"
                control={control}
                render={({ field }) => (
                  <label className="flex items-start gap-4 cursor-pointer">
                    <div className="flex-shrink-0 pt-1">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-5 h-5 rounded text-santa-green focus:ring-santa-green"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          Keep the Recording Forever
                        </span>
                        <span className="font-bold text-santa-green">
                          +${(pricing.recordingPrice / 100).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Receive a downloadable audio file of Santa&apos;s call - the perfect keepsake to treasure for years to come!
                      </p>
                    </div>
                  </label>
                )}
              />
            </div>
          </div>
        )}

        {/* Step 4: Review & Pay */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-display font-bold text-gray-900">
                Review your booking
              </h2>
              <p className="text-gray-600 mt-1">
                Let&apos;s make sure everything looks right
              </p>
            </div>

            <div className="space-y-4">
              <ReviewSection title="Child's Information">
                <ReviewItem label="Name" value={watch('childName')} />
                <ReviewItem label="Age" value={`${watch('childAge')} years old`} />
                <ReviewItem label="Nationality" value={watch('childNationality')} />
              </ReviewSection>

              <ReviewSection title="Call Details">
                <ReviewItem label="Phone" value={watch('phoneNumber')} />
                <ReviewItem
                  label="When"
                  value={watch('scheduledAt') ? new Date(watch('scheduledAt')).toLocaleString() : 'Call Now'}
                />
                <ReviewItem
                  label="Gift Budget"
                  value={watch('giftBudget') > 0 ? `Up to $${watch('giftBudget')}` : 'No specific budget'}
                />
              </ReviewSection>

              <ReviewSection title="Contact">
                <ReviewItem label="Email" value={watch('parentEmail')} />
              </ReviewSection>
            </div>

            {/* Pricing Summary */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Santa Call</span>
                  <span className="font-medium">${(pricing.basePrice / 100).toFixed(2)}</span>
                </div>
                {purchaseRecording && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Call Recording</span>
                    <span className="font-medium">${(pricing.recordingPrice / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-lg font-bold text-santa-green">
                      ${(totalPrice / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {walletError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                {walletError}
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={prevStep}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={nextStep}
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">{renderExpressCheckout()}</div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCheckoutRedirect}
                disabled={isSubmitting}
                size="lg"
              >
                Pay with Card (Stripe Checkout)
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="font-medium text-gray-900 mb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900">{value || '-'}</span>
    </div>
  );
}
