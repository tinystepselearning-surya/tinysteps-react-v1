// src/pages/parent/ParentDashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { ParentGamesProgress } from './components/progress/ParentGamesProgress';

type TabKey = 'dashboard' | 'games-progress';

function safeTab(value: string | null): TabKey {
  return value === 'games-progress' ? 'games-progress' : 'dashboard';
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Parent</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Debug-safe build (no Suspense / no lazy / no transitions)
            </p>
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
        <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
          <button
            type="button"
            onClick={() => setTab('dashboard')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            }`}
          >
            Dashboard
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
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Dashboard</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Switch to “Games Progress”. If React #426 still happens here, the lazy component is
              outside these two files.
            </p>
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
      </div>
    </div>
  );
}
