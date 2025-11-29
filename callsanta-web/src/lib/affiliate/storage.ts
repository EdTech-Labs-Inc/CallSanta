// localStorage helpers for storing the user's own affiliate data
// This is separate from attribution tracking (which uses cookies)

const AFFILIATE_STORAGE_KEY = 'cs_my_affiliate';

export interface StoredAffiliate {
  id: string;
  slug: string;
  public_code: string;
  name: string;
  links: {
    direct: string;
    withCode: string;
  };
}

/**
 * Save the user's affiliate data to localStorage
 */
export function saveMyAffiliateToStorage(affiliate: StoredAffiliate): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(AFFILIATE_STORAGE_KEY, JSON.stringify(affiliate));
  } catch (error) {
    console.error('Failed to save affiliate to storage:', error);
  }
}

/**
 * Get the user's affiliate data from localStorage
 */
export function getMyAffiliateFromStorage(): StoredAffiliate | null {
  if (typeof window === 'undefined') return null;

  try {
    const data = localStorage.getItem(AFFILIATE_STORAGE_KEY);
    if (!data) return null;

    return JSON.parse(data) as StoredAffiliate;
  } catch (error) {
    console.error('Failed to read affiliate from storage:', error);
    return null;
  }
}

/**
 * Clear the user's affiliate data from localStorage
 */
export function clearMyAffiliateFromStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(AFFILIATE_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear affiliate from storage:', error);
  }
}

/**
 * Check if the user has affiliate data stored
 */
export function hasMyAffiliateInStorage(): boolean {
  return getMyAffiliateFromStorage() !== null;
}
