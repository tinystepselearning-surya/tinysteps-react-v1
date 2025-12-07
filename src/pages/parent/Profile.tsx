import React from 'react'
import { ParentHeader } from './components/layout/ParentHeader'
import { useAuthStore } from '../../store/useAuthStore'

export default function ParentProfile() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) return <div className="p-6">Loading profile…</div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <ParentHeader name={user?.displayName || 'Parent'} />

      <div className="mt-6 max-w-3xl">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>
        <div className="bg-white dark:bg-slate-800 p-4 rounded shadow">
          <p><strong>Name:</strong> {user?.displayName || '—'}</p>
          <p><strong>Email:</strong> {user?.email || '—'}</p>
          <p><strong>Role:</strong> {user?.role || 'parent'}</p>
        </div>
      </div>
    </div>
  )
}
