import React from 'react';
import { Card } from '@components/ui/card';
import type { DemoSession } from '../../types/models';
import {
  buildFutureDemoMilestones,
  type FutureWebsiteLead,
} from './futureDemoMilestones';

interface Props {
  leads: FutureWebsiteLead[];
  demos: DemoSession[];
  ready: boolean;
}

const CUTOVER_IST = String(import.meta.env.VITE_ADMISSIONS_FUTURE_DEMO_CUTOVER_IST || '').trim();

export default function FutureDemoMilestonesCard({ leads, demos, ready }: Props): JSX.Element {
  // The release owner must configure the actual live deployment timestamp;
  // until then, the feature cannot display retrospective conversion data.
  const result = ready
    ? buildFutureDemoMilestones(leads, demos, CUTOVER_IST, Date.now())
    : null;

  return (
    <Card className="border-slate-200 bg-white p-4 shadow-sm" aria-label="Future website demo milestones">
      <h3 className="text-base font-semibold text-slate-950">Future website demo milestones</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        New canonical website parent–child enquiries only, measured after this feature is released. No history is backfilled.
      </p>

      {!ready ? (
        <p className="mt-3 text-sm text-slate-600">Waiting for the lead and demo data to load. No provisional conversion counts are shown.</p>
      ) : !result ? (
        <p className="mt-3 text-sm text-slate-600">
          Not active yet. The actual production release cutover must be configured before future demo outcomes can be reported.
          Existing demo operations and acquisition reporting remain available.
        </p>
      ) : (
        <>
          <p className="mt-2 text-xs font-medium text-slate-600">
            First-live cutover: {result.cutoverIst} · Asia/Kolkata
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            {[
              ['New website enquiries', result.websiteEnquiries],
              ['Demo requests linked', result.demoRequests],
              ['Teacher-scheduled slots', result.teacherScheduledSlots],
              ['Delivered assessments', result.deliveredAssessments],
              ['Recorded enrolments', result.recordedEnrolments],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <div className="text-xs text-slate-600">{label}</div>
                <div className="mt-1 text-xl font-semibold tabular-nums text-slate-950">{value}</div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Unresolved new website records (excluded): {result.unresolvedNewWebsiteRecords}.
          </p>
        </>
      )}
      <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
        Teacher-scheduled means a teacher was assigned with a date and time; it does not prove the parent confirmed.
        Delivered assessments exclude recorded no-shows and reschedules. Enrolment requires an explicit enrolled event timestamp;
        it does not mean payment received. Retries count once per canonical child and all milestone values are read-only.
      </p>
    </Card>
  );
}
