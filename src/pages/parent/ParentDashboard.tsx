// src/pages/parent/ParentDashboard.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebaseConfig';
import { signOut } from 'firebase/auth';
import { ParentGamesProgress } from './components/progress/ParentGamesProgress';
import { ParentOverviewCards } from './components/overview/ParentOverviewCards';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type TabKey = 'dashboard' | 'games-progress' | 'skills' | 'weekly' | 'profile' | 'payments';

function safeTab(value: string | null): TabKey {
  const validTabs: TabKey[] = ['dashboard', 'games-progress', 'skills', 'weekly', 'profile', 'payments'];
  // Redirect legacy 'reports' tab to dashboard
  if (value === 'reports') return 'dashboard';
  return validTabs.includes(value as TabKey) ? (value as TabKey) : 'dashboard';
}

export default function ParentDashboard() {
  const { user, isLoading, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearUser();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const activeTab = safeTab(searchParams.get('tab'));

  const setTab = (tab: TabKey) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  useEffect(() => {
    if (!isLoading && !user) navigate('/login');
  }, [isLoading, user, navigate]);

  const kidsQuery = useQuery({
    queryKey: ['parentKids', user?.uid],
    enabled: !!user?.uid,
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, 'kids'), where('parentIds', 'array-contains', user.uid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    },
  });

  const kids = kidsQuery.data ?? [];
  const [selectedKidId, setSelectedKidId] = useState<string>('');

  // Skills tab state (moved to component level to avoid Suspense issues)
  const [selectedSkillStageId, setSelectedSkillStageId] = useState<string | null>(null);
  const skillsScrollContainerRef = useRef<HTMLDivElement>(null);
  const [skillsScrollAtEnd, setSkillsScrollAtEnd] = useState(false);
  const [skillsViewMode, setSkillsViewMode] = useState<'scroll' | 'list'>('scroll');

  // Payments tab state
  const [showQrModal, setShowQrModal] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  useEffect(() => {
    if (!selectedKidId && kids.length > 0) setSelectedKidId(kids[0].id);
  }, [kids, selectedKidId]);

  const selectedKid = useMemo(
    () => kids.find((k: any) => k.id === selectedKidId),
    [kids, selectedKidId]
  );

  // NOTE: This is just reading ONE document to keep it simple.
  const kidSummaryQuery = useQuery({
    queryKey: ['kidSummary', selectedKidId],
    enabled: !!selectedKidId,
    queryFn: async () => {
      if (!selectedKidId) return null;
      // If your summary is stored elsewhere, update this path.
      // Keeping it as kids/{id} to avoid touching other files.
      const snap = await getDoc(doc(db, 'kids', selectedKidId));
      return snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as any) : null;
    },
  });

  const gamesCatalogQuery = useQuery({
    queryKey: ['gamesCatalog'],
    queryFn: async () => {
      // If your catalog is at config/gamesCatalog, keep it.
      const snap = await getDoc(doc(db, 'config', 'gamesCatalog'));
      const data = snap.exists() ? (snap.data() as any) : null;
      // normalize to array
      return Array.isArray(data?.games) ? data.games : [];
    },
  });

  const paymentsConfigQuery = useQuery({
    queryKey: ['paymentsConfig'],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'config', 'payments'));
      return snap.exists() ? (snap.data() as any) : null;
    },
  });

  // Compute overview metrics
  const overviewMetrics = useMemo(() => {
    const data = kidSummaryQuery.data;
    if (!data) return null;

    const summary = data.summary;
    const progress = data.progress;

    // Confidence
    const confidenceNow = summary?.confidenceNow ?? null;

    // Games completed (games with completedLevels > 0)
    const byGame = progress?.byGame || {};
    const gamesCompleted = Object.values(byGame).filter(
      (g: any) => (g?.completedLevels ?? 0) > 0
    ).length;

    // Average score (average of avgAccuracy from summary.games)
    const gamesStats = summary?.games || {};
    const accuracies = Object.values(gamesStats)
      .map((g: any) => g?.avgAccuracy)
      .filter((a): a is number => typeof a === 'number');
    const avgScore = accuracies.length > 0
      ? accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length
      : null;

    // Total points
    const totalPoints = summary?.totalPoints ?? null;

    // Stage message
    const stageId = summary?.stage?.currentStageId;
    const stageProgressPct = summary?.stage?.stageProgressPct ?? null;
    let stageMessage = 'Keep practicing to unlock new challenges!';
    if (stageId === 1) stageMessage = 'Building foundation skills';
    else if (stageId === 2) stageMessage = 'Growing stronger every day';
    else if (stageId === 3) stageMessage = 'Making excellent progress';
    else if (stageId === 4) stageMessage = 'Mastering advanced concepts';

    // Last updated
    const lastUpdatedAt = summary?.lastUpdatedAt?.toMillis?.() ?? null;

    return {
      confidenceNow,
      gamesCompleted,
      avgScore,
      totalPoints,
      stageMessage,
      lastUpdatedAt,
      currentStageId: stageId ?? null,
      stageProgressPct,
    };
  }, [kidSummaryQuery.data]);

  // Skills scroll position tracking effect
  useEffect(() => {
    const updateSkillsScrollPosition = () => {
      if (!skillsScrollContainerRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = skillsScrollContainerRef.current;
      setSkillsScrollAtEnd(scrollLeft + clientWidth >= scrollWidth - 2);
    };

    const container = skillsScrollContainerRef.current;
    if (!container) return;

    updateSkillsScrollPosition();
    container.addEventListener('scroll', updateSkillsScrollPosition);
    window.addEventListener('resize', updateSkillsScrollPosition);

    return () => {
      container.removeEventListener('scroll', updateSkillsScrollPosition);
      window.removeEventListener('resize', updateSkillsScrollPosition);
    };
  }, [activeTab]); // Re-run when tab changes to ensure correct state

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }
  if (!user) return null;

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      {/* Minimal header */}
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Hi, {user?.displayName || 'Parent'} 👋
                </h1>
                {selectedKid && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Viewing: {selectedKid.fullName || 'Child'}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="md:hidden"
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Kid selector */}
          <div className="w-full md:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Select Child
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden md:inline-flex text-xs"
              >
                Logout
              </Button>
            </div>

            {kidsQuery.isLoading ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">Loading kids…</div>
            ) : kids.length === 0 ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">No kids linked yet.</div>
            ) : (
              <>
                <select
                  value={selectedKidId}
                  onChange={(e) => setSelectedKidId(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 mb-3"
                >
                  {kids.map((k: any) => (
                    <option key={k.id} value={k.id}>
                      {k.fullName || 'Unnamed'}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={() => navigate(`/kids/games?kidId=${encodeURIComponent(selectedKidId)}`)}
                  disabled={!selectedKidId}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold"
                >
                  Open Games Portal
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="inline-flex flex-wrap rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
          <button
            type="button"
            onClick={() => setTab('dashboard')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setTab('games-progress')}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-700 ${
              activeTab === 'games-progress'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            }`}
          >
            Games Progress
          </button>
          <button
            type="button"
            onClick={() => setTab('skills')}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-700 ${
              activeTab === 'skills'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            }`}
          >
            Skills
          </button>
          <button
            type="button"
            onClick={() => setTab('weekly')}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-700 ${
              activeTab === 'weekly'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            }`}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-700 ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            }`}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => setTab('payments')}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-700 ${
              activeTab === 'payments'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            }`}
          >
            Payments
          </button>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Overview Cards */}
            {overviewMetrics ? (
              <ParentOverviewCards
                confidenceNow={overviewMetrics.confidenceNow}
                gamesCompleted={overviewMetrics.gamesCompleted}
                avgScore={overviewMetrics.avgScore}
                totalPoints={overviewMetrics.totalPoints}
                stageMessage={overviewMetrics.stageMessage}
                lastUpdatedAt={overviewMetrics.lastUpdatedAt}
                currentStageId={overviewMetrics.currentStageId}
                stageProgressPct={overviewMetrics.stageProgressPct}
              />
            ) : (
              <Card className="p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {kidSummaryQuery.isLoading ? 'Loading overview...' : 'No data available yet.'}
                </p>
              </Card>
            )}

            {/* Today's Recommendation */}
            {kidSummaryQuery.data?.summary?.recommendedNext && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Today's Recommendation
                </h3>
                <div className="space-y-2">
                  <div className="font-medium text-blue-600 dark:text-blue-400">
                    {kidSummaryQuery.data.summary.recommendedNext.gameId || 'Practice time!'}
                  </div>
                  {kidSummaryQuery.data.summary.recommendedNext.reason && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {kidSummaryQuery.data.summary.recommendedNext.reason}
                    </p>
                  )}
                  {kidSummaryQuery.data.summary.recommendedNext.estMinutes && (
                    <div className="text-xs text-gray-500">
                      Estimated: {kidSummaryQuery.data.summary.recommendedNext.estMinutes} minutes
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'games-progress' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Games Progress</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedKid?.fullName ? `Viewing: ${selectedKid.fullName}` : 'Select a child'}
              </p>
            </div>

            {kidSummaryQuery.isLoading ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                Loading progress…
              </div>
            ) : (
              <ParentGamesProgress
                kidSummaryData={kidSummaryQuery.data ?? null}
                gamesCatalog={gamesCatalogQuery.data ?? []}
                onPracticeClick={() => {}}
              />
            )}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-4">
            {(() => {
              const weakTop = kidSummaryQuery.data?.summary?.weakTop ?? [];
              const hasSkillData = weakTop.length > 0;

              // Helper to clean tag labels for parents
              const formatTag = (tag: string): string => {
                if (!tag) return '—';
                // "letter:t" -> "Letter T"
                if (tag.startsWith('letter:')) {
                  const letter = tag.split(':')[1]?.toUpperCase() || '';
                  return `Letter ${letter}`;
                }
                // "sound:/s/" -> "Sound /s/"
                if (tag.startsWith('sound:')) {
                  const sound = tag.substring(6); // after "sound:"
                  return `Sound ${sound}`;
                }
                // "subtopic:letter_sounds" -> "Letter Sounds"
                if (tag.startsWith('subtopic:')) {
                  const sub = tag.substring(9).replace(/_/g, ' ');
                  return sub.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                }
                // Fallback: capitalize first letter
                return tag.charAt(0).toUpperCase() + tag.slice(1);
              };

              // Map tag to Learning Journey stage
              const tagToStage = (tag: string): string => {
                if (!tag) return 'Sounds';
                const lower = tag.toLowerCase();
                
                if (lower.startsWith('letter:') || lower.startsWith('sound:') || lower.includes('letter_sounds')) {
                  return 'Sounds';
                }
                if (lower.includes('blending') || lower.startsWith('blend:')) {
                  return 'Blending';
                }
                if (lower.startsWith('cvc:') || lower.startsWith('word:') || lower.includes('cvc')) {
                  return 'CVC Words';
                }
                if (lower.startsWith('rule:') || lower.startsWith('digraph:') || lower.startsWith('magic-e:') || lower.startsWith('floss:') || lower.startsWith('ck:')) {
                  return 'Rules';
                }
                if (lower.startsWith('fluency:') || lower.startsWith('read:') || lower.startsWith('speed:')) {
                  return 'Fluency';
                }
                if (lower.startsWith('story:') || lower.startsWith('sentence:') || lower.startsWith('comprehension:')) {
                  return 'Confident';
                }
                
                return 'Sounds'; // default
              };

              if (!hasSkillData) {
                // Premium empty state
                return (
                  <Card className="p-8 bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950 border border-indigo-100 dark:border-indigo-900/30">
                    <div className="flex flex-col items-center text-center space-y-4 max-w-md mx-auto">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center">
                        <span className="text-3xl">📊</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                          Skills insights are getting ready
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Once your child plays a few levels, you'll see what they're strong at and what needs practice.
                        </p>
                      </div>
                      <Button
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md"
                        onClick={() => setTab('games-progress')}
                      >
                        Play a game
                      </Button>
                    </div>
                  </Card>
                );
              }

              // Group skills by stage
              const stageGroups: Record<string, Array<{ tag: string; wrong: number }>> = {};
              weakTop.forEach((skill: { tag?: string; wrong?: number }) => {
                const tag = skill.tag || '';
                const stage = tagToStage(tag);
                if (!stageGroups[stage]) stageGroups[stage] = [];
                stageGroups[stage].push({
                  tag,
                  wrong: typeof skill.wrong === 'number' ? skill.wrong : 0,
                });
              });

              // Stage metadata
              const stageInfo: Record<string, { emoji: string; helper: string }> = {
                'Sounds': { emoji: '🎵', helper: 'Focus on letter sounds and phonemic awareness' },
                'Blending': { emoji: '🔗', helper: 'Work on combining sounds smoothly' },
                'CVC Words': { emoji: '🧩', helper: 'Practice simple consonant-vowel-consonant words' },
                'Fluency': { emoji: '⚡', helper: 'Build reading speed and accuracy' },
                'Rules': { emoji: '📘', helper: 'Master phonics rules and patterns' },
                'Confident': { emoji: '🌟', helper: 'Strengthen reading comprehension' },
              };

              // Render stage order
              const stageOrder = ['Sounds', 'Blending', 'CVC Words', 'Fluency', 'Rules', 'Confident'];

              return (
                <Card className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Skills</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    {selectedKid?.fullName ? `Viewing: ${selectedKid.fullName}` : 'Select a child'}
                  </p>

                  <div className="space-y-4">
                    {/* Stage Cards with View Toggle */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                          Skills by Stage
                        </h3>
                        
                        <div className="flex items-center gap-3">
                          {/* Scroll hint (only in scroll mode) */}
                          {skillsViewMode === 'scroll' && !skillsScrollAtEnd && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Swipe to see more →
                            </div>
                          )}
                          
                          {/* View mode toggle */}
                          <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
                            <button
                              onClick={() => setSkillsViewMode('scroll')}
                              className={`px-3 py-1 text-xs font-medium transition-colors ${
                                skillsViewMode === 'scroll'
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              Scroll
                            </button>
                            <button
                              onClick={() => setSkillsViewMode('list')}
                              className={`px-3 py-1 text-xs font-medium border-l border-gray-300 dark:border-gray-700 transition-colors ${
                                skillsViewMode === 'list'
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              List
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Conditional rendering based on view mode */}
                      {skillsViewMode === 'scroll' ? (
                        // Horizontal Scroll View
                        <div className="relative">
                          <div
                            ref={skillsScrollContainerRef}
                            className="flex gap-3 overflow-x-auto snap-x snap-mandatory py-2 scrollbar-hide"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                          >
                            {stageOrder.map((stage) => {
                              const skills = stageGroups[stage] || [];
                              const info = stageInfo[stage];
                              const hasSkills = skills.length > 0;
                              const isSelected = selectedSkillStageId === stage;

                              return (
                                <button
                                  key={stage}
                                  onClick={() => setSelectedSkillStageId(isSelected ? null : stage)}
                                  className={`flex-shrink-0 min-w-[260px] md:min-w-[300px] p-4 rounded-xl snap-start transition-all ${
                                    isSelected
                                      ? 'bg-gradient-to-br from-white to-indigo-50 dark:from-slate-800 dark:to-indigo-950 border-2 border-indigo-300 dark:border-indigo-700 shadow-lg'
                                      : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3">
                                      <span className={`text-3xl flex-shrink-0 ${!hasSkills ? 'opacity-50' : ''}`}>
                                        {info?.emoji || '📌'}
                                      </span>
                                      <div className="text-left">
                                        <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                                          {stage}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                          Stage {stageOrder.indexOf(stage) + 1} of 6
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    {/* Status Badge */}
                                    <div
                                      className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                                        hasSkills
                                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                      }`}
                                    >
                                      {hasSkills ? 'Has insights' : 'No data yet'}
                                    </div>

                                    {/* Preview Content */}
                                    {hasSkills ? (
                                      <div className="flex flex-wrap gap-1.5">
                                        {skills.slice(0, 2).map((skill, idx) => (
                                          <div
                                            key={idx}
                                            className="px-2 py-1 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-xs text-orange-800 dark:text-orange-200"
                                          >
                                            {formatTag(skill.tag)}
                                          </div>
                                        ))}
                                        {skills.length > 2 && (
                                          <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                                            +{skills.length - 2} more
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Play a few games to unlock insights
                                      </p>
                                    )}
                                  </div>

                                  {/* View Indicator */}
                                  <div className="mt-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 text-right">
                                    {isSelected ? '▲ Close' : 'View'}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* Right-edge Gradient Fade Overlay */}
                          {!skillsScrollAtEnd && (
                            <div className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 dark:to-transparent pointer-events-none" />
                          )}
                        </div>
                      ) : (
                        // Grid List View
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {stageOrder.map((stage) => {
                            const skills = stageGroups[stage] || [];
                            const info = stageInfo[stage];
                            const hasSkills = skills.length > 0;
                            const isSelected = selectedSkillStageId === stage;

                            return (
                              <button
                                key={stage}
                                onClick={() => setSelectedSkillStageId(isSelected ? null : stage)}
                                className={`p-4 rounded-xl transition-all ${
                                  isSelected
                                    ? 'bg-gradient-to-br from-white to-indigo-50 dark:from-slate-800 dark:to-indigo-950 border-2 border-indigo-300 dark:border-indigo-700 shadow-lg'
                                    : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                  <div className="flex items-center gap-3">
                                    <span className={`text-3xl flex-shrink-0 ${!hasSkills ? 'opacity-50' : ''}`}>
                                      {info?.emoji || '📌'}
                                    </span>
                                    <div className="text-left">
                                      <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                                        {stage}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Stage {stageOrder.indexOf(stage) + 1} of 6
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  {/* Status Badge */}
                                  <div
                                    className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                                      hasSkills
                                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}
                                  >
                                    {hasSkills ? 'Has insights' : 'No data yet'}
                                  </div>

                                  {/* Preview Content */}
                                  {hasSkills ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {skills.slice(0, 2).map((skill, idx) => (
                                        <div
                                          key={idx}
                                          className="px-2 py-1 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-xs text-orange-800 dark:text-orange-200"
                                        >
                                          {formatTag(skill.tag)}
                                        </div>
                                      ))}
                                      {skills.length > 2 && (
                                        <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                                          +{skills.length - 2} more
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Play a few games to unlock insights
                                    </p>
                                  )}
                                </div>

                                {/* View Indicator */}
                                <div className="mt-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 text-right">
                                  {isSelected ? '▲ Close' : 'View'}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Expanded Details Panel (Below the row/grid) */}
                    {selectedSkillStageId && (
                      <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800 shadow-md">
                        {(() => {
                          const skills = stageGroups[selectedSkillStageId] || [];
                          const info = stageInfo[selectedSkillStageId];
                          const hasSkills = skills.length > 0;

                          return (
                            <div className="space-y-5">
                              {/* Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-4xl">{info?.emoji || '📌'}</span>
                                  <div>
                                    <h5 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                      {selectedSkillStageId}
                                    </h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {info?.helper || 'Practice these skills'}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setSelectedSkillStageId(null)}
                                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                  aria-label="Close"
                                >
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>

                              {/* Skills Content */}
                              {hasSkills ? (
                                <>
                                  <div>
                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                      Needs Practice
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {skills.map((skill, idx) => (
                                        <div
                                          key={`${skill.tag}-${idx}`}
                                          className="px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-sm font-medium text-orange-800 dark:text-orange-200"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span>{formatTag(skill.tag)}</span>
                                            {skill.wrong > 0 && (
                                              <span className="text-xs text-orange-600 dark:text-orange-400 font-bold">
                                                {skill.wrong}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <Button
                                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md"
                                      onClick={() => setTab('games-progress')}
                                    >
                                      Practice with games
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Play a few games in this stage to unlock insights.
                                  </p>
                                  <div>
                                    <Button
                                      variant="outline"
                                      className="border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                                      onClick={() => setTab('games-progress')}
                                    >
                                      Practice games
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </Card>
                    )}
                  </div>
                </Card>
              );
            })()}
          </div>
        )}

        {activeTab === 'weekly' && (
          <div className="space-y-4">
            {(() => {
              const summary = kidSummaryQuery.data?.summary;
              const weeklyData = summary?.weekly || null;
              const currentStage = summary?.stage?.currentStageId || 1;
              const weakTop = summary?.weakTop || [];
              
              // Weekly stats (fallback to summary totals if weekly not available)
              const gamesPlayed = weeklyData?.gamesPlayed ?? summary?.gamesPlayed ?? null;
              const levelsCompleted = weeklyData?.levelsCompleted ?? null;
              const avgAccuracy = weeklyData?.avgAccuracy ?? summary?.avgAccuracy ?? null;
              const totalPoints = weeklyData?.totalPoints ?? summary?.totalPoints ?? null;
              
              // 7-day activity (placeholder - would need actual daily data)
              const dailyActivity = weeklyData?.dailyActivity || [];
              const hasActivityData = dailyActivity.length > 0;

              // Stage names
              const stageNames: Record<number, string> = {
                1: 'Stage 1: Sounds',
                2: 'Stage 2: Blending',
                3: 'Stage 3: CVC Words',
                4: 'Stage 4: Fluency',
                5: 'Stage 5: Rules',
                6: 'Stage 6: Confident Reader',
              };
              const stageName = stageNames[currentStage] || 'Stage 1: Sounds';

              // Format tag helper (reuse from Skills tab logic)
              const formatTag = (tag: string): string => {
                if (!tag) return '—';
                if (tag.startsWith('letter:')) {
                  const letter = tag.split(':')[1]?.toUpperCase() || '';
                  return `Letter ${letter}`;
                }
                if (tag.startsWith('sound:')) {
                  const sound = tag.substring(6);
                  return `Sound ${sound}`;
                }
                if (tag.startsWith('subtopic:')) {
                  const sub = tag.substring(9).replace(/_/g, ' ');
                  return sub.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                }
                return tag.charAt(0).toUpperCase() + tag.slice(1);
              };

              return (
                <>
                  <Card className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Weekly</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      {selectedKid?.fullName ? `Viewing: ${selectedKid.fullName}` : 'Select a child'}
                    </p>

                    {/* Weekly Snapshot - 4 compact cards */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                        Weekly Snapshot
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-4 rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Games Played</div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {gamesPlayed !== null ? gamesPlayed : '—'}
                          </div>
                          {gamesPlayed === null && (
                            <div className="text-xs text-gray-400 mt-1">No data yet</div>
                          )}
                        </div>

                        <div className="p-4 rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Levels Done</div>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {levelsCompleted !== null ? levelsCompleted : '—'}
                          </div>
                          {levelsCompleted === null && (
                            <div className="text-xs text-gray-400 mt-1">No data yet</div>
                          )}
                        </div>

                        <div className="p-4 rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Accuracy</div>
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {avgAccuracy !== null ? `${Math.round(avgAccuracy)}%` : '—'}
                          </div>
                          {avgAccuracy === null && (
                            <div className="text-xs text-gray-400 mt-1">No data yet</div>
                          )}
                        </div>

                        <div className="p-4 rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Points</div>
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {totalPoints !== null ? totalPoints : '—'}
                          </div>
                          {totalPoints === null && (
                            <div className="text-xs text-gray-400 mt-1">No data yet</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Weekly Activity - 7-day strip */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                        Weekly Activity
                      </h3>
                      {hasActivityData ? (
                        <div className="flex justify-between gap-2">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                            const dayData = dailyActivity[idx] || { levels: 0 };
                            const levels = dayData.levels || 0;
                            const maxLevels = 10;
                            const heightPct = Math.min((levels / maxLevels) * 100, 100);
                            
                            return (
                              <div key={day} className="flex-1 flex flex-col items-center">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{day}</div>
                                <div className="w-full h-20 bg-gray-100 dark:bg-gray-800 rounded-t relative">
                                  <div
                                    className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-600 to-purple-600 rounded-t transition-all"
                                    style={{ height: `${heightPct}%` }}
                                  />
                                </div>
                                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">
                                  {levels}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 text-center rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Play a game to start your weekly report
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTab('games-progress')}
                          >
                            Browse Games
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* This Week's Focus */}
                  <Card className="p-6 bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950 border border-indigo-100 dark:border-indigo-900/30">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      This Week&apos;s Focus
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Stage</div>
                        <div className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                          {stageName}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Goal</div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          Play 3 short games (10 mins/day)
                        </div>
                      </div>
                      <Button
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md"
                        onClick={() => setTab('games-progress')}
                      >
                        Start practice
                      </Button>
                    </div>
                  </Card>

                  {/* Wins + Needs Practice */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Wins */}
                    <Card className="p-6">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        🎉 Wins
                      </h3>
                      <ul className="space-y-2">
                        {gamesPlayed && gamesPlayed > 0 ? (
                          <>
                            <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
                              <span>Played {gamesPlayed} game{gamesPlayed > 1 ? 's' : ''} this week</span>
                            </li>
                            {levelsCompleted && levelsCompleted > 0 && (
                              <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
                                <span>Completed {levelsCompleted} level{levelsCompleted > 1 ? 's' : ''}</span>
                              </li>
                            )}
                            {avgAccuracy && avgAccuracy >= 70 && (
                              <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
                                <span>Great accuracy at {Math.round(avgAccuracy)}%</span>
                              </li>
                            )}
                          </>
                        ) : (
                          <>
                            <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
                              <span>Ready to start the journey</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
                              <span>All games unlocked and ready</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </Card>

                    {/* Needs Practice */}
                    <Card className="p-6">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        📝 Needs Practice
                      </h3>
                      {weakTop.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {weakTop.slice(0, 3).map((skill: { tag?: string; wrong?: number }, idx: number) => {
                            const tag = skill.tag || '—';
                            const wrong = typeof skill.wrong === 'number' ? skill.wrong : 0;
                            return (
                              <div
                                key={`${tag}-${idx}`}
                                className="px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-sm font-medium text-orange-800 dark:text-orange-200"
                              >
                                <div className="flex items-center gap-2">
                                  <span>{formatTag(tag)}</span>
                                  {wrong > 0 && (
                                    <span className="text-xs text-orange-600 dark:text-orange-400 font-bold">
                                      {wrong}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Play more games to see areas for improvement
                        </p>
                      )}
                    </Card>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Profile</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {selectedKid?.fullName ? `Viewing: ${selectedKid.fullName}` : 'Select a child'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This section will show insights once backend rollups are enabled.
              </p>
            </Card>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-4">
            {(() => {
              const membership = selectedKid?.membership;
              const startDate = membership?.startDate?.toDate?.() || null;
              const endDate = membership?.endDate?.toDate?.() || null;
              const today = new Date();
              const isActive = endDate && today <= endDate;
              const paymentsConfig = paymentsConfigQuery.data;
              const qrUrl = paymentsConfig?.upiQrUrl || null;
              const adminWhatsApp = paymentsConfig?.adminWhatsApp || '919876543210';

              const handleConfirmPayment = async () => {
                setConfirmingPayment(true);
                
                // Create payment confirmation record
                try {
                  await addDoc(collection(db, 'paymentConfirmations'), {
                    parentUid: user?.uid || null,
                    parentName: user?.displayName || user?.email || 'Unknown',
                    childId: selectedKid?.id || null,
                    childName: selectedKid?.fullName || 'Unknown',
                    membershipStartDate: startDate,
                    membershipEndDate: endDate,
                    createdAt: serverTimestamp(),
                    status: 'pending',
                  });
                } catch (error) {
                  console.error('Failed to create payment confirmation:', error);
                }

                // Open WhatsApp
                const childName = selectedKid?.fullName || 'my child';
                const startStr = startDate ? startDate.toLocaleDateString('en-IN') : 'N/A';
                const endStr = endDate ? endDate.toLocaleDateString('en-IN') : 'N/A';
                const message = `Hi, I paid Tiny Steps membership for ${childName}. Membership: ${startStr} to ${endStr}. I am attaching the payment screenshot.`;
                const whatsappUrl = `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
                
                setConfirmingPayment(false);
              };

              return (
                <>
                  <Card className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Payments</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      {selectedKid?.fullName ? `Viewing: ${selectedKid.fullName}` : 'Select a child'}
                    </p>

                    {/* Membership Card */}
                    <div className="mb-6">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Membership</h3>
                      <div className="p-4 rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            isActive
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                            {isActive ? 'Active' : 'Expired'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Start Date</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {startDate ? startDate.toLocaleDateString('en-IN') : '—'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">End Date</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {endDate ? endDate.toLocaleDateString('en-IN') : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button
                        onClick={() => setShowQrModal(true)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md"
                      >
                        Pay Now
                      </Button>

                      <div className="space-y-2">
                        <Button
                          onClick={handleConfirmPayment}
                          disabled={confirmingPayment}
                          variant="outline"
                          className="w-full border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950"
                        >
                          {confirmingPayment ? 'Opening WhatsApp...' : 'Confirm Payment'}
                        </Button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          After clicking, attach payment screenshot in WhatsApp and send to admin
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* QR Modal */}
                  <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Pay via UPI</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {qrUrl ? (
                          <div className="flex flex-col items-center space-y-3">
                            <img
                              src={qrUrl}
                              alt="UPI QR Code"
                              className="w-64 h-64 object-contain border border-gray-200 dark:border-gray-700 rounded-lg"
                            />
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                              Scan using any UPI app
                            </p>
                          </div>
                        ) : (
                          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <p className="mb-2">QR code not available</p>
                            <p className="text-xs">Please contact admin for payment details</p>
                          </div>
                        )}
                        <Button
                          onClick={() => setShowQrModal(false)}
                          variant="outline"
                          className="w-full"
                        >
                          Close
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
