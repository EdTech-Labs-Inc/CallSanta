import { Resend } from 'resend';
import { Call } from '@/types/database';
import {
  bookingConfirmationTemplate,
  oneHourReminderTemplate,
  postCallTemplate,
} from './templates';

// Lazy initialize Resend client to avoid build-time errors
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

// Hardcode the email to avoid any env var issues
// The env var might have invisible characters or encoding issues
const DEFAULT_EMAIL_FROM = 'Santa <santa@santasnumber.com>';

function getEmailFrom(): string {
  const envValue = process.env.EMAIL_FROM;

  // Log for debugging
  console.log('[Email] EMAIL_FROM env var raw value:', JSON.stringify(envValue));
  console.log('[Email] EMAIL_FROM env var length:', envValue?.length);

  // If env var is empty, undefined, or has issues, use hardcoded default
  if (!envValue || envValue.trim() === '') {
    console.log('[Email] Using hardcoded default:', DEFAULT_EMAIL_FROM);
    return DEFAULT_EMAIL_FROM;
  }

  // Strip quotes if present (common mistake when setting env vars)
  // Also trim whitespace
  let cleaned = envValue.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
    console.log('[Email] Stripped quotes from EMAIL_FROM:', cleaned);
  }

  // Validate the format: should be "Name <email@domain.com>" or "email@domain.com"
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const namedEmailRegex = /^.+\s*<[^\s@]+@[^\s@]+\.[^\s@]+>$/;

  if (emailRegex.test(cleaned) || namedEmailRegex.test(cleaned)) {
    console.log('[Email] Using validated env var:', cleaned);
    return cleaned;
  }

  console.warn('[Email] Invalid EMAIL_FROM format, using default. Got:', JSON.stringify(cleaned));
  return DEFAULT_EMAIL_FROM;
}

const EMAIL_FROM = getEmailFrom();
console.log('[Email] Final EMAIL_FROM:', EMAIL_FROM);

interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send booking confirmation email after successful payment
 */
export async function sendBookingConfirmationEmail(call: Call): Promise<EmailResult> {
  try {
    const emailPayload = {
      from: EMAIL_FROM,
      to: call.parent_email,
      subject: `Ho Ho Ho! Santa Call Confirmed for ${call.child_name}!`,
    };

    console.log('[Email] sendBookingConfirmationEmail - Payload:', JSON.stringify(emailPayload, null, 2));
    console.log('[Email] sendBookingConfirmationEmail - Call ID:', call.id);
    console.log('[Email] sendBookingConfirmationEmail - parent_email:', call.parent_email);

    const { data, error } = await getResendClient().emails.send({
      ...emailPayload,
      html: bookingConfirmationTemplate(call),
    });

    if (error) {
      console.error('[Email] sendBookingConfirmationEmail - Resend error:', JSON.stringify(error, null, 2));
      return { success: false, error: error.message };
    }

    console.log(`[Email] Booking confirmation email sent for call ${call.id}, email_id: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] sendBookingConfirmationEmail - Exception:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send one hour reminder email before scheduled call
 */
export async function sendOneHourReminderEmail(call: Call): Promise<EmailResult> {
  try {
    const emailPayload = {
      from: EMAIL_FROM,
      to: call.parent_email,
      subject: `Reminder: Santa is calling ${call.child_name} in 1 hour!`,
    };

    console.log('[Email] sendOneHourReminderEmail - Payload:', JSON.stringify(emailPayload, null, 2));
    console.log('[Email] sendOneHourReminderEmail - Call ID:', call.id);
    console.log('[Email] sendOneHourReminderEmail - parent_email:', call.parent_email);
    console.log('[Email] sendOneHourReminderEmail - scheduled_at:', call.scheduled_at);

    const { data, error } = await getResendClient().emails.send({
      ...emailPayload,
      html: oneHourReminderTemplate(call),
    });

    if (error) {
      console.error('[Email] sendOneHourReminderEmail - Resend error:', JSON.stringify(error, null, 2));
      return { success: false, error: error.message };
    }

    console.log(`[Email] One hour reminder email sent for call ${call.id}, email_id: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] sendOneHourReminderEmail - Exception:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send post-call email with transcript and recording download link
 */
export async function sendPostCallEmail(call: Call): Promise<EmailResult> {
  try {
    const template = postCallTemplate(call);
    const subject = `Santa's Call with ${call.child_name} - Recording Ready!`;

    const { data, error } = await getResendClient().emails.send({
      from: EMAIL_FROM,
      to: call.parent_email,
      subject,
      html: template,
    });

    if (error) {
      console.error('Failed to send post-call email:', error);
      return { success: false, error: error.message };
    }

    console.log(`Post-call email sent for call ${call.id}`);
    return { success: true, id: data?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending post-call email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
