'use client';

import { useEffect } from 'react';
import { clearFormData } from '@/lib/hooks/useFormPersistence';

export function ClearFormStorage() {
  useEffect(() => {
    clearFormData();
  }, []);

  return null;
}
