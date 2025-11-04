/**
 * SegmentedControl.tsx
 * Modern segmented control with pill track and animated slider
 * Used for view mode selection (Cards / Arrow / List)
 */

import { motion } from 'framer-motion';

export interface SegmentedOption {
  id: string;
  label: string;
  icon?: string;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

export default function SegmentedControl({
  options,
  value,
  onChange,
  ariaLabel = 'Segmented control',
}: SegmentedControlProps) {
  const activeIndex = options.findIndex((opt) => opt.id === value);

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="relative inline-flex items-center rounded-full bg-slate-100 p-1 shadow-inner"
    >
      {/* Animated slider background */}
      <motion.div
        className="absolute inset-y-1 rounded-full bg-white shadow-sm"
        initial={false}
        animate={{
          x: `calc(${activeIndex * 100}% + ${activeIndex * 0.25}rem)`,
          width: `calc(${100 / options.length}% - 0.25rem)`,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      />

      {/* Buttons */}
      {options.map((option) => {
        const isActive = value === option.id;

        return (
          <button
            key={option.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${option.id}`}
            id={`tab-${option.id}`}
            onClick={() => onChange(option.id)}
            className={`
              relative z-10 flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold
              transition-colors duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2
              ${
                isActive
                  ? 'text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }
            `}
            style={{ minWidth: '6rem' }}
          >
            {option.icon && <span className="text-base">{option.icon}</span>}
            <span className="whitespace-nowrap">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
