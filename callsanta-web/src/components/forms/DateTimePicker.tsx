'use client';

import { useEffect, useMemo, useState } from "react";
import { addDays, addMinutes, isAfter, isBefore, setHours, setMinutes } from "date-fns";
import { Zap, Clock3 } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value: string; // ISO string
  onChange: (value: string) => void;
  onTimezoneChange: (timezone: string) => void;
  label?: string;
  error?: string;
  onConfirm?: () => void;
  confirmLabel?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  onTimezoneChange,
  label,
  error,
  onConfirm,
  confirmLabel,
  disabled = false,
}: DateTimePickerProps) {
  const [callNow, setCallNow] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [desktopDate, setDesktopDate] = useState<string>('');
  const [desktopTime, setDesktopTime] = useState<string>('');

  const parsedSelectedDate = useMemo(() => {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }, [value]);

  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    onTimezoneChange(detectedTimezone);
  }, [onTimezoneChange]);

  useEffect(() => {
    const updateIsMobile = () => setIsMobile(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  const minDateTime = useMemo(() => addMinutes(new Date(), 15), []);
  const maxDateTime = useMemo(() => addDays(new Date(), 30), []);

  const toLocalInputValue = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const handleCallNowToggle = () => {
    const newCallNow = !callNow;
    setCallNow(newCallNow);

    if (newCallNow) {
      const now = new Date();
      onChange(now.toISOString());
      setLocalError(null);
      setDesktopDate('');
      setDesktopTime('');
    } else {
      onChange('');
    }
  };

  const validateAndSet = (candidate: Date) => {
    if (isNaN(candidate.getTime())) {
      setLocalError('Please pick a valid date and time.');
      return;
    }

    const hour = candidate.getHours();
    if (hour < 8 || hour > 21) {
      setLocalError('Choose a time between 8:00 AM and 9:00 PM.');
      return;
    }

    if (isBefore(candidate, minDateTime)) {
      setLocalError('Pick a time at least 15 minutes from now.');
      return;
    }

    if (isAfter(candidate, maxDateTime)) {
      setLocalError('Pick a time within the next 30 days.');
      return;
    }

    setLocalError(null);
    onChange(candidate.toISOString());
  };

  const handleEditCallTime = () => {
    setCallNow(false);
    setLocalError(null);
    setDesktopDate('');
    setDesktopTime('');
    onChange('');
  };

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    setCallNow(false);

    if (!inputVal) {
      setLocalError(null);
      onChange('');
      setDesktopDate('');
      setDesktopTime('');
      return;
    }

    const candidate = new Date(inputVal);
    validateAndSet(candidate);
  };

  const handleDesktopSelection = (nextDate: string, nextTime: string) => {
    setCallNow(false);
    setDesktopDate(nextDate);
    setDesktopTime(nextTime);

    if (!nextDate || !nextTime) {
      setLocalError(null);
      return;
    }

    if (nextTime === 'soonest') {
      const baseDate = nextDate ? new Date(`${nextDate}T00:00:00`) : new Date();
      const soonest = addMinutes(new Date(), 30);
      if (baseDate.toDateString() !== soonest.toDateString()) {
        const adjusted = new Date(baseDate);
        adjusted.setHours(8, 0, 0, 0);
        validateAndSet(adjusted);
        return;
      }
      validateAndSet(soonest);
      return;
    }

    const candidate = new Date(`${nextDate}T${nextTime}`);
    validateAndSet(candidate);
  };

  return (
    <div className={cn("w-full space-y-4", disabled && "opacity-60 pointer-events-none select-none")}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-800">
            {label}
          </label>
          <span className="text-xs text-gray-500">Same-day friendly</span>
        </div>
      )}

      {/* Call Now Option */}
      <button
        type="button"
        onClick={handleCallNowToggle}
        className="w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3"
        style={{
          borderColor: callNow ? '#111' : '#e5e7eb',
          backgroundColor: callNow ? '#f3f4f6' : 'transparent'
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: callNow ? '#111' : '#f3f4f6',
            color: callNow ? 'white' : '#6b7280'
          }}
        >
          <Zap className="w-5 h-5" />
        </div>
        <div className="text-left">
          <p className="font-medium text-gray-900">Call Now</p>
          <p className="text-sm text-gray-500">Santa will call within 2 minutes</p>
        </div>
        <div
          className="ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center"
          style={{
            borderColor: callNow ? '#111' : '#d1d5db',
            backgroundColor: callNow ? '#111' : 'transparent'
          }}
        >
          {callNow && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </button>
      {callNow && (
        <div className="flex justify-end mt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleEditCallTime}
          >
            Edit time instead
          </Button>
        </div>
      )}

      {/* Schedule Option */}
      {!callNow && (
        <>
          <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Clock3 className="w-4 h-4 text-gray-700" />
              <span className="text-sm font-medium text-gray-800">Schedule a time</span>
            </div>

            {isMobile ? (
              <div className="flex justify-center">
                <input
                  type="datetime-local"
                  value={parsedSelectedDate ? toLocalInputValue(parsedSelectedDate) : ''}
                  onChange={handleDateTimeChange}
                  min={toLocalInputValue(minDateTime)}
                  max={toLocalInputValue(maxDateTime)}
                  step={900}
                  className="w-full max-w-xs min-w-0 px-3 py-3 rounded-lg border border-gray-300 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 text-gray-900 bg-white shadow-sm text-base"
                />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">Step 1: Day</label>
                  <select
                    value={desktopDate || (parsedSelectedDate ? parsedSelectedDate.toISOString().slice(0, 10) : '')}
                    onChange={(e) => handleDesktopSelection(e.target.value, desktopTime || (parsedSelectedDate ? parsedSelectedDate.toISOString().slice(11, 16) : ''))}
                    className="w-full px-3 py-3 rounded-lg border border-gray-300 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 text-gray-900 bg-white shadow-sm text-sm"
                  >
                    <option value="">Select day</option>
                    {Array.from({ length: 14 }, (_, i) => {
                      const d = addDays(new Date(), i);
                      const iso = d.toISOString().slice(0, 10);
                      const label = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                      return <option key={iso} value={iso}>{label}</option>;
                    })}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">Step 2: Time</label>
                  <select
                    value={desktopTime || (parsedSelectedDate ? parsedSelectedDate.toISOString().slice(11, 16) : '')}
                    onChange={(e) => handleDesktopSelection(desktopDate || (parsedSelectedDate ? parsedSelectedDate.toISOString().slice(0, 10) : ''), e.target.value)}
                    className="w-full px-3 py-3 rounded-lg border border-gray-300 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 text-gray-900 bg-white shadow-sm text-sm"
                  >
                    <option value="">Select time</option>
                    <option value="soonest">Soonest available</option>
                    {Array.from({ length: ((21 - 8) * 4) + 5 }, (_, idx) => {
                      const minutesFromStart = idx * 15;
                      const hour = 8 + Math.floor(minutesFromStart / 60);
                      const minute = minutesFromStart % 60;
                      if (hour > 21) return null;
                      const dateObj = setMinutes(setHours(new Date(), hour), minute);
                      const label = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                      const valueStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                      return <option key={valueStr} value={valueStr}>{label}</option>;
                    })}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Selected DateTime Summary */}
          {parsedSelectedDate && (
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-center">
              <p className="text-sm text-gray-600">Santa will call on</p>
              <p className="text-lg font-medium text-gray-900 mt-1">
                {parsedSelectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })} at {parsedSelectedDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
              {onConfirm && (
                <div className="mt-5 flex justify-center">
                  <Button
                    type="button"
                    size="lg"
                    className="px-10 py-3 text-base font-semibold"
                    onClick={onConfirm}
                  >
                    {confirmLabel || 'Confirm'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      {localError && <p className="text-sm text-red-500 mt-1">{localError}</p>}
    </div>
  );
}
