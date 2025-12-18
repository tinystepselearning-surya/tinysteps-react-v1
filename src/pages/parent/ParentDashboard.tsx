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

  if (isLoading || kidsQuery.isLoading) {
    return <div className="p-6">Loading parent dashboard…</div>;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  // Dummy games progress data (keyed by kidId for future Firestore integration)
  const getDummyGamesProgress = (kidId: string | null) => {
    if (!kidId) return null;
    return {
      overall: {
        level: 'Level 3',
        lastUpdated: 'Dec 15, 2025',
      },
      topics: [
        {
          id: 'letter-recognition',
          name: 'Letter Recognition',
          status: 'Strong',
          progress: 85,
          nextStep: 'Practice uppercase letters',
        },
        {
          id: 'letter-sounds',
          name: 'Letter Sounds',
          status: 'Growing',
          progress: 65,
          nextStep: 'Review vowel sounds',
        },
        {
          id: 'cvc-blending',
          name: 'CVC Blending',
          status: 'Learning',
          progress: 40,
          nextStep: 'Start with short "a" words',
        },
        {
          id: 'tricky-words',
          name: 'Tricky Words',
          status: 'Not started',
          progress: 0,
          nextStep: 'Begin with high-frequency words',
        },
        {
          id: 'digraphs-advanced',
          name: 'Digraphs & Advanced Sounds',
          status: 'Not started',
          progress: 0,
          nextStep: 'Master CVC words first',
        },
      ],
    };
  };

  const gamesProgress = getDummyGamesProgress(selectedKidId);
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
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Phonics Progress</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Viewing progress for: <span className="font-semibold">{selectedKid?.fullName || selectedKidId || 'No child selected'}</span>
              </p>
            </div>

            {/* Overall Progress Card */}
            {gamesProgress && (
              <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Overall Progress</h3>
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{gamesProgress.overall.level}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Last updated: {gamesProgress.overall.lastUpdated}</div>
                </div>
              </div>
            )}

            {/* Topic Cards */}
            {gamesProgress && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gamesProgress.topics.map((topic) => {
                  const statusColors: Record<string, string> = {
                    'Mastered': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                    'Strong': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                    'Growing': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                    'Learning': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                    'Not started': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                  };

                  return (
                    <div key={topic.id} className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
                      {/* Topic Name & Status */}
                      <div className="flex items-start justify-between">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{topic.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[topic.status] || statusColors['Not started']}`}>
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

                      {/* Next Step */}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">Next step:</span> {topic.nextStep}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                        >
                          Practice
                        </button>
                        <button
                          type="button"
                          className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          View details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!gamesProgress && (
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
