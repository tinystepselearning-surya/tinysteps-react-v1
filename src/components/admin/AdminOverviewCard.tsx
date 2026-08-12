// src/components/admin/AdminOverviewCard.tsx
import React from 'react';
import { Card } from '@components/ui/card';
import { useAdminStats } from '../../hooks/useAdminStats';

const AdminOverviewCard: React.FC = () => {
  const { data: stats, isLoading: loading, error } = useAdminStats();
  const errorMessage = error instanceof Error ? error.message : null;

  return (
    <Card className="border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Live operations</p>
          <p className="text-xs text-muted-foreground">Current platform pulse · Asia/Kolkata</p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground" role="status">Loading live operations…</p>
        ) : errorMessage ? (
          <p className="text-sm text-amber-700" role="status">Live operations unavailable: {errorMessage}</p>
        ) : stats ? (
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700">
              Sessions today <strong className="ml-1 tabular-nums text-slate-950">{stats.sessionsToday}</strong>
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700">
              Students <strong className="ml-1 tabular-nums text-slate-950">{stats.totalStudents}</strong>
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No live operations data available.</p>
        )}
      </div>
    </Card>
  );
};

export default AdminOverviewCard;
