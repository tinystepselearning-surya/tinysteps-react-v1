import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import type { DemoSession } from '../../../../types/models';
import { listenTeacherDemoSessions } from '../../../../services/demoSessionsService';
import { DemoAssignmentsView as LegacyDemoAssignmentsView } from './LegacyDemoAssignmentsView';
import TeacherCancelAssignedDemoDialog from './TeacherCancelAssignedDemoDialog';

interface DemoAssignmentsViewProps {
  teacherId?: string;
}

export const DemoAssignmentsView: React.FC<DemoAssignmentsViewProps> = ({ teacherId }) => {
  const [myDemos, setMyDemos] = useState<DemoSession[]>([]);
  const [cancelTarget, setCancelTarget] = useState<DemoSession | null>(null);

  useEffect(() => {
    if (!teacherId) {
      setMyDemos([]);
      return;
    }
    return listenTeacherDemoSessions(
      teacherId,
      setMyDemos,
      (error) => console.error('[DemoAssignmentsView] cancellation panel load failed', error),
    );
  }, [teacherId]);

  const assignedDemos = useMemo(
    () => myDemos.filter((demo) => demo.status === 'assigned'),
    [myDemos],
  );

  return (
    <div className="space-y-4">
      {assignedDemos.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Assigned Demo Actions</h3>
                <Badge variant="outline">{assignedDemos.length} assigned</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Complete delivered demos from the normal demo table below. If a demo cannot be conducted,
                cancel the attempt here with a reason so the admin team can follow up or reschedule it.
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-2 lg:grid-cols-2">
            {assignedDemos.map((demo) => (
              <div key={demo.id} className="flex items-center justify-between gap-3 rounded-lg border bg-white p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">
                    {demo.childName || 'Student'} · {demo.courseInterested || 'Demo'}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-500">
                    {demo.teacherConfirmedDate || 'Date not set'} {demo.teacherConfirmedTime || ''}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setCancelTarget(demo)}>
                  Cancel demo
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <LegacyDemoAssignmentsView teacherId={teacherId} />

      <TeacherCancelAssignedDemoDialog
        demo={cancelTarget}
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  );
};
