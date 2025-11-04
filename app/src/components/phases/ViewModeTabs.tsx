/**
 * ViewModeTabs.tsx
 * Tab selector for Cards | Arrow Roadmap | Step List view modes
 * Persists selection to localStorage.viewMode
 */

import { motion } from "framer-motion";

export type ViewMode = "cards" | "arrow" | "list";

interface ViewModeTabsProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const MODES: { id: ViewMode; label: string; icon: string }[] = [
  { id: "cards", label: "Cards", icon: "▦" },
  { id: "arrow", label: "Arrow Roadmap", icon: "↝" },
  { id: "list", label: "Step List", icon: "☰" },
];

export default function ViewModeTabs({ value, onChange }: ViewModeTabsProps) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl bg-white p-2 shadow-md">
      <div className="flex gap-2" role="tablist" aria-label="View mode selection">
        {MODES.map((mode) => {
          const isActive = value === mode.id;
          
          return (
            <motion.button
              key={mode.id}
              onClick={() => onChange(mode.id)}
              whileTap={{ scale: 0.97 }}
              className={`
                relative rounded-full px-4 py-2 text-sm font-bold shadow-sm transition-all duration-200
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500
                ${
                  isActive
                    ? "bg-gradient-to-r from-orange-400 to-sky-400 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }
              `}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${mode.id}`}
              id={`tab-${mode.id}`}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{mode.icon}</span>
                <span className="whitespace-nowrap">{mode.label}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
