'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Gift } from 'lucide-react';

interface BudgetSliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
}

function getBudgetLabel(value: number): string {
  if (value === 0) return 'No specific budget';
  if (value <= 50) return 'Small gifts';
  if (value <= 150) return 'Modest gifts';
  if (value <= 300) return 'Nice gifts';
  if (value <= 500) return 'Generous gifts';
  if (value <= 750) return 'Very generous';
  return 'No limits!';
}

function getBudgetEmoji(value: number): string {
  if (value === 0) return '🎁';
  if (value <= 50) return '🧸';
  if (value <= 150) return '🎮';
  if (value <= 300) return '🎄';
  if (value <= 500) return '✨';
  if (value <= 750) return '🌟';
  return '🎅';
}

export function BudgetSlider({
  value,
  onChange,
  label,
  error,
  min = 0,
  max = 1000,
  step = 25,
}: BudgetSliderProps) {
  const [localValue, setLocalValue] = useState(value || 0);

  useEffect(() => {
    setLocalValue(value || 0);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setLocalValue(newValue);
    onChange(newValue);
  };

  const percentage = ((localValue - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5" style={{ color: '#165B33' }} />
            <span className="text-sm text-gray-600">Gift Budget Guidance</span>
          </div>
          <div className="flex items-center gap-1 text-2xl">
            <span>{getBudgetEmoji(localValue)}</span>
          </div>
        </div>

        {/* Value Display */}
        <div className="text-center mb-6">
          <div className="inline-flex items-baseline gap-1">
            {localValue > 0 ? (
              <>
                <span className="text-4xl font-bold" style={{ color: '#C41E3A' }}>
                  ${localValue}
                </span>
                <span className="text-lg text-gray-500">max</span>
              </>
            ) : (
              <span className="text-2xl font-medium text-gray-600">
                No specific budget
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">{getBudgetLabel(localValue)}</p>
        </div>

        {/* Slider */}
        <div className="relative mb-4">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localValue}
            onChange={handleChange}
            className="w-full h-3 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #C41E3A 0%, #165B33 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
            }}
          />
          <style jsx>{`
            input[type='range']::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background: white;
              border: 4px solid #C41E3A;
              cursor: pointer;
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
              transition: transform 0.15s ease;
            }
            input[type='range']::-webkit-slider-thumb:hover {
              transform: scale(1.1);
            }
            input[type='range']::-moz-range-thumb {
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background: white;
              border: 4px solid #C41E3A;
              cursor: pointer;
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
            }
          `}</style>
        </div>

        {/* Scale Labels */}
        <div className="flex justify-between text-xs text-gray-400">
          <span>$0</span>
          <span>$250</span>
          <span>$500</span>
          <span>$750</span>
          <span>$1000</span>
        </div>

        {/* Helper Text */}
        <p className="text-xs text-gray-500 text-center mt-4">
          This helps Santa know what kind of gifts to promise during the call
        </p>
      </div>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
