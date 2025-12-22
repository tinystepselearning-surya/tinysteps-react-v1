// src/pages/parent/components/progress/ParentGamesProgress.tsx
import type { FC } from 'react';
import { Card } from '@components/ui/card';

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
  
  // Record map: {"gameId":{title,active,...}}
  if (typeof catalog === 'object') {
    return Object.entries(catalog)
      .filter(([_, val]) => val && typeof val === 'object')
      .map(([id, val]: [string, any]) => ({
        id,
        title: val.title || id,
        active: val.active,
      }));
  }
  
  return [];
}

export const ParentGamesProgress: FC<Props> = ({ kidSummaryData, gamesCatalog, onPracticeClick }) => {
  const summary = kidSummaryData?.summary;
  const byGame = kidSummaryData?.progress?.byGame ?? {};
  const gamesStats = summary?.games ?? {};
  const updatedMs = toMsSafe(summary?.lastUpdatedAt);

  const confidence = typeof summary?.confidenceNow === 'number' ? summary!.confidenceNow! : null;
  const weakTop = summary?.weakTop ?? [];
  const rec = summary?.recommendedNext;

  // Normalize catalog
  let activeGames = normalizeCatalog(gamesCatalog).filter((g) => g.active !== false);
  
  // Fallback: build games list from kidSummaryData if catalog is empty
  if (activeGames.length === 0 && kidSummaryData) {
    const fallbackIds = new Set<string>();
    
    // Add from summary.games
    if (gamesStats) {
      Object.keys(gamesStats).forEach((id) => fallbackIds.add(id));
    }
    
    // Add from progress.byGame
    if (byGame) {
      Object.keys(byGame).forEach((id) => fallbackIds.add(id));
    }
    
    activeGames = Array.from(fallbackIds).map((id) => ({
      id,
      title: id,
      active: true,
    }));
  }
  
  activeGames = activeGames.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Top row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">Confidence Now</div>
          <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {confidence !== null ? confidence : '—'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">out of 100</div>
          {updatedMs && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-3">Updated: {relTime(updatedMs)}</div>
          )}
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">Recommended Next</div>
          {rec?.gameId ? (
            <div className="mt-2 space-y-2">
              <div className="font-semibold text-gray-900 dark:text-gray-100">{rec.gameId}</div>
              {rec.reason && <div className="text-sm text-gray-600 dark:text-gray-400">{rec.reason}</div>}
              <button
                type="button"
                onClick={() => onPracticeClick?.(rec.gameId, rec.levelId)}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Practice Now
              </button>
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">No recommendation yet.</div>
          )}
        </Card>
      </div>

      {/* Weak skills */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="font-bold text-gray-900 dark:text-gray-100">Improvement Areas</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Top 5</div>
        </div>

        {weakTop.length === 0 ? (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">All skills look good!</div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {weakTop.slice(0, 5).map((w, idx) => (
              <div
                key={`${w.tag ?? 'tag'}-${idx}`}
                className="px-3 py-1 rounded border border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 text-sm text-gray-800 dark:text-gray-200"
              >
                {w.tag || '—'} {typeof w.wrong === 'number' ? `(${w.wrong} wrong)` : ''}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Games grid */}
      <div className="space-y-3">
        <div className="font-bold text-gray-900 dark:text-gray-100">Game Progress</div>

        {activeGames.length === 0 ? (
          <Card className="p-6 text-sm text-gray-600 dark:text-gray-400">No games available.</Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGames.map((g) => {
              const stats = gamesStats[g.id];
              const prog = byGame[g.id];

              const plays = stats?.plays ?? 0;
              const completedLevels = prog?.completedLevels ?? 0;
              const totalLevels = prog?.totalLevels ?? 0;
              const avgAccuracy = stats?.avgAccuracy ?? null;
              const lastMs = toMsSafe(stats?.lastPlayedAt) ?? toMsSafe(prog?.lastPlayedAt);

              // Mastery badge: ✅ if avgAccuracy >= 80 AND completedLevels >= totalLevels (and totalLevels > 0)
              const isMastered =
                avgAccuracy !== null &&
                avgAccuracy >= 80 &&
                totalLevels > 0 &&
                completedLevels >= totalLevels;

              return (
                <Card key={g.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{g.title}</div>
                    <div className="text-xl">{isMastered ? '✅' : '🔄'}</div>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div>Plays: {plays}</div>
                    <div>
                      Levels: {completedLevels}/{totalLevels || '?'}
                    </div>
                    {avgAccuracy !== null && (
                      <div>
                        Avg Score: <span className="font-semibold">{Math.round(avgAccuracy)}%</span>
                      </div>
                    )}
                    {lastMs ? <div className="text-xs">Last: {relTime(lastMs)}</div> : <div className="text-xs">Last: —</div>}
                  </div>

                  <button
                    type="button"
                    onClick={() => onPracticeClick?.(g.id, undefined)}
                    className="w-full px-3 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
                  >
                    Practice
                  </button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
