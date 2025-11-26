'use client';

import { cn } from "@/lib/utils";
import PhoneInputComponent, { Country } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export interface PhoneInputProps {
  value: string;
  onChange: (value: string | undefined) => void;
  label?: string;
  error?: string;
  defaultCountry?: Country;
  placeholder?: string;
}

export function PhoneInput({
  value,
  onChange,
  label,
  error,
  defaultCountry = 'US',
  placeholder = 'Enter phone number',
}: PhoneInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <PhoneInputComponent
        international
        countryCallingCodeEditable={false}
        defaultCountry={defaultCountry}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "phone-input-wrapper",
          error && "phone-input-error"
        )}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      <style jsx global>{`
        .phone-input-wrapper {
          display: flex;
          width: 100%;
        }
        .phone-input-wrapper .PhoneInputCountry {
          padding: 0.75rem;
          padding-right: 0.5rem;
          background: #f9fafb;
          border: 1px solid #d1d5db;
          border-right: none;
          border-radius: 0.5rem 0 0 0.5rem;
        }
        .phone-input-wrapper .PhoneInputInput {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0 0.5rem 0.5rem 0;
          font-size: 1rem;
          transition: all 0.2s;
        }
        .phone-input-wrapper .PhoneInputInput:focus {
          outline: none;
          border-color: #165B33;
          box-shadow: 0 0 0 2px rgba(22, 91, 51, 0.2);
        }
        .phone-input-wrapper .PhoneInputInput::placeholder {
          color: #9ca3af;
        }
        .phone-input-error .PhoneInputInput {
          border-color: #ef4444;
        }
        .phone-input-error .PhoneInputCountry {
          border-color: #ef4444;
        }
        .phone-input-error .PhoneInputInput:focus {
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
        }
      `}</style>
    </div>
  );
}
