// src/pages/parent/ParentDashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ParentHeader } from './components/layout/ParentHeader';
import ParentSidebar from './components/layout/ParentSidebar';
import { ParentGamesProgress } from './components/progress/ParentGamesProgress';
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

  // Progress view toggle (topics or games)
  const [progressView, setProgressView] = useState<'topics' | 'games'>('topics');
  
  // Weak areas timeframe toggle
  const [weakAreasTimeframe, setWeakAreasTimeframe] = useState<'all-time' | 'this-week'>('all-time');
  
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

  // Weak area entry type (from kid.summary.weakTop)
  type WeakTopEntry = {
    tag: string;
    attempts: number;
    correct: number;
    wrong: number;
    wrongRate: number; // 0-100
    lastSeenAt?: any;
    lastWrongAt?: any;
    evidence?: { gameId?: string; levelId?: number };
  };

  // Helper: Format tag for display
  const formatTagLabel = (tag: string): string => {
    if (tag.startsWith('letter:')) {
      const letter = tag.substring(7).toUpperCase();
      return `Letter ${letter}`;
    }
    if (tag.startsWith('sound:')) {
      const sound = tag.substring(6);
      return `Sound /${sound}/`;
    }
    if (tag.startsWith('subtopic:')) {
      const subtopic = tag.substring(9).replace(/_/g, ' ');
      return `Topic: ${subtopic}`;
    }
    // Fallback: show tag as-is
    return tag;
  };

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

  // Compute games list for Games view (uses same optimized read path)
  const gamesList = useMemo(() => {
    if (!catalogQuery.data) return null;

    const catalog = catalogQuery.data;
    const games = catalog.games || {};
    
    // Get progress data if available (kid might not have played yet)
    const progressSummary = kidSummaryQuery.data?.progressSummary;
    const byGame = progressSummary?.byGame || {};

    // Build game entries from catalog (active means NOT explicitly false)
    const gameEntries = Object.entries(games)
      .filter(([_, game]: [string, any]) => game.active !== false)
      .map(([gameId, game]: [string, any]) => {
        const gameKey = game.progressDocId || gameId;
        const progress = byGame[gameKey];

        const completedLevels = progress?.completedLevels || 0;
        const totalLevels = game.totalLevels || 0;
        const progressPct = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;
        const lastPlayed = progress?.lastPlayedAt;

        return {
          id: gameId,
          title: game.title || gameId,
          order: game.order || 0,
          completed: completedLevels,
          total: totalLevels,
          progressPct,
          lastPlayed: lastPlayed ? lastPlayed.seconds * 1000 : null,
          status: (completedLevels === 0 && !lastPlayed) ? 'Not played yet' : null,
        };
      });

    // Sort by order, then by gameId for stable ordering
    gameEntries.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.id.localeCompare(b.id);
    });

    return gameEntries;
  }, [catalogQuery.data, kidSummaryQuery.data]);

  // Helper to determine games view state
  const gamesViewState = useMemo(() => {
    if (!catalogQuery.data) return 'no-catalog';
    
    const games = catalogQuery.data.games || {};
    const totalGamesInCatalog = Object.keys(games).length;
    const activeGamesCount = Object.values(games).filter((game: any) => game.active !== false).length;

    if (totalGamesInCatalog === 0) return 'no-games-in-catalog';
    if (activeGamesCount === 0) return 'no-active-games';
    return 'has-games';
  }, [catalogQuery.data]);

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

            {/* Loading State */}
            {kidSummaryQuery.isLoading && (
              <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                Loading progress data...
              </div>
            )}

            {/* No Kid Selected */}
            {!selectedKidId && !kidSummaryQuery.isLoading && (
              <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center text-gray-600 dark:text-gray-400">
                Please select a child to view their games progress.
              </div>
            )}

            {/* Games Progress Component */}
            {selectedKidId && !kidSummaryQuery.isLoading && kidSummaryQuery.data && (
              <ParentGamesProgress
                kidSummaryData={kidSummaryQuery.data}
                gamesCatalog={catalogQuery.data || []}
                onPracticeClick={(gameId, levelId) => {
                  // Navigate to kid portal with optional deep link
                  if (kidsPortalUrl) {
                    navigate(kidsPortalUrl);
                  }
                }}
              />
            )}

            {/* No Data State */}
            {selectedKidId && !kidSummaryQuery.isLoading && !kidSummaryQuery.data?.summary && (
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
