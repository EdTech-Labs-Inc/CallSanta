/**
 * Email sending for video worker
 */

import { Resend } from 'resend';
import type { Call } from './types';
import { log } from './logger';

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.santasnumber.com';

export async function sendPostCallEmail(call: Call, videoUrl: string): Promise<void> {
  if (!call.parent_email) {
    log('EMAIL', 'No parent email found, skipping email');
    return;
  }

  log('EMAIL', `Preparing email for ${call.parent_email}`);

  const downloadUrl = `${APP_URL}/recording/${call.id}`;
  const videoPageUrl = `${APP_URL}/recording/${call.id}?tab=video`;

  const durationText = call.call_duration_seconds
    ? `${Math.floor(call.call_duration_seconds / 60)} minutes ${call.call_duration_seconds % 60} seconds`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
    <div style="background: linear-gradient(135deg, #C41E3A 0%, #8B0000 100%); padding: 40px 20px; text-align: center;">
      <span style="font-size: 24px;">🎅</span>
      <h1 style="color: #ffffff; font-size: 28px; margin: 10px 0; font-weight: bold;">Santa Called ${call.child_name}!</h1>
      <p style="color: #FFD700; font-size: 16px; margin: 0;">Your recording & video are ready!</p>
    </div>

    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #333; line-height: 1.6;">
        Ho ho ho! Santa just finished a wonderful conversation with ${call.child_name}!
      </p>

      ${durationText ? `<p style="color: #666; font-size: 14px;">Call duration: ${durationText}</p>` : ''}

      <div style="background: #165B33; color: #ffffff; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 16px; font-size: 14px; opacity: 0.9;">🎙️ Audio Recording</p>
        <a href="${downloadUrl}" style="display: inline-block; background: #FFD700; color: #333; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Download Recording
        </a>
      </div>

      <div style="background: linear-gradient(135deg, #C41E3A 0%, #8B0000 100%); color: #ffffff; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 20px;">🎬 Shareable Video Ready!</p>
        <p style="margin: 0 0 16px; font-size: 14px; opacity: 0.9;">
          Share ${call.child_name}'s magical moment on TikTok, Instagram Reels, or with family!
        </p>
        <a href="${videoPageUrl}" style="display: inline-block; background: #ffffff; color: #C41E3A; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Download Video
        </a>
      </div>

      ${call.transcript ? `
      <div style="background: #f8f9fa; border-left: 4px solid #C41E3A; padding: 24px; margin: 24px 0; border-radius: 0 8px 8px 0;">
        <h3 style="margin: 0 0 16px; color: #C41E3A; font-size: 16px;">📝 Call Transcript</h3>
        <div style="color: #444; line-height: 1.8; white-space: pre-wrap; font-size: 14px;">${call.transcript}</div>
      </div>
      ` : ''}

      <p style="text-align: center; color: #888; font-size: 14px;">
        Thank you for choosing Call Santa! We hope this brought joy to your holiday. ❄️
      </p>
    </div>

    <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eee;">
      <p style="color: #888; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Call Santa. Spreading Christmas magic!</p>
      <p style="color: #888; font-size: 12px; margin-top: 10px;">
        Questions? Contact us at <a href="mailto:questions@santasnumber.com" style="color: #C41E3A;">questions@santasnumber.com</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    log('EMAIL', 'Sending via Resend...');
    await resend.emails.send({
      from: 'Santa <santa@santasnumber.com>',
      to: call.parent_email,
      subject: `🎅 Santa's Call with ${call.child_name} - Recording & Video Ready!`,
      html,
    });
    log('EMAIL', `Email sent successfully to ${call.parent_email}`);
  } catch (err) {
    log('EMAIL', `Failed to send email: ${err}`);
    // Don't throw - email failure shouldn't fail the job
  }
}
