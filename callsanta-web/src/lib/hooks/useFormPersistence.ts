import { BookingFormData } from '@/lib/schemas/booking';

const STORAGE_KEY = 'callsanta_booking_form';

export function saveFormData(data: Partial<BookingFormData>): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silently fail for private browsing or quota exceeded
  }
}

export function loadFormData(): Partial<BookingFormData> | null {
  if (typeof window === 'undefined') return null;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved) as Partial<BookingFormData>;
  } catch {
    return null;
  }
}

export function clearFormData(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}
