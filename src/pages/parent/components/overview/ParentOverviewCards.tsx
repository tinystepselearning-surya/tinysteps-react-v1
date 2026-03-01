// src/pages/parent/components/overview/ParentOverviewCards.tsx
// Parent-friendly overview cards showing key metrics

import { type FC, useState, useRef, useEffect } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { masteryLabel, masteryPctFromKey } from '../../../../lib/mastery';

interface ParentOverviewCardsProps {
  confidenceNow: number | null;
  gamesCompleted: number | null;
  avgScore: number | null;
  totalPoints: number | null;
  stageMessage?: string;
  lastUpdatedAt?: number | null;
  currentStageId?: number | null;
  stageProgressPct?: number | null;
}

// Learning Journey stages with expanded content
const LEARNING_STAGES = [
  {
    id: 1,
    label: 'Sound Foundations',
    shortLabel: 'Sounds',
    emoji: '🎵',
    goal: 'Master individual letter sounds and build phonemic awareness',
    learnBullets: [
      'Recognize all 26 letter sounds',
      'Distinguish between similar sounds',
      'Connect sounds to letters confidently'
    ],
    activities: [
      'Letter Sound Match game',
      'Sound Detective challenges',
      'Balloon Pop phonics practice'
    ]
  },
  {
    id: 2,
    label: 'My First Words',
    shortLabel: 'Blends',
    emoji: '🔗',
    goal: 'Learn to combine sounds smoothly and recognize common blends',
    learnBullets: [
      'Blend consonants together (bl, cr, st)',
      'Smooth sound transitions',
      'Identify blends in words'
    ],
    activities: [
      'Blend Slide interactive game',
      'Blend Build word creator',
      'Sound Sequencer practice'
    ]
  },
  {
    id: 3,
    label: 'CVC Word Reader',
    shortLabel: 'CVC Words',
    emoji: '🧩',
    goal: 'Decode simple consonant-vowel-consonant words independently',
    learnBullets: [
      'Read CVC words (cat, dog, sit)',
      'Sound out short vowel patterns',
      'Build reading confidence'
    ],
    activities: [
      'CVC Word Builder game',
      'Word Quest challenges',
      'Rhyme Time activities'
    ]
  },
  {
    id: 4,
    label: 'Early Reader Fluency',
    shortLabel: 'Fluency',
    emoji: '⚡',
    goal: 'Increase reading speed and accuracy with practice',
    learnBullets: [
      'Read with speed and accuracy',
      'Recognize sight words instantly',
      'Build reading stamina'
    ],
    activities: [
      'Vowel Explorer games',
      'Timed reading challenges',
      'Fluency practice sessions'
    ]
  },
  {
    id: 5,
    label: 'Rules Track',
    shortLabel: 'Rules',
    emoji: '📘',
    goal: 'Master phonics rules and spelling patterns',
    learnBullets: [
      'Learn silent e and vowel teams',
      'Understand phonics rules',
      'Apply patterns to new words'
    ],
    activities: [
      'Rules-based word games',
      'Pattern recognition practice',
      'Spelling challenges'
    ]
  },
  {
    id: 6,
    label: 'Confident Reader',
    shortLabel: 'Confident',
    emoji: '🌟',
    goal: 'Read fluently with comprehension and expression',
    learnBullets: [
      'Read longer texts smoothly',
      'Understand what you read',
      'Express yourself confidently'
    ],
    activities: [
      'Story Builder activities',
      'Reading comprehension games',
      'Creative reading challenges'
    ]
  },
];

export const ParentOverviewCards: FC<ParentOverviewCardsProps> = ({
  confidenceNow,
  gamesCompleted,
  avgScore,
  totalPoints,
  stageMessage,
  lastUpdatedAt,
  currentStageId,
  stageProgressPct,
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

  // Helper to get next milestone message
  const getNextMilestone = (stageId: number | null | undefined, progressPct: number | null | undefined): string => {
    if (!stageId || stageId < 1 || stageId > 6) return 'Complete first activities to begin your journey';
    
    const progress = progressPct ?? 0;
    const stageName = LEARNING_STAGES[stageId - 1].label;
    
    if (progress < 25) return `Build foundation in ${stageName}`;
    if (progress < 50) return `Halfway through ${stageName}`;
    if (progress < 75) return `Almost there with ${stageName}`;
    if (progress < 100) return `Finish ${stageName} to unlock next stage`;
    
    // 100% complete
    if (stageId === 6) return 'Journey complete! 🎉';
    return `Ready to start ${LEARNING_STAGES[stageId].label}`;
  };

  const hasValidStageId = currentStageId && currentStageId >= 1 && currentStageId <= 6;

  // Horizontal scroll state: track which stage is expanded (default to Stage 1 if no data)
  const [expandedStageId, setExpandedStageId] = useState<number>(hasValidStageId ? currentStageId : 1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  // Helper to get stage status
  const getStageStatus = (stageId: number): 'done' | 'in-progress' | 'not-started' => {
    if (!hasValidStageId) return 'not-started';
    if (stageId < currentStageId) return 'done';
    if (stageId === currentStageId) return (stageProgressPct ?? 0) > 0 ? 'in-progress' : 'not-started';
    return 'not-started';
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Confidence Card */}
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Confidence</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {confidenceNow !== null ? masteryLabel(confidenceNow) : '—'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">recent sessions</div>
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
            {avgScore !== null ? masteryLabel(avgScore) : '—'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">accuracy level</div>
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

      {/* Learning Journey Card - Premium Hero Card */}
      <Card className="relative overflow-hidden p-0 bg-gradient-to-br from-sky-50 via-indigo-50 to-orange-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/30 shadow-lg">
        {/* Decorative Background Blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200/30 to-purple-300/20 dark:from-indigo-600/10 dark:to-purple-700/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-sky-200/30 to-blue-300/20 dark:from-sky-600/10 dark:to-blue-700/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        
        <div className="relative p-6 md:p-8">
          {/* Header with Decorative Panel */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Learning Journey</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your child&apos;s path to reading success</p>
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
                    Start your child&apos;s phonics journey with sound foundations and watch them progress through 6 stages to confident reading.
                  </p>
                  
                  {/* Feature Chips */}
                  <div className="flex flex-wrap gap-2">
                    <div className="px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-indigo-200 dark:border-indigo-800 text-sm font-medium text-indigo-700 dark:text-indigo-300">
                      📚 6 Stages
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
                        Stage {currentStageId}: {LEARNING_STAGES[currentStageId - 1].label}
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
                        <span>{getNextMilestone(currentStageId, stageProgressPct)}</span>
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
                        Complete 1 level in <span className="font-bold text-indigo-700 dark:text-indigo-300">{LEARNING_STAGES[currentStageId - 1].label}</span>
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
                              Stage {stage.id} of 6
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        {/* Status Badge */}
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            status === 'done'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : status === 'in-progress'
                              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {status === 'done' ? '✓ Done' : status === 'in-progress' ? '⏳ In progress' : 'Getting started'}
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
                                Stage {stage.id} of 6
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
