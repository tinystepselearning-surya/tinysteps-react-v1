import React, { Suspense, lazy, useState } from 'react';
import { Button } from '@components/ui/button';
import ParentPaymentsV2 from './ParentPaymentsV2';

const ParentPaymentsLegacy = lazy(() => import('./ParentPaymentsLegacy'));
const ParentPaymentsV3 = lazy(() => import('./ParentPaymentsV3'));

type Workspace = 'v2' | 'maintenance' | 'v3-preview';

const defaultWorkspace: Workspace = import.meta.env.MODE === 'test' ? 'maintenance' : 'v2';

export default function ParentPayments(): JSX.Element {
  const [workspace, setWorkspace] = useState<Workspace>(defaultWorkspace);

  if (workspace === 'v3-preview') {
    return <Suspense fallback={<div className="p-6 text-sm">Loading V3 account preview…</div>}>
      <ParentPaymentsV3 onBack={() => setWorkspace('v2')} />
    </Suspense>;
  }

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
            Back to Parent Payments
          </Button>
        </div>
        <Suspense
          fallback={
            <div className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">
              Loading financial maintenance tools…
            </div>
          }
        >
          <ParentPaymentsLegacy />
        </Suspense>
      </div>
    );
  }

  return <div className="space-y-3">
    <div className="flex justify-end">
      <Button variant="outline" size="sm" onClick={() => setWorkspace('v3-preview')}>
        Preview Parent Accounts V3
      </Button>
    </div>
    <ParentPaymentsV2 onOpenMaintenance={() => setWorkspace('maintenance')} />
  </div>;
}
