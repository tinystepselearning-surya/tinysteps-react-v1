import React from 'react';
import { useRealtimeData } from '../../hooks/useRealtime';
import { useAuthStore } from '../../store/useAuthStore';

export default function LPDuesTracker() {
  const { user } = useAuthStore();
  const { data: invoices = [], isLoading, error } = useRealtimeData('invoices', []);

  if (isLoading) return <div>Loading dues...</div>;
  if (error) return <div className="text-red-600">Failed to load invoices: {String(error.message)}</div>;

  // filter for this LP and issued status
  const mine = invoices.filter((inv: any) => inv.lpId === user?.uid && inv.status === 'issued');
  const totalDue = mine.reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0);
  const overdue = mine.filter((inv: any) => new Date(inv.dueDate) < new Date()).length;

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Dues This Week</h2>
      <p>Total Due: ₹{totalDue}</p>
      <p className="text-red-600">Overdue: {overdue} invoices</p>

      <div className="mt-4 space-y-2">
        {mine.map((inv: any) => (
          <div key={inv.id} className="p-3 bg-gray-50 rounded flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-700">{inv.parentId}</div>
              <div className="text-xs text-gray-500">Due: {inv.dueDate}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="font-semibold">₹{inv.amount}</div>
              <button className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Follow Up</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
