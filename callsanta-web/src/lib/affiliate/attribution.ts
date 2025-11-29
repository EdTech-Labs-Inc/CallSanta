// Client-side affiliate attribution utilities
// Handles cookie-based tracking for affiliate referrals

const AFFILIATE_COOKIE_NAME = 'cs_aff';
const ATTRIBUTION_WINDOW_DAYS = 30;

export interface AffiliateAttribution {
  code: string;
  timestamp: number;
}

/**
 * Sets affiliate attribution cookie with the given code
 * Cookie expires after ATTRIBUTION_WINDOW_DAYS
 */
export function setAffiliateAttribution(code: string): void {
  if (typeof document === 'undefined') return;

  const expires = new Date();
  expires.setDate(expires.getDate() + ATTRIBUTION_WINDOW_DAYS);

  const attribution: AffiliateAttribution = {
    code,
    timestamp: Date.now(),
  };

  document.cookie = `${AFFILIATE_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(attribution))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Gets the current affiliate attribution from cookie
 * Returns null if no attribution exists or if it's expired
 */
export function getAffiliateAttribution(): AffiliateAttribution | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const affCookie = cookies.find((c) =>
    c.trim().startsWith(`${AFFILIATE_COOKIE_NAME}=`)
  );

  if (!affCookie) return null;

  try {
    const value = decodeURIComponent(affCookie.split('=')[1]);
    const attribution = JSON.parse(value) as AffiliateAttribution;

    // Verify attribution is still within window
    const windowMs = ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() - attribution.timestamp > windowMs) {
      clearAffiliateAttribution();
      return null;
    }

    return attribution;
  } catch {
    return null;
  }
}

/**
 * Clears the affiliate attribution cookie
 */
export function clearAffiliateAttribution(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${AFFILIATE_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Gets just the affiliate code from the cookie, or null if not set/expired
 */
export function getAffiliateCode(): string | null {
  const attribution = getAffiliateAttribution();
  return attribution?.code ?? null;
}
