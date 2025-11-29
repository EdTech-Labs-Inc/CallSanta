import { z } from 'zod';

export const bookingSchema = z.object({
  childName: z.string().min(1, 'Name is required').max(100),
  childAge: z.number().min(1),
  childInfoText: z.string().max(2000).optional(),
  phoneNumber: z.string().min(10, 'Valid phone number required'),
  phoneCountryCode: z.string().min(2).max(5),
  scheduledAt: z.string().min(1, 'Scheduled time is required'), // ISO date string
  timezone: z.string().min(1, 'Timezone is required'),
  parentEmail: z.string().email('Valid email required'),
  purchaseRecording: z.boolean().optional(),
  callNow: z.boolean().optional(),
  utmSource: z.string().nullable().optional(),
});

export type BookingFormData = z.infer<typeof bookingSchema>;
