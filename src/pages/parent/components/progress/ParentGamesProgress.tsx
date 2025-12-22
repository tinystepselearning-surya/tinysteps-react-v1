import { useState, useMemo } from 'react';
import type { FC } from 'react';
import { Card } from '@components/ui/card';
import { cn } from '@components/lib/utils';

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

type Timeframe = 'this-week' | 'last-10' | 'all-time';

interface WeakTopEntry {
  tag: string;
  attempts: number;
  correct: number;
  wrong: number;
  wrongRate: number;
  lastSeenAt?: { toMillis: () => number };
}

interface GameStats {
  plays?: number;
  bestAccuracy?: number;
  lastPlayedAt?: { toMillis: () => number };
  avgAccuracy?: number;
}

interface RecommendedNext {
  gameId?: string;
  levelId?: string;
  reason?: string;
  estMinutes?: number;
}

interface StageProgress {
  currentStageId?: number;
  stageProgressPct?: number;
}

interface GameProgress {
  completedLevels?: number;
  totalLevels?: number;
  lastPlayedAt?: { toMillis: () => number };
}

interface KidSummaryData {
  summary?: {
    stage?: StageProgress;
    confidenceNow?: number;
    trendLabel?: string;
    trendDelta?: number;
    improvementTop?: WeakTopEntry[];
    weakTop?: WeakTopEntry[];
    lastSessionWeakTop?: Array<{ tag: string; wrong: number }>;
    recommendedNext?: RecommendedNext;
    games?: Record<string, GameStats>;
    lastUpdatedAt?: { toMillis: () => number };
  };
  progress?: {
    byStage?: Record<string, any>;
    byGame?: Record<string, GameProgress>;
  };
}

interface GameCatalogEntry {
  id: string;
  title: string;
  description?: string;
  active?: boolean;
}

interface ParentGamesProgressProps {
  kidSummaryData: KidSummaryData | null;
  gamesCatalog: GameCatalogEntry[];
  onPracticeClick?: (gameId?: string, levelId?: string) => void;
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function formatTagLabel(tag: string): string {
  if (!tag) return '';
  const [category, val] = tag.split(':');
  
  if (category === 'letter') {
    return `Letter ${val.toUpperCase()}`;
  }
  if (category === 'sound') {
    return `Sound /${val}/`;
  }
  if (category === 'word') {
    return `Word: ${val}`;
  }
  if (category === 'confusion' && val) {
    const parts = val.split('-');
    if (parts.length === 2) {
      return `Confusion: ${parts[0]} vs ${parts[1]}`;
    }
  }
  
  // Fallback: capitalize first word
  return category.charAt(0).toUpperCase() + category.slice(1) + (val ? `: ${val}` : '');
}

function formatRelativeTime(ms: number): string {
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
}

// ─────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────

export const ParentGamesProgress: FC<ParentGamesProgressProps> = ({
  kidSummaryData,
  gamesCatalog,
  onPracticeClick,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('last-10');
  const [detailDrawerTag, setDetailDrawerTag] = useState<string | null>(null);

  // Extract data
  const summary = kidSummaryData?.summary;
  const progress = kidSummaryData?.progress;
  
  const stage = summary?.stage;
  const confidenceNow = summary?.confidenceNow ?? null;
  const trendLabel = summary?.trendLabel ?? null;
  const trendDelta = summary?.trendDelta ?? null;
  const recommendedNext = summary?.recommendedNext;
  const improvementTop = summary?.improvementTop ?? summary?.weakTop ?? [];
  const lastSessionWeakTop = summary?.lastSessionWeakTop ?? [];
  const gamesStats = summary?.games ?? {};
  const byGame = progress?.byGame ?? {};
  const lastUpdatedAt = summary?.lastUpdatedAt?.toMillis();

  // Build last session wrong map
  const lastSessionWrongByTag = useMemo(() => {
    const map: Record<string, number> = {};
    for (const entry of lastSessionWeakTop) {
      if (entry.tag && entry.wrong > 0) {
        map[entry.tag] = entry.wrong;
      }
    }
    return map;
  }, [lastSessionWeakTop]);

  // Filter improvement areas by timeframe
  const filteredImprovementAreas = useMemo(() => {
    let filtered = improvementTop.filter((x) => (x?.wrong ?? 0) > 0);
    
    if (timeframe === 'this-week') {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfWeekMs = startOfWeek.getTime();
      
      filtered = filtered.filter((x) => {
        if (!x.lastSeenAt) return false;
        const lastSeenMs = x.lastSeenAt.toMillis();
        return lastSeenMs >= startOfWeekMs;
      });
    }
    
    // Cap at 8 chips
    return filtered.slice(0, 8);
  }, [improvementTop, timeframe]);

  // Active games only
  const activeGames = useMemo(() => {
    return gamesCatalog.filter((g) => g.active !== false).slice(0, 10);
  }, [gamesCatalog]);

  // ─────────────────────────────────────────────────────────────────
  // 1) Journey Card
  // ─────────────────────────────────────────────────────────────────
  const renderJourneyCard = () => {
    const currentStage = stage?.currentStageId ?? 1;
    const stagePct = stage?.stageProgressPct ?? 0;
    
    const stages = [
      { id: 1, label: 'Foundation' },
      { id: 2, label: 'Building' },
      { id: 3, label: 'Advancing' },
      { id: 4, label: 'Mastering' },
    ];

    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Learning Journey</h3>
        <div className="space-y-3">
          {stages.map((s) => {
            const isCurrent = s.id === currentStage;
            const isCompleted = s.id < currentStage;
            const pct = isCurrent ? stagePct : isCompleted ? 100 : 0;
            
            return (
              <div key={s.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className={cn(
                    'font-medium',
                    isCurrent && 'text-blue-600 dark:text-blue-400',
                    isCompleted && 'text-green-600 dark:text-green-400',
                    !isCurrent && !isCompleted && 'text-gray-500 dark:text-gray-400'
                  )}>
                    Stage {s.id}: {s.label}
                    {isCurrent && ' (Current)'}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{pct}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-2 rounded-full transition-all',
                      isCurrent && 'bg-blue-500',
                      isCompleted && 'bg-green-500',
                      !isCurrent && !isCompleted && 'bg-gray-300'
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  // ─────────────────────────────────────────────────────────────────
  // 2) Confidence Now Card
  // ─────────────────────────────────────────────────────────────────
  const renderConfidenceCard = () => {
    const conf = confidenceNow ?? 0;
    const trend = trendLabel ?? null;
    const delta = trendDelta ?? 0;
    
    let confColor = 'text-gray-600 dark:text-gray-400';
    if (conf >= 70) confColor = 'text-green-600 dark:text-green-400';
    else if (conf >= 40) confColor = 'text-yellow-600 dark:text-yellow-400';
    else confColor = 'text-orange-600 dark:text-orange-400';

    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Confidence Now</h3>
        <div className="flex items-center gap-4">
          <div className={cn('text-5xl font-bold', confColor)}>{conf}</div>
          <div className="flex-1">
            <div className="text-sm text-gray-600 dark:text-gray-400">out of 100</div>
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                {delta > 0 && (
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
                {delta < 0 && (
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {trend} {Math.abs(delta) > 0 && `(${delta > 0 ? '+' : ''}${delta})`}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  // ─────────────────────────────────────────────────────────────────
  // 3) Improvement Areas Card
  // ─────────────────────────────────────────────────────────────────
  const renderImprovementAreasCard = () => {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Improvement Areas</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">Skills to practice more</span>
        </div>
        
        {filteredImprovementAreas.length === 0 ? (
          <div className="text-center py-6 text-green-600 dark:text-green-400">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">All skills are confident!</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Keep up the excellent work!</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {filteredImprovementAreas.map((skill, idx) => {
              const lastSessionWrong = lastSessionWrongByTag[skill.tag];
              
              return (
                <button
                  key={skill.tag || idx}
                  type="button"
                  onClick={() => setDetailDrawerTag(skill.tag)}
                  className="inline-flex flex-col gap-1 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {formatTagLabel(skill.tag)}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-semibold text-orange-800 dark:text-orange-200 bg-orange-200 dark:bg-orange-900/50 rounded">
                      {skill.wrongRate}%
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      ({skill.wrong}/{skill.attempts})
                    </span>
                  </div>
                  
                  {lastSessionWrong !== undefined && (
                    <span className="text-xs text-gray-600 dark:text-gray-400 italic">
                      Last session: {lastSessionWrong} wrong tries
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Card>
    );
  };

  // ─────────────────────────────────────────────────────────────────
  // 4) Recommended Next Card
  // ─────────────────────────────────────────────────────────────────
  const renderRecommendedNextCard = () => {
    if (!recommendedNext || !recommendedNext.gameId) {
      return (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Recommended Next</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No specific recommendation yet. Keep practicing!
          </p>
        </Card>
      );
    }

    const game = gamesCatalog.find((g) => g.id === recommendedNext.gameId);
    const gameTitle = game?.title || recommendedNext.gameId;

    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Recommended Next</h3>
        <div className="space-y-3">
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{gameTitle}</div>
            {recommendedNext.levelId && (
              <div className="text-sm text-gray-600 dark:text-gray-400">Level: {recommendedNext.levelId}</div>
            )}
            {recommendedNext.reason && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{recommendedNext.reason}</div>
            )}
            {recommendedNext.estMinutes && (
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">~{recommendedNext.estMinutes} min</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onPracticeClick?.(recommendedNext.gameId, recommendedNext.levelId)}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Practice Now
          </button>
        </div>
      </Card>
    );
  };

  // ─────────────────────────────────────────────────────────────────
  // 5) Game Progress Grid (10 games)
  // ─────────────────────────────────────────────────────────────────
  const renderGameProgressGrid = () => {
    if (activeGames.length === 0) {
      return (
        <Card className="p-8 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No games available yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Games will appear here once configured</p>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Game Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeGames.map((game) => {
            const gameId = game.id;
            const stats = gamesStats[gameId];
            const gameProgress = byGame[gameId];
            
            const plays = stats?.plays ?? 0;
            const bestAccuracy = stats?.bestAccuracy ?? null;
            const avgAccuracy = stats?.avgAccuracy ?? null;
            const completedLevels = gameProgress?.completedLevels ?? 0;
            const totalLevels = gameProgress?.totalLevels ?? 0;
            const lastPlayedMs = stats?.lastPlayedAt?.toMillis() ?? gameProgress?.lastPlayedAt?.toMillis() ?? null;

            return (
              <Card key={gameId} className="p-4 space-y-2">
                <div className="font-medium text-gray-900 dark:text-gray-100">{game.title}</div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Plays</div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{plays}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Levels</div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {completedLevels}/{totalLevels || '?'}
                    </div>
                  </div>
                  
                  {bestAccuracy !== null && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Best</div>
                      <div className="font-semibold text-green-600 dark:text-green-400">{bestAccuracy}%</div>
                    </div>
                  )}
                  
                  {avgAccuracy !== null && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Avg</div>
                      <div className="font-semibold text-blue-600 dark:text-blue-400">{avgAccuracy}%</div>
                    </div>
                  )}
                </div>
                
                {lastPlayedMs && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Last: {formatRelativeTime(lastPlayedMs)}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────
  // 6) Detail Drawer
  // ─────────────────────────────────────────────────────────────────
  const renderDetailDrawer = () => {
    if (!detailDrawerTag) return null;
    
    const skill = filteredImprovementAreas.find((x) => x.tag === detailDrawerTag);
    if (!skill) return null;

    return (
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => setDetailDrawerTag(null)}
      >
        <div
          className="absolute right-0 top-0 bottom-0 w-full md:w-96 bg-white dark:bg-gray-800 shadow-lg overflow-y-auto p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Skill Details</h3>
            <button
              type="button"
              onClick={() => setDetailDrawerTag(null)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Skill</div>
              <div className="text-lg font-medium text-gray-900 dark:text-gray-100">{formatTagLabel(skill.tag)}</div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{skill.attempts}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Attempts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{skill.correct}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Correct</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{skill.wrong}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Wrong</div>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Accuracy</div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-4 bg-green-500 rounded-full"
                  style={{ width: `${100 - skill.wrongRate}%` }}
                />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 text-right">
                {100 - skill.wrongRate}%
              </div>
            </div>
            
            {lastSessionWrongByTag[skill.tag] !== undefined && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Last Session</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {lastSessionWrongByTag[skill.tag]} wrong tries
                </div>
              </div>
            )}
            
            <button
              type="button"
              onClick={() => {
                setDetailDrawerTag(null);
                // Could trigger practice mode here if needed
              }}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              Practice This Skill
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────
  // Render: Header + 6 Sections
  // ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header: Timeframe Toggle + Updated Timestamp */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
          <button
            type="button"
            onClick={() => setTimeframe('this-week')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-l-lg transition-colors',
              timeframe === 'this-week'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
            )}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('last-10')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-x border-gray-300 dark:border-gray-600',
              timeframe === 'last-10'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
            )}
          >
            Last 10 Sessions
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('all-time')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-r-lg transition-colors',
              timeframe === 'all-time'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
            )}
          >
            All Time
          </button>
        </div>
        
        {lastUpdatedAt && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Updated: {formatRelativeTime(lastUpdatedAt)}
          </div>
        )}
      </div>

      {/* Row 1: Journey + Confidence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderJourneyCard()}
        {renderConfidenceCard()}
      </div>

      {/* Row 2: Improvement Areas */}
      {renderImprovementAreasCard()}

      {/* Row 3: Recommended Next */}
      {renderRecommendedNextCard()}

      {/* Row 4: Game Progress Grid */}
      {renderGameProgressGrid()}

      {/* Detail Drawer (overlay) */}
      {renderDetailDrawer()}
    </div>
  );
};
