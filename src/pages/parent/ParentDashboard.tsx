// src/pages/parent/ParentDashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ParentHeader } from './components/layout/ParentHeader';
import ParentSidebar from './components/layout/ParentSidebar';
import { useQuery } from '@tanstack/react-query';

export default function ParentDashboard() {
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Tab handling
  const activeTab = searchParams.get('tab') || 'dashboard';
  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };
  
  // Fetch kids directly from kids collection where parentIds contains this parent's uid
  const kidsQuery = useQuery({
    queryKey: ['parent-kids', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      const [{ collection, query, where, getDocs }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../../lib/firebaseConfig'),
      ]);
      
      const q = query(
        collection(db, 'kids'),
        where('parentIds', 'array-contains', user.uid)
      );
      
      console.log('[ParentDashboard] Querying kids with parentUid:', user.uid);
      
      const snapshot = await getDocs(q);
      const result = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as any
      })) as any[];
      
      console.log('[ParentDashboard] Kids query result:', result.length, 'kids found');
      if (result.length === 0) {
        console.warn('[ParentDashboard] No kids found. Check Firestore rules and data.');
      }
      
      return result;
    },
    enabled: !!user?.uid,
  });
  
  const kids = kidsQuery.data || [];
  
  // Debug panel (DEV only)
  const isDev = import.meta.env.DEV;

  // Kid selector state with localStorage persistence
  const [selectedKidId, setSelectedKidId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(`ts_parent_selected_kid_v1:${user?.uid || ''}`);
      return saved || null;
    } catch {
      return null;
    }
  });
  
  // Auto-select kid when data loads
  useEffect(() => {
    if (kids.length === 0) return;
    
    // If only one kid, auto-select
    if (kids.length === 1) {
      setSelectedKidId(kids[0].id);
      return;
    }
    
    // If multiple kids and no selection, check if saved selection still exists
    if (!selectedKidId) {
      setSelectedKidId(kids[0].id);
    } else {
      // Verify saved selection still exists
      const stillExists = kids.some((k: any) => k.id === selectedKidId);
      if (!stillExists) {
        setSelectedKidId(kids[0].id);
      }
    }
  }, [kids, selectedKidId]);
  
  // Persist selection to localStorage
  useEffect(() => {
    if (selectedKidId && user?.uid) {
      try {
        localStorage.setItem(`ts_parent_selected_kid_v1:${user.uid}`, selectedKidId);
      } catch {
        // ignore storage errors
      }
    }
  }, [selectedKidId, user?.uid]);
  
  // Helper to preserve kidId in navigation
  const withKid = (path: string) => {
    if (!selectedKidId) return path;
    const sep = path.includes('?') ? '&' : '?';
    return path.includes('kidId=') ? path : `${path}${sep}kidId=${encodeURIComponent(selectedKidId)}`;
  };

  // Compute Kids Portal URL (only valid if selectedKidId exists)
  const kidsPortalUrl = selectedKidId ? `/kids?kidId=${encodeURIComponent(selectedKidId)}` : null;

  // Fetch kid document with summary and progressSummary
  const kidSummaryQuery = useQuery({
    queryKey: ['kid-summary', selectedKidId],
    queryFn: async () => {
      if (!selectedKidId) return null;
      
      const { doc, getDoc, getFirestore } = await import('firebase/firestore');
      const db = getFirestore();
      
      const kidDoc = await getDoc(doc(db, 'kids', selectedKidId));
      if (!kidDoc.exists()) return null;
      
      return {
        id: kidDoc.id,
        ...kidDoc.data(),
      } as any;
    },
    enabled: !!selectedKidId,
    staleTime: 60000, // 60 seconds
  });

  // Fetch games catalog
  const catalogQuery = useQuery({
    queryKey: ['gamesCatalog'],
    queryFn: async () => {
      const { doc, getDoc, getFirestore } = await import('firebase/firestore');
      const db = getFirestore();
      
      const catalogDoc = await getDoc(doc(db, 'config', 'gamesCatalog'));
      if (!catalogDoc.exists()) return null;
      
      return catalogDoc.data() as any;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Fetch weak areas (top 5 skills with highest wrong rate)
  const weakAreasQuery = useQuery({
    queryKey: ['weak-areas', selectedKidId],
    queryFn: async () => {
      if (!selectedKidId) return [];
      
      const { collection, query, orderBy, limit, getDocs, getFirestore } = await import('firebase/firestore');
      const db = getFirestore();
      
      const q = query(
        collection(db, 'kids', selectedKidId, 'skillStats'),
        orderBy('wrong', 'desc'),
        limit(5)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        const attempts = data.attempts || 0;
        const wrong = data.wrong || 0;
        const wrongRate = attempts > 0 ? Math.round((wrong / attempts) * 100) : 0;
        
        return {
          id: doc.id,
          tag: data.tagLabel || doc.id,
          attempts,
          correct: data.correct || 0,
          wrong,
          wrongRate,
          lastSeenAt: data.lastSeenAt,
          lastWrongAt: data.lastWrongAt,
        };
      }).filter(item => item.wrong > 0); // Only show skills with mistakes
    },
    enabled: !!selectedKidId && activeTab === 'games',
  });

  // Fetch recent game sessions (optional, for "Recent activity" section)
  const sessionsQuery = useQuery({
    queryKey: ['parent-game-sessions', selectedKidId],
    queryFn: async () => {
      if (!selectedKidId) return [];
      
      const { collection, query, orderBy, limit, getDocs, getFirestore } = await import('firebase/firestore');
      const db = getFirestore();
      
      const q = query(
        collection(db, 'kids', selectedKidId, 'gameSessions'),
        orderBy('createdAt', 'desc'),
        limit(5) // Only fetch 5 most recent for activity display
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt || { seconds: Math.floor(Date.now() / 1000) }
      })) as any[];
    },
    enabled: !!selectedKidId,
  });

  // Compute insights from kid summary and progressSummary (optimized read path)
  const gamesProgress = useMemo(() => {
    // Debug logging (DEV only)
    if (isDev) {
      console.log('[ParentDashboard] gamesProgress computation:', {
        selectedKidId,
        kidSummaryStatus: kidSummaryQuery.status,
        kidSummaryError: kidSummaryQuery.error,
        catalogStatus: catalogQuery.status,
        catalogError: catalogQuery.error,
        hasProgressSummary: !!kidSummaryQuery.data?.progressSummary,
        catalogCategories: Object.keys(catalogQuery.data?.categories || {}),
      });
    }

    if (!selectedKidId || !kidSummaryQuery.data) return null;
    if (!catalogQuery.data) return null;
    
    const summary = kidSummaryQuery.data.summary;
    const progressSummary = kidSummaryQuery.data.progressSummary;
    const catalog = catalogQuery.data;

    // Build categories (topics) from catalog
    const categories = catalog.categories || {};
    const games = catalog.games || {};

    // Group games by category for topic definitions
    const topicDefs: Array<{
      id: string;
      name: string;
      gameIds: string[];
      totalLevels: number;
    }> = [];

    Object.entries(categories).forEach(([catId, catData]: [string, any]) => {
      if (catData.active === false) return;
      
      const gameIdsInCategory = Object.entries(games)
        .filter(([gameId, game]: [string, any]) => game.active && game.category === catId)
        .sort((a, b) => ((a[1] as any).order || 0) - ((b[1] as any).order || 0))
        .map(([gameId]) => gameId);

      if (gameIdsInCategory.length > 0) {
        // Compute total levels for this topic from catalog
        const totalLevels = gameIdsInCategory.reduce((sum, gameId) => {
          const game = games[gameId];
          return sum + (game?.totalLevels || 0);
        }, 0);

        topicDefs.push({
          id: catId,
          name: catData.label || catId,
          gameIds: gameIdsInCategory,
          totalLevels,
        });
      }
    });

    // Fallback: if no topics built from categories but games exist, derive from games
    if (topicDefs.length === 0 && Object.keys(games).length > 0) {
      const topicsByCategory: Record<string, { gameIds: string[]; totalLevels: number }> = {};
      
      Object.entries(games).forEach(([gameId, game]: [string, any]) => {
        if (game.active === false) return;
        const catId = game.category;
        if (!catId) return;
        
        if (!topicsByCategory[catId]) {
          topicsByCategory[catId] = { gameIds: [], totalLevels: 0 };
        }
        topicsByCategory[catId].gameIds.push(gameId);
        topicsByCategory[catId].totalLevels += (game.totalLevels || 0);
      });
      
      Object.entries(topicsByCategory).forEach(([catId, data]) => {
        topicDefs.push({
          id: catId,
          name: categories[catId]?.label || catId,
          gameIds: data.gameIds,
          totalLevels: data.totalLevels,
        });
      });
      
      // Sort by category order if available, tie-break by id for stable ordering
      topicDefs.sort((a, b) => {
        const orderA = categories[a.id]?.order || 0;
        const orderB = categories[b.id]?.order || 0;
        if (orderA !== orderB) return orderA - orderB;
        return a.id.localeCompare(b.id);
      });
    }

    // Debug: log topic definitions
    if (isDev) {
      console.log('[ParentDashboard] topicDefs built:', topicDefs.length, 'topics');
    }

    // Sort topics by category order with stable tie-break (only if not sorted by fallback)
    if (!(topicDefs.length > 0 && Object.keys(categories).length === 0)) {
      topicDefs.sort((a, b) => {
        const orderA = categories[a.id]?.order || 0;
        const orderB = categories[b.id]?.order || 0;
        if (orderA !== orderB) return orderA - orderB;
        return a.id.localeCompare(b.id);
      });
    }

    // Build topic progress from progressSummary (optimized read)
    const progressByTopic = progressSummary?.progressByTopic || {};
    
    const topics = topicDefs.map(def => {
      const topicProgress = progressByTopic[def.id];
      
      let completedSum = 0;
      let totalSum = def.totalLevels;
      let progressPct = 0;
      let latestPlayed: any = null;

      if (topicProgress) {
        completedSum = topicProgress.completedLevels || 0;
        totalSum = topicProgress.totalLevels || def.totalLevels;
        progressPct = topicProgress.pct || 0;
        latestPlayed = topicProgress.lastPlayedAt;
      }

      // Determine status based on progress percentage
      let status = 'No activity yet';
      if (completedSum === 0) {
        status = 'No activity yet';
      } else if (progressPct >= 90) {
        status = 'Mastered';
      } else if (progressPct >= 70) {
        status = 'Strong';
      } else if (progressPct >= 40) {
        status = 'Growing';
      } else {
        status = 'Learning';
      }

      return {
        id: def.id,
        name: def.name,
        status,
        progress: progressPct,
        accuracy: 0, // Not computed from progressSummary
        attempts: completedSum, // Show completed count as "attempts"
        minutes: 0, // Not tracked per-topic
        lastPlayed: latestPlayed ? latestPlayed.seconds * 1000 : null,
      };
    });

    // Overall stats from summary (if available)
    const totalMinutes = summary ? Math.round((summary.timeSpentWeekSec || 0) / 60) : 0;
    const overallAccuracy = summary ? Math.round((summary.avgAccuracy10 || 0) * 100) : 0;
    
    // Find most practiced game from summary
    const summaryGames = summary?.games || {};
    const gamesWithPlays = Object.entries(summaryGames).map(([gameId, stats]: [string, any]) => ({
      gameId,
      plays: stats.plays || 0,
    }));
    const mostPracticedGame = gamesWithPlays.length > 0
      ? gamesWithPlays.reduce((max, g) => g.plays > max.plays ? g : max, gamesWithPlays[0])
      : null;
    
    const mostPracticed = mostPracticedGame?.gameId 
      ? (games[mostPracticedGame.gameId]?.title || mostPracticedGame.gameId)
      : 'N/A';

    return {
      overall: {
        totalMinutes,
        accuracy: overallAccuracy,
        mostPracticed,
        totalSessions: summary?.totalSessions || 0,
        streakDays: summary?.streakDays || 0,
      },
      topics,
    };
  }, [selectedKidId, kidSummaryQuery.data, catalogQuery.data]);

  if (isLoading || kidsQuery.isLoading) {
    return <div className="p-6">Loading parent dashboard…</div>;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const selectedKid = kids.find((k: any) => k.id === selectedKidId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <ParentSidebar activeTab={activeTab} onTabChange={handleTabChange} />
      
      <div className="flex-1 p-6">
        <ParentHeader name={user.displayName || 'Parent'} />

        {/* Kid Selector */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg max-w-xl">
          <label htmlFor="kid-selector" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Select Child
          </label>
          <select
            id="kid-selector"
            value={selectedKidId || ''}
            onChange={(e) => setSelectedKidId(e.target.value)}
            className="w-full md:w-auto px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {kids.map((kid: any) => (
              <option key={kid.id} value={kid.id}>
                {kid.fullName || 'Unnamed'}{kid.grade ? ` (${kid.grade})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div>
            {kidsPortalUrl ? (
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => {
                  if (isDev) console.debug('[ParentDashboard] Opening Kids Portal:', { selectedKidId, kidsPortalUrl });
                  navigate(kidsPortalUrl!);
                }}
              >
                Open Kids Portal
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="px-4 py-2 bg-gray-200 border border-gray-300 text-gray-400 rounded cursor-not-allowed"
                title="Please select a child first"
              >
                Open Kids Portal
              </button>
            )}
          </div>
        )}

        {activeTab === 'games-progress' && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Games Progress</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {selectedKid?.fullName || selectedKidId ? (
                  <>Viewing progress for: <span className="font-semibold">{selectedKid?.fullName || selectedKidId}</span></>
                ) : (
                  'Select a child to view their progress'
                )}
              </p>
            </div>

            {/* Update Info Note */}
            {selectedKidId && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    {kidSummaryQuery.data?.summary?.lastUpdatedAt ? (
                      <>
                        <strong>Last updated:</strong>{' '}
                        {new Intl.DateTimeFormat('en-US', {
                          timeZone: 'Asia/Kolkata',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        }).format(kidSummaryQuery.data.summary.lastUpdatedAt.toDate?.() || new Date(kidSummaryQuery.data.summary.lastUpdatedAt.seconds * 1000))}{' '}
                        IST. Progress updates run at 11 AM, 5 PM, and 11 PM IST.
                      </>
                    ) : (
                      <>
                        Progress updates run at <strong>11 AM, 5 PM, and 11 PM IST</strong>. Your child's latest progress will appear after the next update.
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {kidSummaryQuery.isLoading && (
              <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                Loading progress data...
              </div>
            )}

            {/* No Data State */}
            {!kidSummaryQuery.isLoading && !kidSummaryQuery.data?.summary && selectedKidId && (
              <div className="p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                <div className="text-gray-500 dark:text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No game activity yet</p>
                  <p className="text-sm mt-2">Game progress will appear here once {selectedKid?.fullName || 'your child'} starts playing and the next update runs (11 AM, 5 PM, or 11 PM IST).</p>
                </div>
              </div>
            )}

            {/* Debug Fallback: Show what's missing (DEV only) */}
            {isDev && !kidSummaryQuery.isLoading && !catalogQuery.isLoading && !gamesProgress && selectedKidId && kidSummaryQuery.data && (
              <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm text-yellow-900 dark:text-yellow-100">
                    <strong>Topic cards not showing.</strong> Checking dependencies:
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      <li>Kid document: {kidSummaryQuery.data ? '✅ Loaded' : '❌ Not loaded'}</li>
                      <li>Catalog: {catalogQuery.data ? '✅ Loaded' : '❌ Not loaded'}</li>
                      <li>progressSummary field: {kidSummaryQuery.data?.progressSummary ? '✅ Present' : '⚠️ Missing (expected for new kids)'}</li>
                    </ul>
                    {!kidSummaryQuery.data?.progressSummary && (
                      <p className="mt-2 text-xs">
                        This kid hasn't played any games yet. Topic cards will appear after the first game session.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Overall Progress Card */}
            {gamesProgress && (
              <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Overall Progress</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Sessions</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{gamesProgress.overall.totalSessions}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Practice Time</div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{gamesProgress.overall.totalMinutes}m</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Accuracy</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{gamesProgress.overall.accuracy}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Streak</div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{gamesProgress.overall.streakDays} {gamesProgress.overall.streakDays === 1 ? 'day' : 'days'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Most Practiced</div>
                    <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 truncate">{gamesProgress.overall.mostPracticed}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Topic Cards */}
            {gamesProgress && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gamesProgress.topics.map((topic: any) => {
                  const statusColors: Record<string, string> = {
                    'Mastered': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                    'Strong': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                    'Growing': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                    'Learning': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                    'Getting started': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
                    'Coming soon': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
                    'No activity yet': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
                  };

                  const formatDate = (timestamp: number | null) => {
                    if (!timestamp) return null;
                    const date = new Date(timestamp);
                    const now = new Date();
                    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 0) return 'Today';
                    if (diffDays === 1) return 'Yesterday';
                    if (diffDays < 7) return `${diffDays} days ago`;
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  };

                  return (
                    <div key={topic.id} className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
                      {/* Topic Name & Status */}
                      <div className="flex items-start justify-between">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{topic.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${statusColors[topic.status] || statusColors['No activity yet']}`}>
                          {topic.status}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span>Progress</span>
                          <span className="font-semibold">{topic.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${topic.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats Line */}
                      {topic.attempts > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Accuracy: {Math.round(topic.accuracy * 100)}% • Practice: {topic.minutes}m
                          {topic.lastPlayed && (
                            <> • Last played: {formatDate(topic.lastPlayed)}</>
                          )}
                        </div>
                      )}

                      {/* Coming Soon or No Activity */}
                      {topic.status === 'Coming soon' && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                          Game coming soon!
                        </div>
                      )}
                      {topic.status === 'No activity yet' && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No practice sessions yet
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          disabled={topic.status === 'Coming soon'}
                          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          Practice
                        </button>
                        <button
                          type="button"
                          disabled={topic.status === 'Coming soon' || topic.attempts === 0}
                          className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          View details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Weak Areas Section */}
            {gamesProgress && selectedKidId && (
              <div className="mt-8 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Weak Areas</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Skills that need more practice
                  </span>
                </div>

                {weakAreasQuery.isLoading && (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    Loading weak areas...
                  </div>
                )}

                {!weakAreasQuery.isLoading && weakAreasQuery.data && weakAreasQuery.data.length === 0 && (
                  <div className="text-center py-6 text-green-600 dark:text-green-400">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium">No weak areas yet — keep practicing!</p>
                  </div>
                )}

                {!weakAreasQuery.isLoading && weakAreasQuery.data && weakAreasQuery.data.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {weakAreasQuery.data.map((skill: any) => (
                      <div
                        key={skill.id}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
                      >
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {skill.tag}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-semibold text-orange-800 dark:text-orange-200 bg-orange-200 dark:bg-orange-900/50 rounded">
                          {skill.wrongRate}% wrong
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          ({skill.wrong}/{skill.attempts})
                        </span>
                        <button
                          type="button"
                          className="ml-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          title="Practice this skill"
                        >
                          practice
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No Kid Selected */}
            {!selectedKidId && !sessionsQuery.isLoading && (
              <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center text-gray-600 dark:text-gray-400">
                Please select a child to view their games progress.
              </div>
            )}
          </div>
        )}

        {/* Placeholder for other tabs */}
        {!['dashboard', 'games-progress'].includes(activeTab) && (
          <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">Tab '{activeTab}' coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
