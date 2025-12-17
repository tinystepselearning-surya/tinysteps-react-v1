// src/pages/parent/ParentDashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ParentHeader } from './components/layout/ParentHeader';
import { useEnrollments } from '../../hooks/useData';

export default function ParentDashboard() {
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Fetch enrollments for this parent
  const enrollmentsQuery = useEnrollments(user?.uid || '');
  
  // Extract unique kids from enrollments
  const kids = useMemo(() => {
    if (!enrollmentsQuery.data) return [];
    const kidsMap = new Map();
    enrollmentsQuery.data.forEach((enrollment: any) => {
      if (enrollment.kids && Array.isArray(enrollment.kids)) {
        enrollment.kids.forEach((kid: any) => {
          if (!kidsMap.has(kid.id)) {
            kidsMap.set(kid.id, kid);
          }
        });
      }
    });
    return Array.from(kidsMap.values());
  }, [enrollmentsQuery.data]);
  
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

  if (isLoading || enrollmentsQuery.isLoading) {
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
      </div>

      {activeTab === 'overview' && (
        <div>Parent overview content will come here.</div>
      )}
      {activeTab === 'kids' && <KidsTabContent />}
      {activeTab === 'payments' && <div>Subscription & payments info will come here.</div>}
    </div>
  );
}
