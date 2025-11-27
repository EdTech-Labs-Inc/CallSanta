import { Resend } from 'resend';
import { Call } from '@/types/database';
import {
  bookingConfirmationTemplate,
  oneHourReminderTemplate,
  postCallWithoutRecordingTemplate,
  postCallWithRecordingTemplate,
  recordingPurchaseConfirmationTemplate,
} from './templates';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || 'Santa <santa@callsanta.com>';

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
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: call.parent_email,
      subject: `Ho Ho Ho! Santa Call Confirmed for ${call.child_name}!`,
      html: bookingConfirmationTemplate(call),
    });

    if (error) {
      console.error('Failed to send booking confirmation email:', error);
      return { success: false, error: error.message };
    }

    console.log(`Booking confirmation email sent for call ${call.id}`);
    return { success: true, id: data?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending booking confirmation email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send one hour reminder email before scheduled call
 */
export async function sendOneHourReminderEmail(call: Call): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: call.parent_email,
      subject: `Reminder: Santa is calling ${call.child_name} in 1 hour!`,
      html: oneHourReminderTemplate(call),
    });

    if (error) {
      console.error('Failed to send reminder email:', error);
      return { success: false, error: error.message };
    }

    console.log(`One hour reminder email sent for call ${call.id}`);
    return { success: true, id: data?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending reminder email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send post-call email with transcript
 * Automatically chooses template based on recording_purchased status
 */
export async function sendPostCallEmail(call: Call): Promise<EmailResult> {
  try {
    const template = call.recording_purchased
      ? postCallWithRecordingTemplate(call)
      : postCallWithoutRecordingTemplate(call);

    const subject = call.recording_purchased
      ? `Santa's Call with ${call.child_name} - Recording Ready!`
      : `Here's What Santa Said to ${call.child_name}!`;

    const { data, error } = await resend.emails.send({
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

/**
 * Send recording purchase confirmation email
 */
export async function sendRecordingPurchaseConfirmationEmail(call: Call): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: call.parent_email,
      subject: `Recording Ready! Download ${call.child_name}'s Santa Call`,
      html: recordingPurchaseConfirmationTemplate(call),
    });

    if (error) {
      console.error('Failed to send recording purchase email:', error);
      return { success: false, error: error.message };
    }

    console.log(`Recording purchase confirmation email sent for call ${call.id}`);
    return { success: true, id: data?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending recording purchase email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
