// @ts-nocheck
import React from 'react';

const bands = [
  { label: 'Not Started', min: 0, max: 20 },
  { label: 'Emerging', min: 21, max: 40 },
  { label: 'Developing', min: 41, max: 60 },
  { label: 'Proficient', min: 61, max: 80 },
  { label: 'Mastered', min: 81, max: 100 }
];

export const MasteryProgress: React.FC<{ percent: number; size?: number }> = ({ percent, size = 100 }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const band = bands.find((b) => clamped >= b.min && clamped <= b.max) || bands[0];
  const gradient = `conic-gradient(#10B981 ${clamped}%, #E5E7EB ${clamped}% 100%)`;

  return (
    <div className="inline-flex flex-col items-center">
      <div
        className="grid place-items-center rounded-full"
        style={{ width: size, height: size, background: gradient }}
      >
        <div className="grid place-items-center rounded-full bg-white" style={{ width: size - 18, height: size - 18 }}>
          <div className="text-sm font-semibold text-gray-900">{clamped}%</div>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-600">{band.label}</div>
    </div>
  );
};

