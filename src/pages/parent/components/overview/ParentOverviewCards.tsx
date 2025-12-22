// src/pages/parent/components/overview/ParentOverviewCards.tsx
// Parent-friendly overview cards showing key metrics

import type { FC } from 'react';
import { Card } from '@components/ui/card';

interface ParentOverviewCardsProps {
  confidenceNow: number | null;
  gamesCompleted: number | null;
  avgScore: number | null;
  totalPoints: number | null;
  stageMessage?: string;
  lastUpdatedAt?: number | null;
}

export const ParentOverviewCards: FC<ParentOverviewCardsProps> = ({
  confidenceNow,
  gamesCompleted,
  avgScore,
  totalPoints,
  stageMessage,
  lastUpdatedAt,
}) => {
  // Helper to format relative time
  const formatRelativeTime = (ms: number): string => {
    const now = Date.now();
    const diffMs = now - ms;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    const date = new Date(ms);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Confidence Card */}
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Confidence</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {confidenceNow !== null ? confidenceNow : '—'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">out of 100</div>
        </Card>

        {/* Games Completed Card */}
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Games Started</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {gamesCompleted !== null ? gamesCompleted : '—'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">games</div>
        </Card>

        {/* Average Score Card */}
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Score</div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {avgScore !== null ? `${Math.round(avgScore)}%` : '—'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">accuracy</div>
        </Card>

        {/* Total Points Card */}
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Points</div>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {totalPoints !== null ? totalPoints.toLocaleString() : '—'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">points</div>
        </Card>
      </div>

      {/* Stage Message */}
      {stageMessage && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="text-sm font-medium text-blue-900 dark:text-blue-100">{stageMessage}</div>
        </Card>
      )}

      {/* Last Updated */}
      {lastUpdatedAt && (
        <div className="text-xs text-gray-500 dark:text-gray-500 text-right">
          Updated: {formatRelativeTime(lastUpdatedAt)}
        </div>
      )}
    </div>
  );
};
