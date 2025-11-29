'use client';

import { useEffect, useState } from 'react';
import {
  setAffiliateAttribution,
  getAffiliateAttribution,
} from '@/lib/affiliate/attribution';

/**
 * Hook to manage affiliate attribution
 *
 * - Checks URL for ?aff= parameter on mount
 * - If present, sets attribution cookie (last-click wins)
 * - Returns current affiliate code for use in booking
 */
export function useAffiliateAttribution(): string | null {
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);

  useEffect(() => {
    // Check URL for ?aff= parameter
    const params = new URLSearchParams(window.location.search);
    const affParam = params.get('aff');

    if (affParam) {
      // New affiliate attribution - set cookie (last-click wins)
      setAffiliateAttribution(affParam);
      setAffiliateCode(affParam);
    } else {
      // Check existing attribution cookie
      const existing = getAffiliateAttribution();
      if (existing) {
        setAffiliateCode(existing.code);
      }
    }
  }, []);

  return affiliateCode;
}
