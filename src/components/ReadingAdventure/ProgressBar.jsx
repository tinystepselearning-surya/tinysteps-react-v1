import React from 'react';

export default function ProgressBar({ current, total = 10 }) {
  const pct = Math.min(100, Math.round((current / total) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>Progress</span>
        <span>
          Chapter {current} / {total}
        </span>
      </div>
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
