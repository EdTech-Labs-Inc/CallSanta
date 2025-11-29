import { Call } from '@/types/database';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.santasnumber.com';

// Brand colors matching the website UI
const colors = {
  primaryRed: '#c41e3a',
  darkRed: '#a01830',
  gold: '#d4a849',
  lightGold: '#fff8e7',
  green: '#165B33',
  white: '#ffffff',
  lightGray: '#f8f9fa',
  textDark: '#333333',
  textMuted: '#666666',
  textLight: '#888888',
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
  <title>Santa's Number</title>
</head>
<body style="margin: 0; padding: 0; background: ${colors.primaryRed}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <!-- Outer wrapper with red background -->
  <div style="padding: 40px 20px; background: ${colors.primaryRed};">
    <!-- White card container -->
    <div style="max-width: 600px; margin: 0 auto; background: ${colors.white}; border-radius: 24px; border: 3px solid ${colors.gold}; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
      ${content}
      
      <!-- Footer -->
      <div style="background: ${colors.lightGray}; padding: 30px; text-align: center; border-top: 2px solid ${colors.gold};">
        <p style="margin: 0; font-size: 24px;">🎅🏼</p>
        <p style="color: ${colors.textLight}; font-size: 12px; margin: 10px 0 0;">
          &copy; ${new Date().getFullYear()} Santa's Number. Spreading Christmas magic!
        </p>
        <p style="color: ${colors.textLight}; font-size: 12px; margin: 8px 0 0;">
          Questions? <a href="mailto:questions@santasnumber.com" style="color: ${colors.primaryRed}; text-decoration: none;">questions@santasnumber.com</a>
        </p>
      </div>
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
    <!-- Header with gradient -->
    <div style="background: linear-gradient(135deg, ${colors.primaryRed} 0%, ${colors.darkRed} 100%); padding: 40px 30px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 10px;">🎅🏼</div>
      <h1 style="color: ${colors.white}; font-size: 28px; margin: 0; font-weight: bold;">
        Ho Ho Ho! Booking Confirmed!
      </h1>
      <p style="color: ${colors.gold}; font-size: 16px; margin-top: 10px; margin-bottom: 0;">
        Santa has received the call request for ${call.child_name}
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: ${colors.textDark}; line-height: 1.6; margin: 0 0 24px;">
        Great news! Your Santa call booking has been confirmed. <strong>${call.child_name}</strong> is in for a magical experience! ✨
      </p>

      <!-- Call Details Card -->
      <div style="background: ${colors.lightGray}; border-radius: 16px; padding: 24px; margin: 24px 0; border: 2px solid ${colors.gold};">
        <h3 style="margin: 0 0 20px; color: ${colors.primaryRed}; font-size: 18px; text-align: center;">
          📞 Call Details
        </h3>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: ${colors.textMuted}; width: 130px; font-size: 14px;">Child's Name:</td>
            <td style="padding: 10px 0; color: ${colors.textDark}; font-weight: 600; font-size: 14px;">${call.child_name}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: ${colors.textMuted}; font-size: 14px;">Date:</td>
            <td style="padding: 10px 0; color: ${colors.textDark}; font-weight: 600; font-size: 14px;">${scheduledDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: ${colors.textMuted}; font-size: 14px;">Time:</td>
            <td style="padding: 10px 0; color: ${colors.textDark}; font-weight: 600; font-size: 14px;">${scheduledTime}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: ${colors.textMuted}; font-size: 14px;">Phone Number:</td>
            <td style="padding: 10px 0; color: ${colors.textDark}; font-weight: 600; font-size: 14px;">${call.phone_number}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: ${colors.textMuted}; font-size: 14px;">Recording:</td>
            <td style="padding: 10px 0; color: ${colors.green}; font-weight: 600; font-size: 14px;">✓ Included</td>
          </tr>
        </table>
      </div>

      <!-- What Happens Next -->
      <h3 style="color: ${colors.primaryRed}; font-size: 18px; margin: 30px 0 16px; text-align: center;">
        What Happens Next?
      </h3>

      <div style="background: ${colors.lightGold}; border-radius: 12px; padding: 20px; border-left: 4px solid ${colors.gold};">
        <ol style="color: ${colors.textDark}; line-height: 2; padding-left: 20px; margin: 0; font-size: 14px;">
          <li style="margin-bottom: 8px;">Make sure the phone is available at the scheduled time</li>
          <li style="margin-bottom: 8px;">Santa will call from our special North Pole number</li>
          <li style="margin-bottom: 0;">After the call, you'll receive a transcript and recording by email</li>
        </ol>
      </div>

      <!-- Divider -->
      <hr style="border: none; border-top: 2px solid ${colors.gold}; margin: 30px 0; opacity: 0.3;">

      <p style="text-align: center; color: ${colors.textMuted}; font-size: 14px; margin: 0;">
        We can't wait for ${call.child_name} to talk to Santa! 🎄
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
    <!-- Header with gradient -->
    <div style="background: linear-gradient(135deg, ${colors.primaryRed} 0%, ${colors.darkRed} 100%); padding: 40px 30px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 10px;">🔔</div>
      <h1 style="color: ${colors.white}; font-size: 28px; margin: 0; font-weight: bold;">
        Santa's Calling Soon!
      </h1>
      <p style="color: ${colors.gold}; font-size: 16px; margin-top: 10px; margin-bottom: 0;">
        Just 1 hour until ${call.child_name}'s call with Santa
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; color: ${colors.textDark}; text-align: center; line-height: 1.6; margin: 0 0 24px;">
        Get ready! Santa will be calling <strong>${call.child_name}</strong> in about <strong>1 hour</strong>! 🎅🏼
      </p>

      <!-- Time Badge -->
      <div style="background: ${colors.lightGold}; border: 3px solid ${colors.gold}; border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: ${colors.gold}; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">Scheduled Time</p>
        <p style="margin: 10px 0 0; font-size: 32px; color: ${colors.primaryRed}; font-weight: bold;">${scheduledTime}</p>
      </div>

      <!-- Checklist Card -->
      <div style="background: ${colors.lightGray}; border-radius: 16px; padding: 24px; margin: 24px 0; border: 2px solid ${colors.gold};">
        <h3 style="margin: 0 0 16px; color: ${colors.primaryRed}; font-size: 16px; text-align: center;">
          ✅ Quick Checklist
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: ${colors.textDark}; line-height: 2; font-size: 14px;">
          <li>Make sure the phone (<strong>${call.phone_number}</strong>) is charged and nearby</li>
          <li>Find a quiet space where ${call.child_name} can talk</li>
          <li>Get ${call.child_name} excited - Santa's about to call!</li>
          <li>Have fun watching the magic happen! ✨</li>
        </ul>
      </div>

      <p style="text-align: center; color: ${colors.textMuted}; font-size: 14px; margin-top: 30px;">
        Santa is finishing up at the workshop and getting ready to call! 🎄
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
    <!-- Header with gradient -->
    <div style="background: linear-gradient(135deg, ${colors.primaryRed} 0%, ${colors.darkRed} 100%); padding: 40px 30px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 10px;">🎅🏼</div>
      <h1 style="color: ${colors.white}; font-size: 28px; margin: 0; font-weight: bold;">
        Santa Called ${call.child_name}!
      </h1>
      <p style="color: ${colors.gold}; font-size: 16px; margin-top: 10px; margin-bottom: 0;">
        Your recording is ready to download
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: ${colors.textDark}; line-height: 1.6; margin: 0 0 16px;">
        Ho ho ho! Santa just finished a wonderful conversation with <strong>${call.child_name}</strong>! 🎄
      </p>
      <p style="font-size: 16px; color: ${colors.textDark}; line-height: 1.6; margin: 0 0 24px;">
        Below you'll find the full transcript and links to download the recording.
      </p>

      ${call.call_duration_seconds ? `
      <p style="color: ${colors.textMuted}; font-size: 14px; text-align: center; margin-bottom: 24px;">
        📞 Call duration: ${Math.floor(call.call_duration_seconds / 60)} minutes ${call.call_duration_seconds % 60} seconds
      </p>
      ` : ''}

      <!-- Recording Download Button -->
      <div style="background: ${colors.green}; border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 16px; font-size: 14px; color: ${colors.white}; opacity: 0.9;">🎙️ Your Recording is Ready!</p>
        <a href="${downloadUrl}" style="display: inline-block; background: ${colors.gold}; color: ${colors.textDark}; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px;">
          Download Recording
        </a>
      </div>

      ${videoUrl ? `
      <!-- Video Download Section -->
      <div style="background: linear-gradient(135deg, ${colors.primaryRed} 0%, ${colors.darkRed} 100%); border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center; border: 2px solid ${colors.gold};">
        <p style="margin: 0 0 8px; font-size: 20px; color: ${colors.white};">🎬 NEW: Shareable Video!</p>
        <p style="margin: 0 0 16px; font-size: 14px; color: ${colors.white}; opacity: 0.9;">
          Share ${call.child_name}'s magical moment on TikTok, Instagram Reels, or with family!
        </p>
        <a href="${videoUrl}" style="display: inline-block; background: ${colors.white}; color: ${colors.primaryRed}; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px;">
          Download Video
        </a>
      </div>
      ` : `
      <!-- Video Processing Message -->
      <div style="background: ${colors.lightGray}; border: 2px dashed ${colors.gold}; padding: 20px; border-radius: 16px; margin: 24px 0; text-align: center;">
        <p style="margin: 0; color: ${colors.textMuted}; font-size: 14px;">
          🎬 Your shareable video is being generated and will be ready shortly!
        </p>
      </div>
      `}

      <!-- Transcript Section -->
      <div style="background: ${colors.lightGray}; border-left: 4px solid ${colors.primaryRed}; padding: 24px; margin: 24px 0; border-radius: 0 16px 16px 0;">
        <h3 style="margin: 0 0 16px; color: ${colors.primaryRed}; font-size: 16px;">📝 Call Transcript</h3>
        <div style="color: ${colors.textDark}; line-height: 1.8; white-space: pre-wrap; font-size: 14px;">${call.transcript || 'Transcript will be available shortly...'}</div>
      </div>

      <!-- Divider -->
      <hr style="border: none; border-top: 2px solid ${colors.gold}; margin: 30px 0; opacity: 0.3;">

      <p style="text-align: center; color: ${colors.textMuted}; font-size: 14px; margin: 0;">
        Thank you for choosing Santa's Number! We hope this brought joy to your holiday. ❄️✨
      </p>
    </div>
  `;

  return baseLayout(content);
}
