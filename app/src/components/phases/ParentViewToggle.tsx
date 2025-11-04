/**
 * ParentViewToggle.tsx
 * Switch toggle for parent/kid view with localStorage persistence
 */

import { motion } from "framer-motion";

interface ParentViewToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export default function ParentViewToggle({ value, onChange }: ParentViewToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <span className={`text-sm font-medium ${!value ? "text-gray-900" : "text-gray-500"}`}>
        Kid View
      </span>
      <button
        onClick={() => onChange(!value)}
        className={`
          relative h-8 w-14 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
          ${value ? "bg-emerald-500" : "bg-gray-300"}
        `}
        role="switch"
        aria-checked={value}
        aria-label="Toggle parent view"
      >
        <motion.div
          className="absolute top-1 h-6 w-6 rounded-full bg-white shadow-md"
          animate={{
            left: value ? "calc(100% - 28px)" : "4px",
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />
      </button>
      <span className={`text-sm font-medium ${value ? "text-gray-900" : "text-gray-500"}`}>
        Parent View
      </span>
    </div>
  );
}
