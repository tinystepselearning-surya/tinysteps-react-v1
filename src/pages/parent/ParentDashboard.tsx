// src/pages/parent/ParentDashboard.tsx
// REBUILT: NO Suspense, NO lazy, NO startTransition, NO dynamic imports

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ParentHeader } from './components/layout/ParentHeader';
import ParentSidebar from './components/layout/ParentSidebar';
import { ParentGamesProgress } from './components/progress/ParentGamesProgress';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';

export default function ParentDashboard() {
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const activeTab = searchParams.get('tab') || 'dashboard';
  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };
  
  const kidsQuery = useQuery({
    queryKey: ['parent-kids', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(collection(db, 'kids'), where('parentIds', 'array-contains', user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
    },
    enabled: !!user?.uid,
  });
  
  const kids = kidsQuery.data || [];
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);
  
  useEffect(() => {
    if (kids.length > 0 && !selectedKidId) {
      setSelectedKidId(kids[0].id);
    }
  }, [kids, selectedKidId]);

  const kidSummaryQuery = useQuery({
    queryKey: ['kid-summary', selectedKidId],
    queryFn: async () => {
      if (!selectedKidId) return null;
      const kidDoc = await getDoc(doc(db, 'kids', selectedKidId));
      return kidDoc.exists() ? { id: kidDoc.id, ...kidDoc.data() } : null;
    },
    enabled: !!selectedKidId,
  });

  const catalogQuery = useQuery({
    queryKey: ['gamesCatalog'],
    queryFn: async () => {
      const catalogDoc = await getDoc(doc(db, 'config', 'gamesCatalog'));
      return catalogDoc.exists() ? catalogDoc.data() as any : { games: [] };
    },
  });

  useEffect(() => {
    if (!isLoading && !user) navigate('/login');
  }, [isLoading, user, navigate]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return null;

  const selectedKid = kids.find((k: any) => k.id === selectedKidId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ParentHeader />
      <div className="flex">
        <ParentSidebar activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="flex-1 p-6 md:ml-64">
          {kids.length > 0 && (
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg max-w-xl">
              <label htmlFor="kid-selector" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Child</label>
              <select
                id="kid-selector"
                value={selectedKidId || ''}
                onChange={(e) => setSelectedKidId(e.target.value)}
                className="w-full md:w-auto px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100"
              >
                {kids.map((kid: any) => (
                  <option key={kid.id} value={kid.id}>{kid.fullName || 'Unnamed'}{kid.grade ? ` (${kid.grade})` : ''}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Parent Dashboard</h2>
              <p className="text-gray-600 dark:text-gray-400">Welcome! Select "Games Progress" from the sidebar.</p>
            </div>
          )}

          {activeTab === 'games-progress' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Games Progress</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedKid?.fullName ? `Viewing: ${selectedKid.fullName}` : 'Select a child'}
                </p>
              </div>

              {kidSummaryQuery.isLoading && (
                <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center">Loading...</div>
              )}

              {!selectedKidId && !kidSummaryQuery.isLoading && (
                <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center text-gray-600 dark:text-gray-400">
                  Please select a child above.
                </div>
              )}

              {selectedKidId && !kidSummaryQuery.isLoading && kidSummaryQuery.data && (
                <ParentGamesProgress
                  kidSummaryData={kidSummaryQuery.data as any}
                  gamesCatalog={catalogQuery.data?.games || {}}
                  onPracticeClick={() => {}}
                />
              )}

              {selectedKidId && !kidSummaryQuery.isLoading && !kidSummaryQuery.data && (
                <div className="p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No game activity yet</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Progress appears once {selectedKid?.fullName || 'your child'} starts playing.</p>
                </div>
              )}
            </div>
          )}

          {!['dashboard', 'games-progress'].includes(activeTab) && (
            <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">Tab '{activeTab}' coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
