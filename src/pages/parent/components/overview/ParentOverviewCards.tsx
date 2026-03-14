// src/pages/parent/components/overview/ParentOverviewCards.tsx
// Parent-friendly overview cards showing key metrics

import { type FC, useState, useRef, useEffect } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { masteryLabel, masteryPctFromKey } from '../../../../lib/mastery';
import { FRONTEND_JOURNEY_STAGE_COUNT, FRONTEND_JOURNEY_STAGES } from '../../../../lib/frontendJourneyStages';

interface ParentOverviewCardsProps {
  confidenceNow: number | null;
  gamesCompleted: number | null;
  avgScore: number | null;
  totalPoints: number | null;
  totalTimePractisedMs?: number | null;
  stageMessage?: string;
  lastUpdatedAt?: number | null;
  currentStageId?: number | null;
  stageProgressPct?: number | null;
  variant?: 'full' | 'compact';
}

type LearningStageDetails = {
  emoji: string;
  goal: string;
  learnBullets: string[];
  activities: string[];
};

const LEARNING_STAGE_DETAILS: Record<number, LearningStageDetails> = {
  1: {
    emoji: '🔤',
    goal: 'Build strong letter-sound recognition and phonemic awareness',
    learnBullets: [
      'Recognize core letter sounds',
      'Match sounds to letters confidently',
      'Hear and identify sound differences'
    ],
    activities: [
      'Letter Sound Match',
      'Sound Detective',
      'Letter Tracing with Sounds'
    ]
  },
  2: {
    emoji: '🔗',
    goal: 'Blend sounds and decode early word patterns',
    learnBullets: [
      'Combine simple sound chunks',
      'Read short blended words',
      'Strengthen decoding flow'
    ],
    activities: [
      'My First Words checkpoints',
      'Tap and Slide blend practice',
      'Early blend drills'
    ]
  },
  3: {
    emoji: '🧩',
    goal: 'Arrange and read meaningful sentences with confidence',
    learnBullets: [
      'Build sentence order correctly',
      'Read short sentences smoothly',
      'Use context to complete sentences'
    ],
    activities: [
      'Sentence Stepper',
      'Read Sentences',
      'Sentence Builder packs'
    ]
  },
  4: {
    emoji: '⚡',
    goal: 'Improve reading flow, understanding, and consistency',
    learnBullets: [
      'Read connected text more smoothly',
      'Track meaning while reading',
      'Build stamina for longer passages'
    ],
    activities: [
      'Story Reading',
      'Comprehension and New Words',
      'Fluent Reading practice'
    ]
  },
  5: {
    emoji: '📘',
    goal: 'Strengthen sentence accuracy and grammar control',
    learnBullets: [
      'Fix grammar errors confidently',
      'Build stronger sentence structure',
      'Use collocations and usage patterns'
    ],
    activities: [
      'Grammar Fix',
      'Build Better Sentences',
      'Collocation Builder'
    ]
  },
  6: {
    emoji: '🎤',
    goal: 'Practice clear speaking and verbal confidence',
    learnBullets: [
      'Speak clearly with structure',
      'Build confidence in oral responses',
      'Prepare for presentation skills'
    ],
    activities: [
      'Speaking practice routines',
      'Argument practice drills',
      'Presentation readiness tasks'
    ]
  },
  7: {
    emoji: '🏆',
    goal: 'Consolidate all skills through review and final challenge',
    learnBullets: [
      'Review across reading, grammar, and speaking',
      'Close remaining weak spots',
      'Demonstrate consistent mastery'
    ],
    activities: [
      'Cross-stage review challenges',
      'Mixed skill checkpoints',
      'Championship finale'
    ]
  },
};

const LEARNING_STAGES = FRONTEND_JOURNEY_STAGES.map((stage) => ({
  ...stage,
  ...LEARNING_STAGE_DETAILS[stage.id],
}));

const TOTAL_JOURNEY_STAGES = FRONTEND_JOURNEY_STAGE_COUNT;

export const ParentOverviewCards: FC<ParentOverviewCardsProps> = ({
  confidenceNow,
  gamesCompleted,
  avgScore,
  totalPoints,
  totalTimePractisedMs,
  stageMessage,
  lastUpdatedAt,
  currentStageId,
  stageProgressPct,
  variant = 'full',
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

  const formatDurationShort = (ms: number): string => {
    const safeMs = Math.max(0, Math.floor(ms));
    const totalMin = Math.floor(safeMs / 60000);
    if (totalMin <= 0) return '0m';
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h <= 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  // Helper to get next milestone message
  const getNextMilestone = (stageId: number | null | undefined, progressPct: number | null | undefined): string => {
    if (!stageId || stageId < 1 || stageId > TOTAL_JOURNEY_STAGES) return 'Complete first activities to begin your journey';
    
    const progress = progressPct ?? 0;
    const stageName = LEARNING_STAGES[stageId - 1].label;
    
    if (progress < 25) return `Build foundation in ${stageName}`;
    if (progress < 50) return `Halfway through ${stageName}`;
    if (progress < 75) return `Almost there with ${stageName}`;
    if (progress < 100) return `Finish ${stageName} to unlock next stage`;
    
    // 100% complete
    if (stageId === TOTAL_JOURNEY_STAGES) return 'Journey complete! 🎉';
    return `Ready to start ${LEARNING_STAGES[stageId].label}`;
  };

  const hasValidStageId =
    typeof currentStageId === 'number' &&
    currentStageId >= 1 &&
    currentStageId <= TOTAL_JOURNEY_STAGES;
  const activeStageId = hasValidStageId ? currentStageId : null;

  // Horizontal scroll state: track which stage is expanded (default to Stage 1 if no data)
  const [expandedStageId, setExpandedStageId] = useState<number>(activeStageId ?? 1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  type StageStatus = 'done' | 'in-progress' | 'getting-started' | 'locked';
  const getStageStatus = (stageId: number): StageStatus => {
    if (!hasValidStageId) return stageId === 1 ? 'getting-started' : 'locked';
    if (!activeStageId) return stageId === 1 ? 'getting-started' : 'locked';
    if (stageId < activeStageId) return 'done';
    if (stageId === activeStageId) {
      if (activeStageId === TOTAL_JOURNEY_STAGES && (stageProgressPct ?? 0) >= 100) return 'done';
      if ((stageProgressPct ?? 0) > 0) return 'in-progress';
      return 'getting-started';
    }
    return 'locked';
  };

  const getStageStatusBadge = (status: StageStatus): { label: string; cls: string } => {
    if (status === 'done') {
      return { label: 'Completed', cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' };
    }
    if (status === 'in-progress') {
      return { label: 'In progress', cls: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' };
    }
    if (status === 'getting-started') {
      return { label: 'Getting started', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' };
    }
    return { label: 'Locked', cls: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' };
  };

  const getStageTileTone = (stageId: number): { bg: string; border: string } => {
    const tones = [
      { bg: 'from-emerald-50 via-sky-50 to-indigo-50', border: 'border-emerald-100' },
      { bg: 'from-amber-50 via-orange-50 to-rose-50', border: 'border-amber-100' },
      { bg: 'from-violet-50 via-indigo-50 to-sky-50', border: 'border-violet-100' },
      { bg: 'from-lime-50 via-emerald-50 to-cyan-50', border: 'border-lime-100' },
      { bg: 'from-orange-50 via-yellow-50 to-amber-50', border: 'border-orange-100' },
      { bg: 'from-fuchsia-50 via-rose-50 to-pink-50', border: 'border-fuchsia-100' },
      { bg: 'from-cyan-50 via-sky-50 to-indigo-50', border: 'border-cyan-100' },
    ];
    const idx = Math.max(0, Math.min(tones.length - 1, stageId - 1));
    return tones[idx];
  };

  // Update scroll position state
  const updateScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setIsAtStart(scrollLeft <= 2);
    setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 2);
  };

  // Set up scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateScrollPosition();
    container.addEventListener('scroll', updateScrollPosition);
    
    // Also update on resize
    window.addEventListener('resize', updateScrollPosition);

    return () => {
      container.removeEventListener('scroll', updateScrollPosition);
      window.removeEventListener('resize', updateScrollPosition);
    };
  }, []);

  // Scroll helper functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const isCompact = variant === 'compact';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Confidence Card */}
        <Card className="p-4">
          {confidenceNow !== null ? (
            <>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Confidence</div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {masteryLabel(confidenceNow)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">recent sessions</div>
            </>
          ) : (
            <>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Played</div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {lastUpdatedAt ? formatRelativeTime(lastUpdatedAt) : '—'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">game activity</div>
            </>
          )}
        </Card>

        {/* Games Completed Card */}
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Games Started</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {gamesCompleted !== null ? gamesCompleted : '—'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">games</div>
        </Card>

        {/* Learning Level Card */}
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Learning Level</div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {avgScore !== null ? masteryLabel(avgScore) : '—'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">recent progress</div>
        </Card>

        {/* Total Points Card */}
        <Card className="p-4">
          {totalPoints !== null ? (
            <>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Points</div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {totalPoints.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">points</div>
            </>
          ) : (
            <>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Time Practised</div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {typeof totalTimePractisedMs === 'number' ? formatDurationShort(totalTimePractisedMs) : '—'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">across games</div>
            </>
          )}
        </Card>
      </div>

      {isCompact ? (
        <Card className="p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Learning Journey</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Stage-based path to language confidence.
              </p>
            </div>
            {hasValidStageId ? (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Current: Stage {activeStageId} · {LEARNING_STAGES[(activeStageId || 1) - 1].shortLabel}
              </div>
            ) : (
              <div className="text-xs text-gray-500 dark:text-gray-400">Not started yet</div>
            )}
          </div>

          <div className="mt-4 space-y-4">
            {!hasValidStageId ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900/40 p-4">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Ready to begin?
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Start with Letters & Sounds and watch progress build across 7 stages.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/30 p-4">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">Progress</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {stageProgressPct == null ? '—' : masteryLabel(stageProgressPct)}
                  </span>
                </div>
                <div className="w-full bg-white dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(masteryPctFromKey(stageProgressPct), 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                  <span>🎯</span>
                  <span>{getNextMilestone(activeStageId, stageProgressPct)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {LEARNING_STAGES.map((stage) => {
              const status = getStageStatus(stage.id);
              const isCurrent = hasValidStageId && activeStageId === stage.id;
              const statusBadge = getStageStatusBadge(status);

              return (
                <div
                  key={stage.id}
                  className={`rounded-xl border bg-gradient-to-br ${getStageTileTone(stage.id).bg} ${getStageTileTone(stage.id).border} dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-4 shadow-sm`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{stage.emoji}</span>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                          {stage.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Stage {stage.id} of {TOTAL_JOURNEY_STAGES}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-[11px] font-medium ${statusBadge.cls}`}
                    >
                      {statusBadge.label}
                    </span>
                  </div>

                  {isCurrent ? (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Progress</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {stageProgressPct == null ? '—' : masteryLabel(stageProgressPct)}
                        </span>
                      </div>
                      <div className="mt-1 w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 h-full rounded-full"
                          style={{ width: `${Math.min(masteryPctFromKey(stageProgressPct), 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card className="relative overflow-hidden p-0 bg-gradient-to-br from-sky-50 via-indigo-50 to-orange-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/30 shadow-lg">
          {/* Decorative Background Blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200/30 to-purple-300/20 dark:from-indigo-600/10 dark:to-purple-700/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-sky-200/30 to-blue-300/20 dark:from-sky-600/10 dark:to-blue-700/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
          
          <div className="relative p-6 md:p-8">
            {/* Header with Decorative Panel */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Learning Journey</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your child&apos;s path to language confidence</p>
              </div>
              
              {/* Right Decorative Panel */}
              <div className="hidden md:flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-br from-indigo-100/80 to-purple-100/80 dark:from-indigo-900/40 dark:to-purple-900/40 backdrop-blur-sm border border-indigo-200/50 dark:border-indigo-800/50">
                <div className="text-3xl">✨</div>
                <div className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Unlock<br/>potential</div>
              </div>
            </div>

            {/* Main Content */}
            <div className="space-y-8">
              {/* Empty State or Active State */}
              {!hasValidStageId ? (
                <div className="space-y-6">
                  {/* Hero Headline + Chips */}
                  <div className="space-y-4">
                    <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
                      Ready to begin?
                    </h3>
                    <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl">
                      Start your child&apos;s journey with Letters & Sounds and progress across 7 stages to Review & Championship.
                    </p>
                    
                    {/* Feature Chips */}
                    <div className="flex flex-wrap gap-2">
                      <div className="px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-indigo-200 dark:border-indigo-800 text-sm font-medium text-indigo-700 dark:text-indigo-300">
                        📚 7 Stages
                      </div>
                      <div className="px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-sky-200 dark:border-sky-800 text-sm font-medium text-sky-700 dark:text-sky-300">
                        ⏱️ 3–5 min/day
                      </div>
                      <div className="px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-purple-200 dark:border-purple-800 text-sm font-medium text-purple-700 dark:text-purple-300">
                        📊 Confidence tracking
                      </div>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md"
                      onClick={() => {
                        window.location.hash = '#/parent?tab=games-progress';
                      }}
                    >
                      🚀 Start Stage 1
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                      onClick={() => {
                        // Could open a modal or info page
                        window.location.hash = '#/parent?tab=games-progress';
                      }}
                    >
                      See how it works
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Active State: Current Stage + Progress */}
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-1 uppercase tracking-wide">Current Stage</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          Stage {activeStageId}: {LEARNING_STAGES[(activeStageId || 1) - 1].label}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span className="font-medium">Progress</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {stageProgressPct == null ? '—' : masteryLabel(stageProgressPct)}
                          </span>
                        </div>
                        <div className="w-full bg-white/60 dark:bg-slate-800/60 rounded-full h-4 overflow-hidden shadow-inner">
                          <div
                            className="bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 dark:from-sky-400 dark:via-indigo-500 dark:to-purple-500 h-full rounded-full transition-all duration-500 shadow-sm"
                            style={{ width: `${Math.min(masteryPctFromKey(stageProgressPct), 100)}%` }}
                          />
                        </div>
                        {/* Next Milestone */}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                          <span>🎯</span>
                          <span>{getNextMilestone(activeStageId, stageProgressPct)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Today's Focus - Premium Style */}
                    <div className="lg:w-72">
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-white/90 to-indigo-50/90 dark:from-slate-800/90 dark:to-indigo-950/80 backdrop-blur-sm border border-indigo-200 dark:border-indigo-800 shadow-md space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="text-lg">🎯</div>
                          <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                            Today&apos;s Focus
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          Complete 1 level in <span className="font-bold text-indigo-700 dark:text-indigo-300">{LEARNING_STAGES[(activeStageId || 1) - 1].label}</span>
                        </div>
                        <Button 
                          size="sm"
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md"
                          onClick={() => {
                            window.location.hash = '#/parent?tab=games-progress';
                          }}
                        >
                          {(stageProgressPct ?? 0) > 0 ? '▶️ Resume' : '🚀 Start'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Horizontal Stage Cards (Always Visible) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">All Stages</h4>
                    
                    {/* Scroll Hint - Only show when not at end */}
                    {!isAtEnd && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <span className="hidden md:inline">Scroll for more</span>
                        <span className="md:hidden">Swipe to see more stages</span>
                        <span>→</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Desktop Scroll Arrows */}
                  <div className="hidden md:flex items-center gap-2">
                    <button
                      onClick={scrollLeft}
                      disabled={isAtStart}
                      className={`p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 transition-colors ${
                        isAtStart 
                          ? 'opacity-40 cursor-not-allowed' 
                          : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                      aria-label="Scroll left"
                    >
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={scrollRight}
                      disabled={isAtEnd}
                      className={`p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 transition-colors ${
                        isAtEnd 
                          ? 'opacity-40 cursor-not-allowed' 
                          : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                      aria-label="Scroll right"
                    >
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Horizontal Scroll Container with Gradient Fade */}
                <div className="relative">
                  <div
                    ref={scrollContainerRef}
                    className="flex gap-3 overflow-x-auto snap-x snap-mandatory py-2 pr-8 scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {LEARNING_STAGES.map((stage) => {
                      const status = getStageStatus(stage.id);
                      const isSelected = expandedStageId === stage.id;
                      const statusBadge = getStageStatusBadge(status);
                    
                    return (
                      <button
                        key={stage.id}
                        onClick={() => setExpandedStageId(isSelected ? 0 : stage.id)}
                        className={`flex-shrink-0 w-[260px] md:w-[300px] p-4 rounded-xl snap-start transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-white to-indigo-50 dark:from-slate-800 dark:to-indigo-950 border-2 border-indigo-300 dark:border-indigo-700 shadow-lg'
                            : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl flex-shrink-0">{stage.emoji}</span>
                            <div className="text-left">
                              <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                                {stage.label}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Stage {stage.id} of {TOTAL_JOURNEY_STAGES}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          {/* Status Badge */}
                          <div
                            className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.cls}`}
                          >
                            {statusBadge.label}
                          </div>
                          
                          {/* View indicator */}
                          <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                            {isSelected ? '▲' : 'View'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  </div>

                  {/* Right-edge Gradient Fade Overlay - Only show when not at end */}
                  {!isAtEnd && (
                    <div 
                      className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-sky-50 via-sky-50/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 dark:to-transparent pointer-events-none"
                    />
                  )}
                </div>

                {/* Expanded Details Panel (Below the row) */}
                {expandedStageId > 0 && (
                  <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800 shadow-md">
                    {(() => {
                      const stage = LEARNING_STAGES.find(s => s.id === expandedStageId);
                      if (!stage) return null;
                      
                      return (
                        <div className="space-y-5">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-4xl">{stage.emoji}</span>
                              <div>
                                <h5 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                  {stage.label}
                                </h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  Stage {stage.id} of {TOTAL_JOURNEY_STAGES}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setExpandedStageId(0)}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                              aria-label="Close"
                            >
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          {/* Goal */}
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                              Goal
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                              {stage.goal}
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-5">
                            {/* You'll Learn */}
                            <div>
                              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                You&apos;ll Learn
                              </div>
                              <ul className="space-y-2">
                                {stage.learnBullets.map((bullet, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <span className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5">✓</span>
                                    <span>{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Example Activities */}
                            <div>
                              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                Example Activities
                              </div>
                              <ul className="space-y-2">
                                {stage.activities.map((activity, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <span className="text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5">→</span>
                                    <span>{activity}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* CTA Buttons */}
                          <div className="flex flex-wrap gap-3 pt-2">
                            <Button
                              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md"
                              onClick={() => {
                                window.location.hash = '#/parent?tab=games-progress';
                              }}
                            >
                              🎮 Play this stage
                            </Button>
                            <Button
                              variant="outline"
                              className="border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                              onClick={() => {
                                window.location.hash = '#/parent?tab=games-progress';
                              }}
                            >
                              See games
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </Card>
                )}
              </div>

              {/* What You'll Unlock - Mini Feature Cards (Always Visible) */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">What You&apos;ll Unlock</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Feature 1 */}
                  <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-indigo-100 dark:border-indigo-900/50 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">🎮</div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">Play Games</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Earn points & rewards</div>
                      </div>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-sky-100 dark:border-sky-900/50 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">📈</div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">Track Accuracy</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">See detailed progress</div>
                      </div>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-purple-100 dark:border-purple-900/50 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">✨</div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">Stage Insights</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Parent dashboard</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

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
