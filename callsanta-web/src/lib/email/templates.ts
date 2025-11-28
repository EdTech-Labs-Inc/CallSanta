import { Call } from '@/types/database';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.santasnumber.com';

// Shared styles
const styles = {
  container: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;',
  header: 'background: linear-gradient(135deg, #C41E3A 0%, #8B0000 100%); padding: 40px 20px; text-align: center;',
  headerTitle: 'color: #ffffff; font-size: 28px; margin: 0; font-weight: bold;',
  headerSubtitle: 'color: #FFD700; font-size: 16px; margin-top: 8px;',
  content: 'padding: 40px 30px;',
  card: 'background: #f8f9fa; border-radius: 12px; padding: 24px; margin: 20px 0;',
  detailRow: 'display: flex; margin: 12px 0; align-items: flex-start;',
  detailLabel: 'color: #666; font-size: 14px; min-width: 120px;',
  detailValue: 'color: #333; font-size: 14px; font-weight: 500;',
  button: 'display: inline-block; background: #C41E3A; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;',
  buttonGreen: 'display: inline-block; background: #165B33; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;',
  footer: 'background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eee;',
  footerText: 'color: #888; font-size: 12px; margin: 0;',
  divider: 'border: none; border-top: 1px solid #eee; margin: 30px 0;',
  snowflake: 'font-size: 24px;',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(dateStr: string, timezone?: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
    timeZoneName: 'short',
  });
}

function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Call Santa</title>
</head>
<body style="margin: 0; padding: 0; background: #f5f5f5;">
  <div style="${styles.container}">
    ${content}
    <div style="${styles.footer}">
      <p style="${styles.footerText}">
        &copy; ${new Date().getFullYear()} Call Santa. Spreading Christmas magic!
      </p>
      <p style="${styles.footerText}; margin-top: 10px;">
        Questions? Contact us at <a href="mailto:questions@santasnumber.com" style="color: #C41E3A;">questions@santasnumber.com</a>
      </p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Booking Confirmation Email
 * Sent after successful payment
 */
export function bookingConfirmationTemplate(call: Call): string {
  const scheduledDate = formatDate(call.scheduled_at);
  const scheduledTime = formatTime(call.scheduled_at, call.timezone);

  const content = `
    <div style="${styles.header}">
      <span style="${styles.snowflake}">&#10052;</span>
      <h1 style="${styles.headerTitle}">Ho Ho Ho! Booking Confirmed!</h1>
      <p style="${styles.headerSubtitle}">Santa has received the call request for ${call.child_name}</p>
    </div>

    <div style="${styles.content}">
      <p style="font-size: 16px; color: #333; line-height: 1.6;">
        Great news! Your Santa call booking has been confirmed. ${call.child_name} is in for a magical experience!
      </p>

      <div style="${styles.card}">
        <h3 style="margin: 0 0 16px; color: #C41E3A; font-size: 18px;">Call Details</h3>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; width: 130px;">Child's Name:</td>
            <td style="padding: 8px 0; color: #333; font-weight: 500;">${call.child_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Date:</td>
            <td style="padding: 8px 0; color: #333; font-weight: 500;">${scheduledDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Time:</td>
            <td style="padding: 8px 0; color: #333; font-weight: 500;">${scheduledTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Phone Number:</td>
            <td style="padding: 8px 0; color: #333; font-weight: 500;">${call.phone_number}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Recording:</td>
            <td style="padding: 8px 0; color: #165B33; font-weight: 500;">&#10003; Included</td>
          </tr>
        </table>
      </div>

      <h3 style="color: #333; font-size: 18px; margin-top: 30px;">What Happens Next?</h3>

      <ol style="color: #555; line-height: 1.8; padding-left: 20px;">
        <li style="margin-bottom: 10px;">Make sure the phone is available at the scheduled time</li>
        <li style="margin-bottom: 10px;">Santa will call from our special North Pole number</li>
        <li style="margin-bottom: 10px;">After the call, you'll receive a transcript and recording by email</li>
      </ol>

      <hr style="${styles.divider}">

      <p style="text-align: center; color: #888; font-size: 14px;">
        We can't wait for ${call.child_name} to talk to Santa! &#127877;
      </p>
    </div>
  `;

  return baseLayout(content);
}

/**
 * One Hour Reminder Email
 * Sent 1 hour before scheduled call
 */
export function oneHourReminderTemplate(call: Call): string {
  const scheduledTime = formatTime(call.scheduled_at, call.timezone);

  const content = `
    <div style="${styles.header}">
      <span style="${styles.snowflake}">&#128276;</span>
      <h1 style="${styles.headerTitle}">Santa's Calling Soon!</h1>
      <p style="${styles.headerSubtitle}">Just 1 hour until ${call.child_name}'s call with Santa</p>
    </div>

    <div style="${styles.content}">
      <p style="font-size: 18px; color: #333; text-align: center; line-height: 1.6;">
        Get ready! Santa will be calling <strong>${call.child_name}</strong> in about <strong>1 hour</strong>!
      </p>

      <div style="background: #FFF8E7; border: 2px solid #FFD700; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #B8860B;">SCHEDULED TIME</p>
        <p style="margin: 8px 0 0; font-size: 28px; color: #333; font-weight: bold;">${scheduledTime}</p>
      </div>

      <div style="${styles.card}">
        <h3 style="margin: 0 0 16px; color: #C41E3A; font-size: 16px;">Quick Checklist</h3>
        <ul style="margin: 0; padding-left: 20px; color: #555; line-height: 2;">
          <li>Make sure the phone (<strong>${call.phone_number}</strong>) is charged and nearby</li>
          <li>Find a quiet space where ${call.child_name} can talk</li>
          <li>Get ${call.child_name} excited - Santa's about to call!</li>
          <li>Have fun watching the magic happen! &#10024;</li>
        </ul>
      </div>

      <p style="text-align: center; color: #888; font-size: 14px; margin-top: 30px;">
        Santa is finishing up at the workshop and getting ready to call! &#127877;
      </p>
    </div>
  `;

  return baseLayout(content);
}

/**
 * Post-Call Email
 * Sent after call completes with transcript and recording download link
 */
export function postCallTemplate(call: Call): string {
  const downloadUrl = `${APP_URL}/recording/${call.id}`;
  const videoUrl = call.video_url ? `${APP_URL}/recording/${call.id}?tab=video` : null;

  const content = `
    <div style="${styles.header}">
      <span style="${styles.snowflake}">&#127877;</span>
      <h1 style="${styles.headerTitle}">Santa Called ${call.child_name}!</h1>
      <p style="${styles.headerSubtitle}">Your recording is ready to download</p>
    </div>

    <div style="${styles.content}">
      <p style="font-size: 16px; color: #333; line-height: 1.6;">
        Ho ho ho! Santa just finished a wonderful conversation with ${call.child_name}!
        Below you'll find the full transcript and links to download the recording.
      </p>

      ${call.call_duration_seconds ? `
      <p style="color: #666; font-size: 14px;">
        Call duration: ${Math.floor(call.call_duration_seconds / 60)} minutes ${call.call_duration_seconds % 60} seconds
      </p>
      ` : ''}

      <div style="background: #165B33; color: #ffffff; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 16px; font-size: 14px; opacity: 0.9;">&#127908; Your Recording is Ready!</p>
        <a href="${downloadUrl}" style="${styles.button}; background: #FFD700; color: #333;">
          Download Recording
        </a>
      </div>

      ${videoUrl ? `
      <div style="background: linear-gradient(135deg, #C41E3A 0%, #8B0000 100%); color: #ffffff; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 20px;">&#127909; NEW: Shareable Video!</p>
        <p style="margin: 0 0 16px; font-size: 14px; opacity: 0.9;">
          Share ${call.child_name}'s magical moment on TikTok, Instagram Reels, or with family!
        </p>
        <a href="${videoUrl}" style="${styles.button}; background: #ffffff; color: #C41E3A;">
          Download Video
        </a>
      </div>
      ` : `
      <div style="background: #f8f9fa; border: 2px dashed #ddd; padding: 20px; border-radius: 12px; margin: 24px 0; text-align: center;">
        <p style="margin: 0; color: #666; font-size: 14px;">
          &#127909; Your shareable video is being generated and will be ready shortly!
        </p>
      </div>
      `}

      <div style="background: #f8f9fa; border-left: 4px solid #C41E3A; padding: 24px; margin: 24px 0; border-radius: 0 8px 8px 0;">
        <h3 style="margin: 0 0 16px; color: #C41E3A; font-size: 16px;">&#128221; Call Transcript</h3>
        <div style="color: #444; line-height: 1.8; white-space: pre-wrap; font-size: 14px;">${call.transcript || 'Transcript will be available shortly...'}</div>
      </div>

      <p style="text-align: center; color: #888; font-size: 14px;">
        Thank you for choosing Call Santa! We hope this brought joy to your holiday. &#10052;
      </p>
    </div>
  `;

  return baseLayout(content);
}
