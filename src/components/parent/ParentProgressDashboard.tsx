import React from 'react';
import { useRealtimeData } from '../../hooks/useRealtime';

type Props = {
  childId: string;
};

// Simple progress bar component
function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-gray-200 rounded h-4">
      <div className="bg-green-500 h-4 rounded" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export default function ParentProgressDashboard({ childId }: Props) {
  const { data: progress = [], isLoading, error } = useRealtimeData('progress', [
    // query will be built inside hook by supplying constraints; here we pass nothing and filter client-side
  ]);

  if (isLoading) return <div>Loading progress...</div>;
  if (error) return <div className="text-red-600">Failed to load progress: {String(error.message)}</div>;

  const filtered = progress.filter((p: any) => p.studentId === childId);

  const masteryByArea: Record<string, number[]> = {};
  filtered.forEach((p: any) => {
    const area = p.area || 'general';
    const scoreBand = Number(p.score || p.scoreBand || 0);
    if (!masteryByArea[area]) masteryByArea[area] = [];
    masteryByArea[area].push(scoreBand);
  });

  const entries = Object.entries(masteryByArea);
  if (entries.length === 0) return <div>No progress data yet.</div>;

  return (
    <div className="space-y-4">
      {entries.map(([area, scores]) => {
        const avg = scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length);
        return (
          <div key={area} className="p-4 bg-white rounded shadow">
            <h3 className="font-semibold capitalize">{area}</h3>
            <div className="text-2xl font-bold">{Math.round(avg)}%</div>
            <div className="mt-2">
              <ProgressBar value={avg} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
