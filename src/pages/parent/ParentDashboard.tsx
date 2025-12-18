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

  // Fetch game sessions for selected kid
  const sessionsQuery = useQuery({
    queryKey: ['parent-game-sessions', selectedKidId],
    queryFn: async () => {
      if (!selectedKidId) return [];
      
      const { collection, query, orderBy, limit, getDocs, getFirestore } = await import('firebase/firestore');
      const db = getFirestore();
      
      const q = query(
        collection(db, 'students', selectedKidId, 'gameSessions'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure createdAt exists (fallback to current time if missing)
        createdAt: doc.data().createdAt || { seconds: Math.floor(Date.now() / 1000) }
      })) as any[];
    },
    enabled: !!selectedKidId,
  });

  // Aggregate sessions into topic proficiency
  const gamesProgress = useMemo(() => {
    if (!selectedKidId || !sessionsQuery.data) return null;
    
    const sessions = sessionsQuery.data;
    if (sessions.length === 0) return null;

    // Define topics with their skill mappings
    const topicDefs = [
      { id: 'letter-recognition', name: 'Letter Recognition', skillKeys: [], comingSoon: true },
      { id: 'letter-sounds', name: 'Letter Sounds', skillKeys: ['letter_sounds'] },
      { id: 'cvc-blending', name: 'CVC Blending', skillKeys: [], comingSoon: true },
      { id: 'tricky-words', name: 'Tricky Words', skillKeys: [], comingSoon: true },
      { id: 'digraphs-advanced', name: 'Digraphs & Advanced Sounds', skillKeys: ['digraphs_advanced'] },
    ];

    const topicStats: Record<string, { attempts: number; correct: number; minutes: number; lastPlayed: number }> = {};
    
    // Aggregate stats per topic
    sessions.forEach((session: any) => {
      const skills = session.skills || [];
      const attempts = session.attempts || 0;
      const correct = session.correct || 0;
      const durationSec = session.durationSec || 0;
      const timestamp = session.createdAt?.seconds ? session.createdAt.seconds * 1000 : Date.now();
      
      skills.forEach((skill: string) => {
        if (!topicStats[skill]) {
          topicStats[skill] = { attempts: 0, correct: 0, minutes: 0, lastPlayed: 0 };
        }
        topicStats[skill].attempts += attempts;
        topicStats[skill].correct += correct;
        topicStats[skill].minutes += durationSec / 60;
        topicStats[skill].lastPlayed = Math.max(topicStats[skill].lastPlayed, timestamp);
      });
    });

    // Compute status and progress for each topic
    const topics = topicDefs.map(def => {
      if (def.comingSoon) {
        return {
          id: def.id,
          name: def.name,
          status: 'Coming soon',
          progress: 0,
          accuracy: 0,
          attempts: 0,
          minutes: 0,
          lastPlayed: null,
        };
      }

      // Aggregate across all matching skills
      let totalAttempts = 0;
      let totalCorrect = 0;
      let totalMinutes = 0;
      let latestPlayed = 0;

      def.skillKeys.forEach(skillKey => {
        if (topicStats[skillKey]) {
          totalAttempts += topicStats[skillKey].attempts;
          totalCorrect += topicStats[skillKey].correct;
          totalMinutes += topicStats[skillKey].minutes;
          latestPlayed = Math.max(latestPlayed, topicStats[skillKey].lastPlayed);
        }
      });

      const accuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;
      const progress = Math.min(100, Math.max(0, Math.round(accuracy * 100)));

      // Determine status based on accuracy and attempts
      let status = 'No activity yet';
      if (totalAttempts >= 8) {
        if (accuracy >= 0.9) status = 'Mastered';
        else if (accuracy >= 0.75) status = 'Strong';
        else if (accuracy >= 0.55) status = 'Growing';
        else status = 'Learning';
      } else if (totalAttempts > 0) {
        status = 'Getting started';
      }

      return {
        id: def.id,
        name: def.name,
        status,
        progress,
        accuracy,
        attempts: totalAttempts,
        minutes: Math.round(totalMinutes),
        lastPlayed: latestPlayed > 0 ? latestPlayed : null,
      };
    });

    // Compute overall stats
    const allAttempts = sessions.reduce((sum: number, s: any) => sum + (s.attempts || 0), 0);
    const allCorrect = sessions.reduce((sum: number, s: any) => sum + (s.correct || 0), 0);
    const allMinutes = Math.round(sessions.reduce((sum: number, s: any) => sum + (s.durationSec || 0), 0) / 60);
    const overallAccuracy = allAttempts > 0 ? allCorrect / allAttempts : 0;

    // Find most practiced topic
    const topicMinutes = topics.filter(t => t.minutes > 0);
    const mostPracticed = topicMinutes.length > 0
      ? topicMinutes.reduce((max, t) => t.minutes > max.minutes ? t : max, topicMinutes[0])
      : null;

    return {
      overall: {
        totalMinutes: allMinutes,
        accuracy: Math.round(overallAccuracy * 100),
        mostPracticed: mostPracticed?.name || 'N/A',
      },
      topics,
    };
  }, [selectedKidId, sessionsQuery.data]);

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
                  <>Viewing progress for: <span className="font-semibold">{selectedKid?.fullName || selectedKidId}</span> • Based on recent game practice</>
                ) : (
                  'Select a child to view their progress'
                )}
              </p>
            </div>

            {/* Loading State */}
            {sessionsQuery.isLoading && (
              <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                Loading game sessions...
              </div>
            )}

            {/* No Data State */}
            {!sessionsQuery.isLoading && sessionsQuery.data?.length === 0 && selectedKidId && (
              <div className="p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                <div className="text-gray-500 dark:text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No game activity yet</p>
                  <p className="text-sm mt-2">Game progress will appear here once {selectedKid?.fullName || 'your child'} starts playing.</p>
                </div>
              </div>
            )}

            {/* Overall Progress Card */}
            {gamesProgress && (
              <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Overall Progress</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Practice Time</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{gamesProgress.overall.totalMinutes}m</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Overall Accuracy</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{gamesProgress.overall.accuracy}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Most Practiced</div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 truncate">{gamesProgress.overall.mostPracticed}</div>
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
