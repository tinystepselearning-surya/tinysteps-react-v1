// src/pages/parent/components/progress/ParentGamesProgress.tsx
// REBUILT: Minimal stable component, NO lazy, NO Suspense, NO dynamic imports

import type { FC } from 'react';
import { Card } from '@components/ui/card';

interface KidSummaryData {
  summary?: {
    confidenceNow?: number;
    weakTop?: Array<{ tag: string; wrong: number }>;
    recommendedNext?: { gameId?: string; reason?: string };
    games?: Record<string, { plays?: number; lastPlayedAt?: any }>;
  };
}

interface GameCatalogEntry {
  [key: string]: {
    title?: string;
    active?: boolean;
  };
}

interface ParentGamesProgressProps {
  kidSummaryData: KidSummaryData | null;
  gamesCatalog: GameCatalogEntry;
  onPracticeClick?: () => void;
}

export const ParentGamesProgress: FC<ParentGamesProgressProps> = ({
  kidSummaryData,
  gamesCatalog,
}) => {
  const summary = kidSummaryData?.summary;
  const confidenceNow = summary?.confidenceNow ?? null;
  const weakTop = summary?.weakTop || [];
  const recommendedNext = summary?.recommendedNext;
  const gamesStats = summary?.games || {};

  // Safe helper to format tags
  const formatTag = (tag: string): string => {
    if (!tag) return '';
    const [category, val] = tag.split(':');
    if (category === 'letter') return `Letter ${(val || '').toUpperCase()}`;
    if (category === 'sound') return `Sound /${val || ''}/`;
    return tag;
  };

  // Build games list
  const gamesList = Object.entries(gamesCatalog || {})
    .filter(([_, game]) => game.active !== false)
    .map(([gameId, game]) => {
      const stats = gamesStats[gameId];
      const plays = stats?.plays ?? 0;
      let lastPlayed = '—';
      if (stats?.lastPlayedAt && typeof stats.lastPlayedAt.toMillis === 'function') {
        try {
          const ms = stats.lastPlayedAt.toMillis();
          const days = Math.floor((Date.now() - ms) / 86400000);
          lastPlayed = days === 0 ? 'Today' : `${days}d ago`;
        } catch {
          lastPlayed = '—';
        }
      }
      return {
        id: gameId,
        title: game.title || gameId,
        plays,
        lastPlayed,
      };
    });

  return (
    <div className="space-y-6">
      {/* Confidence Card */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Confidence Now</h3>
        <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
          {confidenceNow !== null ? confidenceNow : '—'}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">out of 100</div>
      </Card>

      {/* Improvement Areas Card */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Improvement Areas</h3>
        {weakTop.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">All skills confident!</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {weakTop.slice(0, 5).map((skill, idx) => (
              <div
                key={idx}
                className="px-3 py-1 bg-orange-100 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-800 rounded text-sm"
              >
                {formatTag(skill.tag)} ({skill.wrong} wrong)
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recommended Next Card */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Recommended Next</h3>
        {recommendedNext?.gameId ? (
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{recommendedNext.gameId}</div>
            {recommendedNext.reason && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{recommendedNext.reason}</div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">No recommendation yet</p>
        )}
      </Card>

      {/* Games List */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Games</h3>
        {gamesList.length === 0 ? (
          <Card className="p-6 text-center text-gray-600 dark:text-gray-400">No games found</Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gamesList.map((game) => (
              <Card key={game.id} className="p-4">
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">{game.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div>Plays: {game.plays}</div>
                  <div>Last: {game.lastPlayed}</div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
