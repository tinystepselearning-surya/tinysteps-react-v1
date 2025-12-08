// src/pages/parent/ParentDashboard.tsx
import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { ParentHeader } from './components/layout/ParentHeader';

export default function ParentDashboard() {
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'overview' | 'kids' | 'payments'>('overview');

  if (isLoading) {
    return <div className="p-6">Loading parent dashboard…</div>;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <ParentHeader name={user.displayName || 'Parent'} />
      <p className="text-sm text-muted-foreground mb-6 mt-4">
        This is your parent dashboard. From here you’ll be able to see your child’s Tiny Steps progress.
      </p>

      <div className="flex gap-2 mb-4">
        <button
          className={`px-3 py-1 rounded text-sm ${
            tab === 'overview' ? 'bg-blue-600 text-white' : 'bg-white'
          }`}
          onClick={() => setTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-3 py-1 rounded text-sm ${
            tab === 'kids' ? 'bg-blue-600 text-white' : 'bg-white'
          }`}
          onClick={() => setTab('kids')}
        >
          Kids
        </button>
        <button
          className={`px-3 py-1 rounded text-sm ${
            tab === 'payments' ? 'bg-blue-600 text-white' : 'bg-white'
          }`}
          onClick={() => setTab('payments')}
        >
          Payments
        </button>
      </div>

      {tab === 'overview' && (
        <div>Parent overview content will come here.</div>
      )}
      {tab === 'kids' && <div>Kid list / progress will come here.</div>}
      {tab === 'payments' && <div>Subscription & payments info will come here.</div>}
    </div>
  );
}
