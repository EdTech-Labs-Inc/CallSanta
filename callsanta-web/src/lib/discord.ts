import { Call } from '@/types/database';

// Result interface following email pattern
interface DiscordResult {
  success: boolean;
  error?: string;
}

// Discord embed field
interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

// Discord embed structure
interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  timestamp?: string;
  footer?: { text: string };
}

// Discord webhook message payload
interface DiscordMessage {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

/**
 * Mask phone number for privacy - shows only country code and last 3 digits
 * Example: +1, 234 567 8901 -> +1 ***-***-901
 */
function maskPhoneNumber(phone: string, countryCode: string): string {
  // Get just the digits from the phone number
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 3) {
    return `${countryCode} ***`;
  }

  const lastThree = digits.slice(-3);

  return `${countryCode} ***-***-${lastThree}`;
}

/**
 * Format scheduled time for display
 */
function formatScheduledTime(scheduledAt: string, timezone: string): string {
  try {
    const date = new Date(scheduledAt);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
      timeZoneName: 'short',
    });
  } catch {
    // Fallback if timezone is invalid
    return new Date(scheduledAt).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}

/**
 * Generic Discord webhook sender - reusable for any webhook URL and message
 */
export async function sendDiscordWebhook(
  webhookUrl: string,
  message: DiscordMessage
): Promise<DiscordResult> {
  if (!webhookUrl) {
    console.warn('[Discord] No webhook URL provided, skipping notification');
    return { success: false, error: 'No webhook URL configured' };
  }

  try {
    console.log('[Discord] Sending webhook message...');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Discord] Webhook failed:', response.status, errorText);
      return { success: false, error: `Discord API error: ${response.status}` };
    }

    console.log('[Discord] Webhook sent successfully');
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Discord] Exception sending webhook:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send payment notification to Discord channel
 * Triggered when a new booking payment succeeds
 */
export async function sendPaymentNotification(call: Call): Promise<DiscordResult> {
  const webhookUrl = process.env.DISCORD_SOMEONE_PAID_CHANNEL;

  if (!webhookUrl) {
    console.warn('[Discord] DISCORD_SOMEONE_PAID_CHANNEL not configured, skipping payment notification');
    return { success: false, error: 'DISCORD_SOMEONE_PAID_CHANNEL not configured' };
  }

  const maskedPhone = maskPhoneNumber(call.phone_number, call.phone_country_code);
  const formattedTime = formatScheduledTime(call.scheduled_at, call.timezone);
  const callType = call.call_now ? 'Immediate Call' : 'Scheduled Call';
  const callTypeEmoji = call.call_now ? '\uD83D\uDCDE' : '\uD83D\uDCC5';

  const message: DiscordMessage = {
    username: 'Santa\'s Workshop',
    embeds: [
      {
        title: '\uD83C\uDF85 New Santa Call Booked! \uD83C\uDF84',
        description: 'Another magical moment incoming! The North Pole team is growing stronger with every booking. Keep spreading the holiday cheer! \u2728',
        color: 0x2ecc71, // Christmas green
        fields: [
          {
            name: 'Child',
            value: call.child_name,
            inline: true,
          },
          {
            name: 'Age',
            value: `${call.child_age} years old`,
            inline: true,
          },
          {
            name: 'Phone',
            value: maskedPhone,
            inline: true,
          },
          {
            name: 'Scheduled',
            value: formattedTime,
            inline: false,
          },
          {
            name: 'Type',
            value: `${callTypeEmoji} ${callType}`,
            inline: true,
          },
          {
            name: 'Parent Email',
            value: call.parent_email,
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Santa\'s Number - Spreading Holiday Joy',
        },
      },
    ],
  };

  console.log('[Discord] Sending payment notification for call:', call.id);
  return sendDiscordWebhook(webhookUrl, message);
}
