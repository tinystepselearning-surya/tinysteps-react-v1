// src/pages/parent/ParentDashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { ParentGamesProgress } from './components/progress/ParentGamesProgress';
import { ParentOverviewCards } from './components/overview/ParentOverviewCards';
import { Card } from '@/components/ui/card';

type TabKey = 'dashboard' | 'games-progress' | 'skills' | 'weekly' | 'reports' | 'profile' | 'payments';

function safeTab(value: string | null): TabKey {
  const validTabs: TabKey[] = ['dashboard', 'games-progress', 'skills', 'weekly', 'reports', 'profile', 'payments'];
  return validTabs.includes(value as TabKey) ? (value as TabKey) : 'dashboard';
}

export default function ParentDashboard() {
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }
  if (!user) return null;

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      {/* Minimal header */}
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
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

          {/* Kid selector */}
          <div className="w-full md:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Select Child
            </label>

            {kidsQuery.isLoading ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">Loading kids…</div>
            ) : kids.length === 0 ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">No kids linked yet.</div>
            ) : (
              <select
                value={selectedKidId}
                onChange={(e) => setSelectedKidId(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                {kids.map((k: any) => (
                  <option key={k.id} value={k.id}>
                    {k.fullName || 'Unnamed'}
                  </option>
                ))}
              </select>
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
            onClick={() => setTab('reports')}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-700 ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            }`}
          >
            Reports
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
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Skills</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {selectedKid?.fullName ? `Viewing: ${selectedKid.fullName}` : 'Select a child'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This section will show insights once backend rollups are enabled.
              </p>
            </Card>
          </div>
        )}

        {activeTab === 'weekly' && (
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Weekly</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {selectedKid?.fullName ? `Viewing: ${selectedKid.fullName}` : 'Select a child'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This section will show insights once backend rollups are enabled.
              </p>
            </Card>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Reports</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {selectedKid?.fullName ? `Viewing: ${selectedKid.fullName}` : 'Select a child'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This section will show insights once backend rollups are enabled.
              </p>
            </Card>
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
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Payments</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {selectedKid?.fullName ? `Viewing: ${selectedKid.fullName}` : 'Select a child'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This section will show insights once backend rollups are enabled.
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
