'use client';

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import PhoneInputComponent, { Country } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { getCountries } from 'react-phone-number-input/min';

export interface PhoneInputProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  label?: string;
  error?: string;
  defaultCountry?: Country;
  placeholder?: string;
  onBlur?: () => void;
  className?: string;
}

function detectBrowserCountry(): Country {
  try {
    const locale = typeof navigator !== 'undefined' ? navigator.language || "en-US" : "en-US";
    const region = locale.split("-")[1];
    if (region && region.length === 2) return region as Country;
  } catch {
    /* ignore */
  }
  return "US";
}

export function PhoneInput({
  value,
  onChange,
  label,
  error,
  defaultCountry,
  placeholder = 'Enter phone number',
  onBlur,
  className,
}: PhoneInputProps) {
  // Track selected country explicitly so it doesn't disappear on re-renders/collapse.
  const [country, setCountry] = useState<Country | undefined>(defaultCountry ?? 'US');

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    // Only set detected country if no explicit default already provided/selected
    const detected = detectBrowserCountry();
    setCountry((prev) => prev ?? detected);
  }, []);

  // Respect updates to defaultCountry prop (if provided)
  useEffect(() => {
    if (defaultCountry) {
      setCountry(defaultCountry);
    }
  }, [defaultCountry]);

  const countriesList = useMemo<Country[]>(() => {
    const all = getCountries();
    const prioritized: Country[] = ['US', 'GB'];
    const rest = all.filter((c) => !prioritized.includes(c));
    return [...prioritized, ...rest];
  }, []);

  return (
    <div className="space-y-1 w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <PhoneInputComponent
        international
        withCountryCallingCode
        countryCallingCodeEditable={false}
        defaultCountry={country}
        country={country}
        onCountryChange={setCountry}
        countries={countriesList}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onBlur={onBlur}
        className={cn(
          "flex w-full rounded-lg border bg-white",
          "px-3 py-2 text-base",
          "focus-within:ring-2 focus-within:ring-primary",
          error ? "border-red-500 focus-within:ring-red-200" : "border-gray-300",
          className
        )}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
