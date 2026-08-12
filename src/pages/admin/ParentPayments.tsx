import React, { useState } from 'react';
import { Button } from '@components/ui/button';
import ParentPaymentsV2 from './ParentPaymentsV2';
import ParentPaymentsLegacy from './ParentPaymentsLegacy';

type Workspace = 'v2' | 'maintenance';

export default function ParentPayments(): JSX.Element {
  const [workspace, setWorkspace] = useState<Workspace>('v2');

  if (workspace === 'maintenance') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-amber-50/60 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Financial maintenance workspace</div>
            <div className="mt-0.5 text-xs text-slate-600">
              Legacy wallet adjustment, reconciliation and automation tools are preserved here for exceptional admin work.
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setWorkspace('v2')}>
            Back to Parent Payments V2
          </Button>
        </div>
        <ParentPaymentsLegacy />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setWorkspace('maintenance')}>
          Financial maintenance tools
        </Button>
      </div>
      <ParentPaymentsV2 />
    </div>
  );
}
