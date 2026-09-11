import type { DemoSession } from '../../types/models';
import {
  buildDemoOperationalDiagnostics,
  buildLeadFunnelAnalytics,
  dateKeyInRange,
  leadReceivedDateKey,
  type FunnelCohortTotals,
  type LeadFunnelLead,
} from './leadFunnelAnalytics';
import {
  hasLeadDemoCompletedMilestone,
  hasLeadDemoCreatedMilestone,
  hasLeadEnrolledMilestone,
} from './analyticsMeasurementContract';
import {
  hasAttributionEvidence,
  resolveAcquisitionAnalytics,
} from './leadAcquisitionAnalytics';

export type AnalyticsCertificationCheckStatus = 'pass' | 'watch' | 'fail';
export type AnalyticsCertificationOverallStatus = 'certified' | 'provisional' | 'attention';

export type AnalyticsCertificationCheck = {
  id: string;
  label: string;
  status: AnalyticsCertificationCheckStatus;
  detail: string;
};

export type AnalyticsLeadProjectionTotals = {
  received: number;
  demoCreated: number;
  completed: number;
  enrolled: number;
};

export type AnalyticsReconciliation = {
  canonical: AnalyticsLeadProjectionTotals;
  leadProjection: AnalyticsLeadProjectionTotals;
  delta: AnalyticsLeadProjectionTotals;
  aligned: boolean;
};

export type AnalyticsAttributionHealth = {
  cohortLeads: number;
  attributedLeads: number;
  coveragePercent: number;
  legacyUnattributedLeads: number;
  unknownIntakeSourceLeads: number;
};

export type AnalyticsDemoLinkageHealth = {
  explicitDemoLinksMissing: number;
  orphanDemoRecords: number;
  demosLinkedToMissingLead: number;
  multipleDemoLeads: number;
  rescheduleLinkedMultipleDemoLeads: number;
  unexplainedMultipleDemoLeads: number;
  activeDemoCollisions: number;
};

export type AnalyticsV3Certification = {
  startKey: string;
  endKey: string;
  overall: AnalyticsCertificationOverallStatus;
  reconciliation: AnalyticsReconciliation;
  attribution: AnalyticsAttributionHealth;
  linkage: AnalyticsDemoLinkageHealth;
  operational: ReturnType<typeof buildDemoOperationalDiagnostics>;
  checks: AnalyticsCertificationCheck[];
  additionalFirestoreReads: 0;
};

export const ANALYTICS_ATTRIBUTION_COVERAGE_TARGET_PERCENT = 90;

const normalize = (value: unknown): string => String(value || '').trim();

const pct = (part: number, total: number): number =>
  total > 0 ? Math.round((part / total) * 1000) / 10 : 100;

const projectionFromCanonical = (totals: FunnelCohortTotals): AnalyticsLeadProjectionTotals => ({
  received: totals.received,
  demoCreated: totals.demoCreated,
  completed: totals.completed,
  enrolled: totals.enrolled,
});

const buildLeadProjection = (leads: LeadFunnelLead[]): AnalyticsLeadProjectionTotals => {
  const totals: AnalyticsLeadProjectionTotals = {
    received: leads.length,
    demoCreated: 0,
    completed: 0,
    enrolled: 0,
  };

  leads.forEach((lead) => {
    if (hasLeadDemoCreatedMilestone(lead)) totals.demoCreated += 1;
    if (hasLeadDemoCompletedMilestone(lead)) totals.completed += 1;
    if (hasLeadEnrolledMilestone(lead)) totals.enrolled += 1;
  });

  return totals;
};

const subtractTotals = (
  projected: AnalyticsLeadProjectionTotals,
  canonical: AnalyticsLeadProjectionTotals,
): AnalyticsLeadProjectionTotals => ({
  received: projected.received - canonical.received,
  demoCreated: projected.demoCreated - canonical.demoCreated,
  completed: projected.completed - canonical.completed,
  enrolled: projected.enrolled - canonical.enrolled,
});

const totalsAligned = (delta: AnalyticsLeadProjectionTotals): boolean =>
  delta.received === 0 &&
  delta.demoCreated === 0 &&
  delta.completed === 0 &&
  delta.enrolled === 0;

const linkedDemosForLead = (
  lead: LeadFunnelLead,
  demosByLeadId: Map<string, DemoSession[]>,
  demosById: Map<string, DemoSession>,
): DemoSession[] => {
  const byId = new Map<string, DemoSession>();
  (demosByLeadId.get(lead.id) || []).forEach((demo) => byId.set(demo.id, demo));
  const explicitId = normalize(lead.demoSessionId);
  if (explicitId) {
    const explicit = demosById.get(explicitId);
    if (explicit) byId.set(explicit.id, explicit);
  }
  return Array.from(byId.values());
};

const hasRescheduleLink = (demo: DemoSession): boolean =>
  Boolean(normalize(demo.rescheduledFromDemoId) || normalize(demo.rescheduledToDemoId));

const isActiveDemo = (demo: DemoSession): boolean =>
  demo.status === 'open' || demo.status === 'assigned';

export const buildAnalyticsV3Certification = (
  leads: LeadFunnelLead[],
  demos: DemoSession[],
  startKey: string,
  endKey: string,
  now: unknown = new Date(),
): AnalyticsV3Certification => {
  const cohortLeads = leads.filter((lead) =>
    dateKeyInRange(leadReceivedDateKey(lead), startKey, endKey),
  );
  const canonicalResult = buildLeadFunnelAnalytics(leads, demos, startKey, endKey);
  const canonical = projectionFromCanonical(canonicalResult.cohortTotals);
  const leadProjection = buildLeadProjection(cohortLeads);
  const delta = subtractTotals(leadProjection, canonical);
  const reconciliation: AnalyticsReconciliation = {
    canonical,
    leadProjection,
    delta,
    aligned: totalsAligned(delta),
  };

  let attributedLeads = 0;
  let legacyUnattributedLeads = 0;
  let unknownIntakeSourceLeads = 0;
  cohortLeads.forEach((lead) => {
    if (hasAttributionEvidence(lead)) attributedLeads += 1;
    if (resolveAcquisitionAnalytics(lead).group === 'legacy_unattributed') legacyUnattributedLeads += 1;
    if (!normalize(lead.source) || normalize(lead.source).toLowerCase() === 'unknown') unknownIntakeSourceLeads += 1;
  });
  const attribution: AnalyticsAttributionHealth = {
    cohortLeads: cohortLeads.length,
    attributedLeads,
    coveragePercent: pct(attributedLeads, cohortLeads.length),
    legacyUnattributedLeads,
    unknownIntakeSourceLeads,
  };

  const demosById = new Map(demos.map((demo) => [demo.id, demo]));
  const demosByLeadId = new Map<string, DemoSession[]>();
  demos.forEach((demo) => {
    const leadId = normalize(demo.leadId);
    if (!leadId) return;
    const bucket = demosByLeadId.get(leadId) || [];
    bucket.push(demo);
    demosByLeadId.set(leadId, bucket);
  });

  const allLeadIds = new Set(leads.map((lead) => lead.id));
  const referencedDemoIds = new Set(
    leads.map((lead) => normalize(lead.demoSessionId)).filter(Boolean),
  );

  let explicitDemoLinksMissing = 0;
  let multipleDemoLeads = 0;
  let rescheduleLinkedMultipleDemoLeads = 0;
  let unexplainedMultipleDemoLeads = 0;
  let activeDemoCollisions = 0;

  cohortLeads.forEach((lead) => {
    const explicitId = normalize(lead.demoSessionId);
    if (explicitId && !demosById.has(explicitId)) explicitDemoLinksMissing += 1;

    const linked = linkedDemosForLead(lead, demosByLeadId, demosById);
    if (linked.length > 1) {
      multipleDemoLeads += 1;
      if (linked.some(hasRescheduleLink)) rescheduleLinkedMultipleDemoLeads += 1;
      else unexplainedMultipleDemoLeads += 1;
    }
    if (linked.filter(isActiveDemo).length > 1) activeDemoCollisions += 1;
  });

  const orphanDemoRecords = demos.filter((demo) =>
    !normalize(demo.leadId) && !referencedDemoIds.has(demo.id),
  ).length;
  const demosLinkedToMissingLead = demos.filter((demo) => {
    const leadId = normalize(demo.leadId);
    return Boolean(leadId && !allLeadIds.has(leadId));
  }).length;

  const linkage: AnalyticsDemoLinkageHealth = {
    explicitDemoLinksMissing,
    orphanDemoRecords,
    demosLinkedToMissingLead,
    multipleDemoLeads,
    rescheduleLinkedMultipleDemoLeads,
    unexplainedMultipleDemoLeads,
    activeDemoCollisions,
  };

  const operational = buildDemoOperationalDiagnostics(demos, now);
  const funnelMonotonic =
    canonical.demoCreated <= canonical.received &&
    canonical.completed <= canonical.demoCreated &&
    canonical.enrolled <= canonical.completed;
  const staleBacklog =
    operational.staleOpenOver7Days +
    operational.staleAssignedOver7Days +
    operational.staleDecisionOver7Days;

  const checks: AnalyticsCertificationCheck[] = [
    {
      id: 'cohort-reconciliation',
      label: 'Growth ↔ Acquisition milestone reconciliation',
      status: reconciliation.aligned ? 'pass' : 'watch',
      detail: reconciliation.aligned
        ? 'Canonical demo-record milestones and lead-side milestone projections agree for the selected cohort.'
        : `Review lead-side drift: Demo Created Δ ${delta.demoCreated}, Demo Completed Δ ${delta.completed}, Enrolled Δ ${delta.enrolled}.`,
    },
    {
      id: 'funnel-monotonicity',
      label: 'Funnel monotonicity',
      status: funnelMonotonic ? 'pass' : 'fail',
      detail: funnelMonotonic
        ? 'Canonical cohort counts obey Leads ≥ Demo Created ≥ Demo Completed ≥ Enrolled.'
        : 'Canonical milestone counts violate funnel ordering. Do not certify conversion rates until corrected.',
    },
    {
      id: 'explicit-demo-links',
      label: 'Explicit demo-link resolution',
      status: explicitDemoLinksMissing === 0 ? 'pass' : 'fail',
      detail: explicitDemoLinksMissing === 0
        ? 'Every selected-cohort demoSessionId resolves to a loaded demo record.'
        : `${explicitDemoLinksMissing} selected-cohort lead(s) reference a demoSessionId that is not present in the loaded demo records.`,
    },
    {
      id: 'active-demo-collisions',
      label: 'Active demo collision check',
      status: activeDemoCollisions === 0 ? 'pass' : 'watch',
      detail: activeDemoCollisions === 0
        ? 'No selected-cohort lead has more than one simultaneously open/assigned demo record.'
        : `${activeDemoCollisions} selected-cohort lead(s) have multiple active demo records and should be reviewed.`,
    },
    {
      id: 'demo-linkage',
      label: 'Demo linkage integrity',
      status: orphanDemoRecords === 0 && demosLinkedToMissingLead === 0 ? 'pass' : 'watch',
      detail: `${orphanDemoRecords} unlinked demo record(s); ${demosLinkedToMissingLead} demo record(s) point to a lead not present in the loaded lead snapshot. Legacy records are investigation signals, not auto-deletions.`,
    },
    {
      id: 'duplicate-retry-semantics',
      label: 'Retry / reschedule semantics',
      status: unexplainedMultipleDemoLeads === 0 ? 'pass' : 'watch',
      detail: `${multipleDemoLeads} selected-cohort lead(s) have multiple demo records; ${rescheduleLinkedMultipleDemoLeads} are explicitly reschedule-linked; ${unexplainedMultipleDemoLeads} have no reschedule linkage.`,
    },
    {
      id: 'attribution-coverage',
      label: 'Attribution coverage',
      status:
        cohortLeads.length === 0 || attribution.coveragePercent >= ANALYTICS_ATTRIBUTION_COVERAGE_TARGET_PERCENT
          ? 'pass'
          : 'watch',
      detail: cohortLeads.length === 0
        ? 'No leads are present in the selected cohort.'
        : `${attribution.attributedLeads}/${attribution.cohortLeads} leads have first-touch attribution evidence (${attribution.coveragePercent.toFixed(1)}%). Target: ≥${ANALYTICS_ATTRIBUTION_COVERAGE_TARGET_PERCENT}%.`,
    },
    {
      id: 'stale-demo-backlog',
      label: 'Stale live demo backlog',
      status: staleBacklog === 0 ? 'pass' : 'watch',
      detail: `${operational.staleOpenOver7Days} awaiting-assignment, ${operational.staleAssignedOver7Days} assigned, and ${operational.staleDecisionOver7Days} decision-pending record(s) are older than 7 days.`,
    },
    {
      id: 'demo-age-timestamps',
      label: 'Demo aging timestamp coverage',
      status: operational.missingAgeTimestamp === 0 ? 'pass' : 'watch',
      detail: operational.missingAgeTimestamp === 0
        ? 'All live records used for aging have the required timestamp evidence.'
        : `${operational.missingAgeTimestamp} live demo record(s) cannot be aged because the relevant timestamp is missing.`,
    },
    {
      id: 'read-budget',
      label: 'Brick 8 read budget',
      status: 'pass',
      detail: 'Certification reuses the Growth lead/demo snapshots and performs zero additional Firestore reads.',
    },
  ];

  const overall: AnalyticsCertificationOverallStatus = checks.some((check) => check.status === 'fail')
    ? 'attention'
    : checks.some((check) => check.status === 'watch')
      ? 'provisional'
      : 'certified';

  return {
    startKey,
    endKey,
    overall,
    reconciliation,
    attribution,
    linkage,
    operational,
    checks,
    additionalFirestoreReads: 0,
  };
};
