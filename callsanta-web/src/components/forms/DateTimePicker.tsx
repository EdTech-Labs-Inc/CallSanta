'use client';

import { useState, useEffect } from "react";
import DatePicker from 'react-datepicker';
import { addDays, setHours, setMinutes, addMinutes } from 'date-fns';
import { Calendar, Zap } from "lucide-react";
import 'react-datepicker/dist/react-datepicker.css';

interface DateTimePickerProps {
  value: string; // ISO string
  onChange: (value: string) => void;
  onTimezoneChange: (timezone: string) => void;
  label?: string;
  error?: string;
}

export function DateTimePicker({
  value,
  onChange,
  onTimezoneChange,
  label,
  error,
}: DateTimePickerProps) {
  const [callNow, setCallNow] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Auto-detect timezone on mount
  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    onTimezoneChange(detectedTimezone);
  }, [onTimezoneChange]);

  // Parse value into date on mount
  useEffect(() => {
    if (value && !callNow) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
        }
      } catch {
        // Invalid date, ignore
      }
    }
  }, []);

  const handleCallNowToggle = () => {
    const newCallNow = !callNow;
    setCallNow(newCallNow);

    if (newCallNow) {
      // Set to current time + 2 minutes
      const now = addMinutes(new Date(), 2);
      onChange(now.toISOString());
      setSelectedDate(null);
    } else {
      setSelectedDate(null);
      onChange('');
    }
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      onChange(date.toISOString());
    } else {
      onChange('');
    }
  };

  // Filter times - only allow times from 8 AM to 9 PM
  const filterTime = (time: Date) => {
    const hours = time.getHours();
    return hours >= 8 && hours <= 21;
  };

  // Filter times for today - exclude past times
  const filterPassedTime = (time: Date) => {
    const currentDate = new Date();
    const selectedDateObj = selectedDate || new Date();

    // If it's today, filter out past times (with 15 min buffer)
    if (selectedDateObj.toDateString() === currentDate.toDateString()) {
      return time.getTime() > currentDate.getTime() + 15 * 60 * 1000;
    }
    return true;
  };

  const minDate = new Date();
  const maxDate = addDays(new Date(), 30);

  // Set min time to 8 AM, max to 9 PM
  const minTime = setHours(setMinutes(new Date(), 0), 8);
  const maxTime = setHours(setMinutes(new Date(), 0), 21);

  return (
    <div className="w-full space-y-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Call Now Option */}
      <button
        type="button"
        onClick={handleCallNowToggle}
        className="w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3"
        style={{
          borderColor: callNow ? '#165B33' : '#e5e7eb',
          backgroundColor: callNow ? 'rgba(22, 91, 51, 0.1)' : 'transparent'
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: callNow ? '#165B33' : '#f3f4f6',
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
            borderColor: callNow ? '#165B33' : '#d1d5db',
            backgroundColor: callNow ? '#165B33' : 'transparent'
          }}
        >
          {callNow && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </button>

      {/* Schedule Option */}
      {!callNow && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or schedule for later</span>
            </div>
          </div>

          {/* Combined Date & Time Picker */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Select Date & Time</span>
            </div>

            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              showTimeSelect
              timeFormat="h:mm aa"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy 'at' h:mm aa"
              minDate={minDate}
              maxDate={maxDate}
              minTime={minTime}
              maxTime={maxTime}
              filterTime={(time) => filterTime(time) && filterPassedTime(time)}
              placeholderText="Click to select date and time"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#165B33] focus:outline-none focus:ring-2 focus:ring-[#165B33]/20 text-gray-900 bg-white cursor-pointer"
              calendarClassName="santa-calendar"
              wrapperClassName="w-full"
              showPopperArrow={false}
              popperPlacement="bottom-start"
            />
          </div>

          {/* Selected DateTime Summary */}
          {selectedDate && (
            <div
              className="p-4 rounded-xl border-2 text-center"
              style={{ borderColor: '#165B33', backgroundColor: 'rgba(22, 91, 51, 0.05)' }}
            >
              <p className="text-sm text-gray-600">Santa will call on</p>
              <p className="text-lg font-medium text-gray-900 mt-1">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })} at {selectedDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
            </div>
          )}
        </>
      )}

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      {/* Custom styles for the date picker */}
      <style jsx global>{`
        .santa-calendar {
          font-family: inherit !important;
          border: 2px solid #e5e7eb !important;
          border-radius: 1rem !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
          overflow: hidden;
        }

        .react-datepicker {
          font-family: inherit !important;
        }

        .react-datepicker__header {
          background: linear-gradient(135deg, #C41E3A 0%, #a01830 100%) !important;
          border-bottom: none !important;
          padding-top: 12px !important;
          border-radius: 0 !important;
        }

        .react-datepicker__current-month,
        .react-datepicker__day-name,
        .react-datepicker-time__header {
          color: white !important;
        }

        .react-datepicker__navigation-icon::before {
          border-color: white !important;
        }

        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: #C41E3A !important;
          color: white !important;
          border-radius: 50% !important;
        }

        .react-datepicker__day:hover {
          background-color: rgba(196, 30, 58, 0.1) !important;
          border-radius: 50% !important;
        }

        .react-datepicker__day--today {
          background-color: #f3f4f6 !important;
          border-radius: 50% !important;
          font-weight: 600 !important;
        }

        .react-datepicker__day--disabled {
          color: #d1d5db !important;
        }

        .react-datepicker__time-container {
          border-left: 2px solid #e5e7eb !important;
        }

        .react-datepicker__time-list-item--selected {
          background-color: #165B33 !important;
          color: white !important;
        }

        .react-datepicker__time-list-item:hover {
          background-color: rgba(22, 91, 51, 0.1) !important;
        }

        .react-datepicker__month-container {
          float: none !important;
        }

        .react-datepicker__day {
          width: 2.2rem !important;
          line-height: 2.2rem !important;
          margin: 0.2rem !important;
        }

        .react-datepicker__day-name {
          width: 2.2rem !important;
          line-height: 2rem !important;
          margin: 0.2rem !important;
        }

        .react-datepicker__time-box {
          width: 100px !important;
        }

        .react-datepicker__time-list-item {
          padding: 8px 12px !important;
        }

        .react-datepicker__triangle {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
