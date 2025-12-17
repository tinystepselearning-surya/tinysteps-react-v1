// src/pages/parent/ParentDashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ParentHeader } from './components/layout/ParentHeader';
import { useQuery } from '@tanstack/react-query';

export default function ParentDashboard() {
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
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
  const showDebug = isDev && user;
  
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
  
  const selectedKid = useMemo(() => {
    return kids.find((k: any) => k.id === selectedKidId) || null;
  }, [kids, selectedKidId]);

  const activeTab = searchParams.get('tab') ?? 'overview';

  const setTab = (tabName: 'overview' | 'kids' | 'payments') => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tabName);
    setSearchParams(next);
  };

  if (isLoading || kidsQuery.isLoading) {
    return <div className="p-6">Loading parent dashboard…</div>;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const KidsTabContent = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <h1 className="text-xl font-bold mb-4">Kids Dashboard</h1>
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Games</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Play phonics, grammar, and speaking games. Progress is tracked automatically.
        </p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => alert('Coming soon')}
        >
          Open Games
        </button>
      </div>
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Join Class</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Join your live class session when it’s time.
        </p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => alert('Coming soon')}
        >
          Join Class
        </button>
      </div>
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Digital Worksheets</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Complete worksheets on screen — no printing needed.
        </p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => alert('Coming soon')}
        >
          Open Worksheets
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <ParentHeader name={user.displayName || 'Parent'} />
      
      {/* Debug Panel (DEV only) */}
      {showDebug && (
        <div className="mb-6 p-4 bg-gray-800 text-white rounded-lg text-xs font-mono">
          <div className="font-bold mb-2">🔍 Debug Info (DEV only)</div>
          <div>Environment: {window.location.host}</div>
          <div>Auth UID: {user.uid}</div>
          <div>Query Status: {kidsQuery.status}</div>
          <div>Query Enabled: {kidsQuery.isEnabled ? 'Yes' : 'No'}</div>
          <div>Kids Found: {kids.length}</div>
          {kidsQuery.error && (
            <div className="mt-2 p-2 bg-red-900 rounded">
              Error: {String(kidsQuery.error)}
              {String(kidsQuery.error).includes('permission-denied') && (
                <div className="mt-1 text-yellow-300">⚠️ Firestore rules blocked reading kids collection</div>
              )}
            </div>
          )}
        </div>
      )}
      
      <p className="text-sm text-muted-foreground mb-6 mt-4">
        This is your parent dashboard. From here you'll be able to see your child's Tiny Steps progress.
      </p>

      {/* Kid Selector */}
      {kids.length === 0 ? (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            No children are linked to this account yet.
          </p>
        </div>
      ) : kids.length > 1 ? (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
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
          {selectedKid && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Currently viewing: {selectedKid.fullName}{selectedKid.grade ? ` • Grade ${selectedKid.grade}` : ''}
            </p>
          )}
        </div>
      ) : (
        selectedKid && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Viewing: <span className="font-semibold">{selectedKid.fullName}</span>
              {selectedKid.grade && <span> • Grade {selectedKid.grade}</span>}
            </p>
          </div>
        )
      )}

      <div className="mb-4">
        <Link
          to="/parent?tab=kids"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
        >
          Kids Page
        </Link>
        <Link
          to={`/kids${selectedKidId ? `?kidId=${selectedKidId}` : ''}`}
          className="inline-block ml-3 px-4 py-2 bg-white border border-gray-200 text-gray-800 rounded hover:bg-gray-100 mb-4"
        >
          Open Kids Portal
        </Link>
        {!selectedKidId && (
          <span className="ml-3 text-sm text-amber-600">
            ⚠️ Select a child to track progress.
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          className={`px-3 py-1 rounded text-sm ${
            activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-white'
          }`}
          onClick={() => setTab('overview')}
        >
          Overview
        </button>
        <Link
          to="/parent?tab=kids"
          className={`px-3 py-1 rounded text-sm ${
            activeTab === 'kids' ? 'bg-blue-600 text-white' : 'bg-white'
          }`}
        >
          Kids
        </Link>
        <button
          type="button"
          className={`px-3 py-1 rounded text-sm ${
            activeTab === 'payments' ? 'bg-blue-600 text-white' : 'bg-white'
          }`}
          onClick={() => setTab('payments')}
        >
          Payments
        </button>
      </div>

      {activeTab === 'overview' && (
        <div>Parent overview content will come here.</div>
      )}
      {activeTab === 'kids' && <KidsTabContent />}
      {activeTab === 'payments' && <div>Subscription & payments info will come here.</div>}
    </div>
  );
}
