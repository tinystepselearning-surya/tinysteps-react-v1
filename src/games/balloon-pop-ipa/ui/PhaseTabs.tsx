import React from 'react';
import type { Phase } from '../types';

interface PhaseTabsProps {
  current: Phase;
  unlocked: number;
  onChange: (phase: Phase) => void;
}

const PhaseTabs: React.FC<PhaseTabsProps> = ({ current, unlocked, onChange }) => {
  const phases: Phase[] = [1, 2, 3, 4, 5, 6];

  return (
    <div className="flex gap-2 mb-6 flex-wrap" role="tablist" aria-label="Learning phases">
      {phases.map((phase) => {
        const isUnlocked = phase <= unlocked;
        const isCurrent = phase === current;

        return (
          <button
            key={phase}
            role="tab"
            aria-selected={isCurrent}
            aria-disabled={!isUnlocked}
            onClick={() => isUnlocked && onChange(phase)}
            className={`
              px-6 py-3 rounded-lg font-semibold text-sm
              transition-all duration-200
              focus:outline-none focus:ring-[3px] focus:ring-blue-500 focus:ring-offset-2
              ${isCurrent
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : isUnlocked
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
              }
            `}
            disabled={!isUnlocked}
            title={
              !isUnlocked
                ? 'Unlock by reaching 80% mastery in previous phases'
                : `Phase ${phase}`
            }
          >
            <div className="flex items-center gap-2">
              {!isUnlocked && (
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span>P{phase}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default React.memo(PhaseTabs);
