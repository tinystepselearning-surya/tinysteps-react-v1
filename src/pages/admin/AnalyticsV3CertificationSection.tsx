import React, { useMemo } from 'react';
import { Card } from '@components/ui/card';
import type { DemoSession } from '../../types/models';
import type { LeadFunnelLead } from './leadFunnelAnalytics';
import { todayIstDateKey } from './leadFunnelAnalytics';
import {
  buildAnalyticsV3Certification,
  type AnalyticsCertificationCheckStatus,
  type AnalyticsCertificationOverallStatus,
} from './analyticsV3Certification';

interface AnalyticsV3CertificationSectionProps {
  leads: LeadFunnelLead[];
  demos: DemoSession[];
  startKey?: string;
  endKey?: string;
}

const statusText = (status: AnalyticsCertificationCheckStatus): string => {
  if (status === 'pass') return 'Pass';
  if (status === 'fail') return 'Fail';
  return 'Review';
};

const statusClass = (status: AnalyticsCertificationCheckStatus): string => {
  if (status === 'pass') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'fail') return 'border-rose-200 bg-rose-50 text-rose-800';
  return 'border-amber-200 bg-amber-50 text-amber-800';
};

const overallText = (status: AnalyticsCertificationOverallStatus): string => {
  if (status === 'certified') return 'Certified';
  if (status === 'attention') return 'Needs attention';
  return 'Provisional';
};

const overallClass = (status: AnalyticsCertificationOverallStatus): string => {
  if (status === 'certified') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'attention') return 'border-rose-200 bg-rose-50 text-rose-800';
  return 'border-amber-200 bg-amber-50 text-amber-800';
};

const signed = (value: number): string => `${value > 0 ? '+' : ''}${value}`;

export default function AnalyticsV3CertificationSection({
  leads,
  demos,
  startKey,
  endKey,
}: AnalyticsV3CertificationSectionProps): JSX.Element {
  const todayKey = todayIstDateKey();
  const resolvedEndKey = endKey || todayKey;
  const resolvedStartKey = startKey || (resolvedEndKey ? `${resolvedEndKey.slice(0, 7)}-01` : '');
  const certification = useMemo(
    () => buildAnalyticsV3Certification(leads, demos, resolvedStartKey, resolvedEndKey),
    [demos, leads, resolvedEndKey, resolvedStartKey],
  );

  const staleBacklog =
    certification.operational.staleOpenOver7Days +
    certification.operational.staleAssignedOver7Days +
    certification.operational.staleDecisionOver7Days;
  const linkageIssues =
    certification.linkage.explicitDemoLinksMissing +
    certification.linkage.orphanDemoRecords +
    certification.linkage.demosLinkedToMissingLead +
    certification.linkage.activeDemoCollisions;

  return (
    <Card className="border-slate-200 bg-white p-4 shadow-sm md:p-5" aria-labelledby="analytics-v3-certification-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="analytics-v3-certification-heading" className="text-base font-semibold text-slate-950">
            Analytics V3 certification &amp; data health
          </h3>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
            Final cross-check for the selected lead cohort plus the current live demo workload. It diagnoses drift, stale records and attribution gaps without mutating operational data.
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-500">
            Cohort: {resolvedStartKey || '—'} to {resolvedEndKey || '—'} · Asia/Kolkata
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${overallClass(certification.overall)}`}>
            {overallText(certification.overall)}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            +{certification.additionalFirestoreReads} Firestore reads
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cross-dashboard milestones</div>
          <div className="mt-1 text-xl font-semibold text-slate-950">
            {certification.reconciliation.aligned ? 'Aligned' : 'Review drift'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Created {signed(certification.reconciliation.delta.demoCreated)} · Completed {signed(certification.reconciliation.delta.completed)} · Enrolled {signed(certification.reconciliation.delta.enrolled)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Attribution coverage</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-slate-950">
            {certification.attribution.coveragePercent.toFixed(1)}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {certification.attribution.attributedLeads}/{certification.attribution.cohortLeads} leads · {certification.attribution.legacyUnattributedLeads} legacy/unattributed
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Linkage issues</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-slate-950">{linkageIssues}</div>
          <div className="mt-1 text-[11px] text-slate-500">
            Missing links, orphans, missing leads or active-demo collisions
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Stale live backlog</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-slate-950">{staleBacklog}</div>
          <div className="mt-1 text-[11px] text-slate-500">
            Open / assigned / decision-pending records older than 7 days
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="border-b bg-slate-50 px-3 py-2.5">
            <div className="text-sm font-semibold text-slate-900">Milestone reconciliation</div>
            <div className="mt-0.5 text-[11px] text-slate-500">Canonical demo-record outcome vs lead-side Acquisition projection.</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-sm">
              <thead className="bg-white text-left text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Milestone</th>
                  <th className="px-3 py-2 text-right">Canonical</th>
                  <th className="px-3 py-2 text-right">Lead-side</th>
                  <th className="px-3 py-2 text-right">Delta</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Leads Received', certification.reconciliation.canonical.received, certification.reconciliation.leadProjection.received, certification.reconciliation.delta.received],
                  ['Demo Created', certification.reconciliation.canonical.demoCreated, certification.reconciliation.leadProjection.demoCreated, certification.reconciliation.delta.demoCreated],
                  ['Demo Completed', certification.reconciliation.canonical.completed, certification.reconciliation.leadProjection.completed, certification.reconciliation.delta.completed],
                  ['Enrolled', certification.reconciliation.canonical.enrolled, certification.reconciliation.leadProjection.enrolled, certification.reconciliation.delta.enrolled],
                ].map(([label, canonical, projected, delta]) => (
                  <tr key={String(label)} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-800">{label}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">{canonical}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">{projected}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-800">{signed(Number(delta))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <div className="text-sm font-semibold text-slate-900">Certification checks</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {certification.checks.map((check) => (
              <div key={check.id} className="rounded-lg border border-slate-200 bg-slate-50/45 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-800">{check.label}</div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClass(check.status)}`}>
                    {statusText(check.status)}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-4 text-slate-500">{check.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50/55 px-3 py-2.5 text-xs text-slate-600">
          <strong className="text-slate-800">Retry / reschedule:</strong>{' '}
          {certification.linkage.multipleDemoLeads} multi-demo lead(s); {certification.linkage.rescheduleLinkedMultipleDemoLeads} explicitly reschedule-linked; {certification.linkage.unexplainedMultipleDemoLeads} unexplained.
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/55 px-3 py-2.5 text-xs text-slate-600">
          <strong className="text-slate-800">Attribution gaps:</strong>{' '}
          {certification.attribution.unknownIntakeSourceLeads} selected-cohort lead(s) have an unknown intake source.
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/55 px-3 py-2.5 text-xs text-slate-600">
          <strong className="text-slate-800">Very stale demos:</strong>{' '}
          {certification.operational.veryStaleOpenOver30Days} awaiting-assignment record(s) are older than 30 days.
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="max-w-3xl text-[11px] leading-4 text-slate-500">
          “Review” is an investigation signal, not an automatic cleanup instruction. Brick 8 deliberately does not delete legacy/retry records or manufacture a first-response-time KPI without a trustworthy canonical first-contact timestamp.
        </p>
        <a
          href="/surya?tab=leads"
          className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
        >
          Open Leads &amp; Enquiries
        </a>
      </div>
    </Card>
  );
}
