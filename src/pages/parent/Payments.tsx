import React from 'react'
import { ParentHeader } from './components/layout/ParentHeader'
import { useAuthStore } from '../../store/useAuthStore'

export default function ParentPayments() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) return <div className="p-6">Loading payments…</div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <ParentHeader name={user?.displayName || 'Parent'} />

      <div className="mt-6 max-w-3xl">
        <h2 className="text-xl font-semibold mb-4">Wallet & Payments</h2>
        <div className="bg-white dark:bg-slate-800 p-4 rounded shadow">
          <p className="mb-2">
            Your wallet is the source of truth for dues and advance balance.
          </p>
          <p className="text-sm text-muted-foreground">
            Open the parent dashboard Payments tab to review wallet balance, class deductions, and recent wallet activity.
          </p>
        </div>
      </div>
    </div>
  )
}
