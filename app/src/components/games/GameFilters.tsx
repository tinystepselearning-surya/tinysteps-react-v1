/**
 * GameFilters.tsx
 * Filter chips for phase, area, difficulty, duration, and toggles
 */

import { motion } from "framer-motion";
import type { GameFilters, PhonicsArea, GameDifficulty, GameDuration } from "../../types/game";
import { PHASES } from "../../data/phases";

interface GameFiltersProps {
  filters: GameFilters;
  onChange: (filters: Partial<GameFilters>) => void;
  onReset: () => void;
}

const AREAS: { id: PhonicsArea; label: string }[] = [
  { id: "listening", label: "👂 Listening" },
  { id: "phoneme-awareness", label: "🎵 Phoneme Awareness" },
  { id: "letter-sounds", label: "📝 Letter Sounds" },
  { id: "blending", label: "🔀 Blending" },
  { id: "digraphs", label: "📎 Digraphs" },
  { id: "vowel-teams", label: "🔤 Vowel Teams" },
  { id: "syllables", label: "📊 Syllables" },
  { id: "fluency", label: "⚡ Fluency" },
  { id: "comprehension", label: "💭 Comprehension" },
];

const DIFFICULTIES: { id: GameDifficulty; label: string; color: string }[] = [
  { id: "easy", label: "Easy", color: "emerald" },
  { id: "medium", label: "Medium", color: "amber" },
  { id: "hard", label: "Hard", color: "red" },
];

const DURATIONS: { id: GameDuration; label: string }[] = [
  { id: "quick", label: "⚡ Quick (5 min)" },
  { id: "normal", label: "⏱️ Normal (15 min)" },
  { id: "extended", label: "🕐 Extended (30+ min)" },
];

export default function GameFilters({ filters, onChange, onReset }: GameFiltersProps) {
  const togglePhase = (phaseId: string) => {
    const newPhases = filters.phaseIds.includes(phaseId)
      ? filters.phaseIds.filter((id) => id !== phaseId)
      : [...filters.phaseIds, phaseId];
    onChange({ phaseIds: newPhases });
  };
  
  const toggleArea = (area: PhonicsArea) => {
    const newAreas = filters.areas.includes(area)
      ? filters.areas.filter((a) => a !== area)
      : [...filters.areas, area];
    onChange({ areas: newAreas });
  };
  
  const toggleDifficulty = (diff: GameDifficulty) => {
    const newDiffs = filters.difficulties.includes(diff)
      ? filters.difficulties.filter((d) => d !== diff)
      : [...filters.difficulties, diff];
    onChange({ difficulties: newDiffs });
  };
  
  const toggleDuration = (dur: GameDuration) => {
    const newDurs = filters.durations.includes(dur)
      ? filters.durations.filter((d) => d !== dur)
      : [...filters.durations, dur];
    onChange({ durations: newDurs });
  };
  
  const hasActiveFilters = 
    filters.phaseIds.length > 0 ||
    filters.areas.length > 0 ||
    filters.difficulties.length > 0 ||
    filters.durations.length > 0 ||
    filters.onlyFree ||
    filters.onlyCompleted;
  
  return (
    <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:underline"
          >
            Clear all
          </button>
        )}
      </div>
      
      {/* Phases */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Phase</label>
        <div className="flex flex-wrap gap-2">
          {PHASES.map((phase) => {
            const isActive = filters.phaseIds.includes(phase.id);
            return (
              <motion.button
                key={phase.id}
                onClick={() => togglePhase(phase.id)}
                whileTap={{ scale: 0.95 }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                  isActive
                    ? "bg-blue-100 text-blue-700 border-blue-300"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                {phase.id}
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {/* Areas */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Learning Area</label>
        <div className="flex flex-wrap gap-2">
          {AREAS.map((area) => {
            const isActive = filters.areas.includes(area.id);
            return (
              <motion.button
                key={area.id}
                onClick={() => toggleArea(area.id)}
                whileTap={{ scale: 0.95 }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                  isActive
                    ? "bg-blue-100 text-blue-700 border-blue-300"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                {area.label}
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {/* Difficulty */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Difficulty</label>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((diff) => {
            const isActive = filters.difficulties.includes(diff.id);
            return (
              <motion.button
                key={diff.id}
                onClick={() => toggleDifficulty(diff.id)}
                whileTap={{ scale: 0.95 }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                  isActive
                    ? `bg-${diff.color}-100 text-${diff.color}-700 border-${diff.color}-300`
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                {diff.label}
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {/* Duration */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Duration</label>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((dur) => {
            const isActive = filters.durations.includes(dur.id);
            return (
              <motion.button
                key={dur.id}
                onClick={() => toggleDuration(dur.id)}
                whileTap={{ scale: 0.95 }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                  isActive
                    ? "bg-blue-100 text-blue-700 border-blue-300"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                {dur.label}
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {/* Toggles */}
      <div className="space-y-2 pt-2 border-t border-gray-200">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.onlyFree}
            onChange={(e) => onChange({ onlyFree: e.target.checked })}
            className="size-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Only free games</span>
        </label>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.onlyCompleted}
            onChange={(e) => onChange({ onlyCompleted: e.target.checked })}
            className="size-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Only completed games</span>
        </label>
      </div>
    </div>
  );
}
