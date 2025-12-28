// src/pages/parent/components/progress/ParentGamesProgress.tsx
import type { FC } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';

type TimestampLike = { toMillis?: () => number } | number | null | undefined;

function toMsSafe(t: TimestampLike): number | null {
  if (!t) return null;
  if (typeof t === 'number') return t;
  if (typeof (t as any).toMillis === 'function') {
    try {
      return (t as any).toMillis();
    } catch {
      return null;
    }
  }
  return null;
}

function relTime(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// Local games catalog
const GAMES_CATALOG = [
    { id: 'letter-tracing', title: 'Letter Tracing', area: 'Writing', totalLevels: 6 },

  { id: 'sound-detective', title: 'Sound Detective', area: 'Sounds', totalLevels: 5 },
  { id: 'rhyme-time', title: 'Rhyme Time', area: 'Sounds', totalLevels: 5 },
  { id: 'letter-sound-match', title: 'Letter–Sound Match', area: 'Sounds', totalLevels: 5 },
  { id: 'cvc-word-builder', title: 'CVC Word Builder', area: 'CVC Words', totalLevels: 5 },
  { id: 'sound-sequencer', title: 'Sound Sequencer', area: 'Blending', totalLevels: 5 },
  { id: 'blend-slide', title: 'Blend & Slide', area: 'Blending', totalLevels: 5 },
  { id: 'blend-build', title: 'Blend & Build', area: 'Blending', totalLevels: 5 },
  { id: 'vowel-explorer', title: 'Vowel Explorer', area: 'Vowels', totalLevels: 5 },
  { id: 'word-quest', title: 'Word Quest', area: 'Words', totalLevels: 5 },
  { id: 'story-builder', title: 'Story Builder', area: 'Reading', totalLevels: 5 },
];

interface KidSummaryData {
  summary?: {
    confidenceNow?: number;
    weakTop?: Array<{ tag?: string; wrong?: number }>;
    recommendedNext?: { gameId?: string; levelId?: string; reason?: string };
    games?: Record<
      string,
      { plays?: number; avgAccuracy?: number; bestAccuracy?: number; lastPlayedAt?: TimestampLike }
    >;
    lastUpdatedAt?: TimestampLike;
  };
  progress?: {
    byGame?: Record<string, { completedLevels?: number; totalLevels?: number; lastPlayedAt?: TimestampLike }>;
  };
}

interface GameCatalogEntry {
  id: string;
  title: string;
  active?: boolean;
  totalLevels?: number;
  progressDocId?: string;
  order?: number;
}

interface Props {
  kidSummaryData: KidSummaryData | null;
  gamesCatalog: GameCatalogEntry[] | any;
  onPracticeClick?: (gameId?: string, levelId?: string) => void;
}

// Normalize gamesCatalog to array format
function normalizeCatalog(catalog: any): GameCatalogEntry[] {
  if (!catalog) return [];
  
  // Already an array
  if (Array.isArray(catalog)) {
    return catalog.filter((g) => g && typeof g === 'object' && g.id);
  }
  
  // Object with games array: {games:[...]}
  if (catalog.games && Array.isArray(catalog.games)) {
    return catalog.games.filter((g: any) => g && typeof g === 'object' && g.id);
  }
  
  // Record map: {"gameId":{title,active,totalLevels,progressDocId,order,...}}
  if (typeof catalog === 'object') {
    return Object.entries(catalog)
      .filter(([_, val]) => val && typeof val === 'object')
      .map(([id, val]: [string, any]) => ({
        id,
        title: val.title || id,
        active: val.active,
        totalLevels: val.totalLevels,
        progressDocId: val.progressDocId,
        order: val.order,
      }));
  }
  
  return [];
}

export const ParentGamesProgress: FC<Props> = ({ kidSummaryData, gamesCatalog, onPracticeClick }) => {
  const summary = kidSummaryData?.summary;
  const byGame = kidSummaryData?.progress?.byGame ?? {};
  const gamesStats = summary?.games ?? {};

  // Merge catalog with progress data
  const mergedGames = GAMES_CATALOG.map((catalogGame) => {
    const prog = byGame[catalogGame.id];
    const stats = gamesStats[catalogGame.id];
    
    const completedLevels = prog?.completedLevels ?? 0;
    const plays = stats?.plays ?? 0;
    const avgAccuracy = stats?.avgAccuracy ?? null;
    const lastMs = toMsSafe(stats?.lastPlayedAt) ?? toMsSafe(prog?.lastPlayedAt);
    
    // Determine status
    let status = 'Not started';
    let statusColor = 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    
    if (plays > 0 || completedLevels > 0) {
      if (avgAccuracy !== null && avgAccuracy >= 80 && completedLevels >= catalogGame.totalLevels) {
        status = 'Mastered';
        statusColor = 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      } else {
        status = 'In progress';
        statusColor = 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300';
      }
    }
    
    return {
      ...catalogGame,
      completedLevels,
      plays,
      avgAccuracy,
      lastMs,
      status,
      statusColor,
    };
  });

  return (
    <div className="space-y-4">
      <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">Game Progress</div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {mergedGames.map((game) => {
          const progressPct = game.totalLevels > 0 ? Math.round((game.completedLevels / game.totalLevels) * 100) : 0;
          
          return (
            <Card key={game.id} className="p-4 space-y-2">
              {/* Top row: Title + Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">
                  {game.title}
                </div>
                <div className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${game.statusColor}`}>
                  {game.status}
                </div>
              </div>

              {/* Area label */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {game.area}
              </div>

              {/* Levels + Last played */}
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Levels {game.completedLevels}/{game.totalLevels}</span>
                <span>Last: {game.lastMs ? relTime(game.lastMs) : '—'}</span>
              </div>

              {/* Progress bar */}
              {progressPct > 0 && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(progressPct, 100)}%` }}
                  />
                </div>
              )}

              {/* Play button */}
              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-3"
                  onClick={() => onPracticeClick?.(game.id, undefined)}
                >
                  Play
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
