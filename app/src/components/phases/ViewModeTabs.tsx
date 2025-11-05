/**
 * ViewModeTabs.tsx
 * Tab selector for Cards | Arrow Roadmap | Step List view modes
 * Persists selection to localStorage.viewMode
 */

import { motion } from "framer-motion";

export type ViewMode = "cards" | "arrow" | "list" | "games";

interface ViewModeTabsProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const MODES: { id: ViewMode; label: string; icon: string }[] = [
  { id: "cards", label: "Cards", icon: "▦" },
  { id: "arrow", label: "Arrow Roadmap", icon: "↝" },
  { id: "list", label: "Step List", icon: "☰" },
  { id: "games", label: "Games Catalog", icon: "🎮" },
];

export default function ViewModeTabs({ value, onChange }: ViewModeTabsProps) {
  return (
    <div className="flex items-center justify-start gap-1 border-b border-gray-200">
      <div className="flex gap-6" role="tablist" aria-label="View mode selection">
        {MODES.map((mode) => {
          const isActive = value === mode.id;
          
          return (
            <button
              key={mode.id}
              onClick={() => onChange(mode.id)}
              className={`
                relative pb-3 pt-2 px-1 text-sm transition-all duration-200
                focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-sm
                ${
                  isActive
                    ? "font-bold text-gray-900"
                    : "font-medium text-gray-500 hover:text-gray-700"
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
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 to-sky-400"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
