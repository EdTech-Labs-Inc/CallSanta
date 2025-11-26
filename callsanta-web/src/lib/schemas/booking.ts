import { z } from 'zod';

export const childInfoSchema = z.object({
  childName: z.string().min(1, 'Name is required').max(100),
  childAge: z.number().min(1).max(18),
  childGender: z.enum(['boy', 'girl', 'other']),
  childNationality: z.string().min(1, 'Nationality is required'),
  childInfoText: z.string().max(2000).optional(),
});

export const callConfigSchema = z.object({
  phoneNumber: z.string().min(10, 'Valid phone number required'),
  phoneCountryCode: z.string().min(2).max(5),
  scheduledAt: z.string(), // ISO date string
  timezone: z.string(),
  giftBudget: z.number().min(0).max(1000), // Budget in dollars, 0-1000
});

export const contactSchema = z.object({
  parentEmail: z.string().email('Valid email required'),
  purchaseRecording: z.boolean(),
});

export const bookingSchema = childInfoSchema
  .merge(callConfigSchema)
  .merge(contactSchema);

export type BookingFormData = z.infer<typeof bookingSchema>;
