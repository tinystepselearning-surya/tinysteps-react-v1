// src/pages/parent/ParentDashboard.tsx
import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ParentHeader } from './components/layout/ParentHeader';

export default function ParentDashboard() {
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') ?? 'overview';

  const setTab = (tabName: 'overview' | 'kids' | 'payments') => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tabName);
    setSearchParams(next);
  };

  if (isLoading) {
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
        This is your parent dashboard. From here you’ll be able to see your child’s Tiny Steps progress.
      </p>

      <div className="mb-4">
        <Link
          to="/parent?tab=kids"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
        >
          Kids Page
        </Link>
        <Link
          to="/kids"
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
