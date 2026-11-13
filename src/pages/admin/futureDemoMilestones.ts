import type { DemoSession } from '../../types/models';
import { toMillis, type LeadFunnelLead } from './leadFunnelAnalytics';

export interface FutureWebsiteLead extends LeadFunnelLead {
  firstInquiryAt?: unknown;
  receivedAtOriginal?: unknown;
  dedupeCanonicalLeadId?: string | null;
  dedupeIdentityKey?: string | null;
  archived?: boolean;
}

export interface FutureDemoMilestones {
  cutoverIst: string;
  websiteEnquiries: number;
  demoRequests: number;
  teacherScheduledSlots: number;
  deliveredAssessments: number;
  recordedEnrolments: number;
  unresolvedNewWebsiteRecords: number;
}

const EARLIEST_ALLOWED_CUTOVER_MS = Date.parse('2026-11-13T00:00:00+05:30');
const NO_SHOW_OR_RESCHEDULE = new Set([
  'parent_no_show', 'teacher_no_show', 'reschedule_requested',
]);

/** The release owner must set the actual production cutover timestamp in IST. */
export function parseFutureDemoCutover(value: string, nowMs: number): number | null {
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\+05:30$/.test(normalized)) {
    return null;
  }
  const ms = Date.parse(normalized);
  if (!Number.isFinite(ms) || ms < EARLIEST_ALLOWED_CUTOVER_MS || ms > nowMs) return null;
  const expectedIstDay = normalized.slice(0, 10);
  const actualIstDay = new Date(ms + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return expectedIstDay === actualIstDay ? ms : null;
}

const firstObservedAtMs = (lead: FutureWebsiteLead): number => {
  for (const field of [
    lead.firstInquiryAt, lead.receivedAtOriginal, lead.receivedAt, lead.requestedAt, lead.createdAt,
  ]) {
    const ms = toMillis(field);
    if (ms > 0) return ms;
  }
  return 0;
};

const hasTeacherScheduledSlot = (demo: DemoSession, cutoverMs: number): boolean =>
  ['assigned', 'completed'].includes(demo.status) &&
  Boolean(String(demo.assignedTeacherId || '').trim()) &&
  toMillis(demo.assignedAt) >= cutoverMs &&
  /^\d{4}-\d{2}-\d{2}$/.test(String(demo.teacherConfirmedDate || '')) &&
  /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(demo.teacherConfirmedTime || ''));

const isDelivered = (demo: DemoSession, cutoverMs: number): boolean =>
  demo.status === 'completed' &&
  toMillis(demo.completedAt) >= cutoverMs &&
  !NO_SHOW_OR_RESCHEDULE.has(String(demo.outcome || '').trim().toLowerCase());

/**
 * Prospective, read-only and website-only. Each canonical parent-child identity is
 * counted once, no matter how many retries or rescheduled demo attempts exist.
 * Parent-confirmed appointments and payments are NOT asserted by this projection.
 */
export function buildFutureDemoMilestones(
  leads: FutureWebsiteLead[],
  demos: DemoSession[],
  cutoverIst: string,
  nowMs: number,
): FutureDemoMilestones | null {
  const cutoverMs = parseFutureDemoCutover(cutoverIst, nowMs);
  if (cutoverMs === null) return null;

  const byLead = new Map<string, DemoSession[]>();
  const byDemoId = new Map<string, DemoSession>();
  for (const demo of demos) {
    if ((demo as DemoSession & { archived?: boolean }).archived === true) continue;
    if (!demo.id || toMillis(demo.createdAt) < cutoverMs) continue;
    byDemoId.set(demo.id, demo);
    const explicitLeadId = String(demo.leadId || '').trim();
    if (!explicitLeadId) continue;
    const linked = byLead.get(explicitLeadId) || [];
    linked.push(demo);
    byLead.set(explicitLeadId, linked);
  }

  const uniqueIdentities = new Set<string>();
  const result: FutureDemoMilestones = {
    cutoverIst,
    websiteEnquiries: 0,
    demoRequests: 0,
    teacherScheduledSlots: 0,
    deliveredAssessments: 0,
    recordedEnrolments: 0,
    unresolvedNewWebsiteRecords: 0,
  };

  for (const lead of leads) {
    if (lead.source !== 'website' || lead.archived === true || !lead.id) continue;
    const firstAt = firstObservedAtMs(lead);
    if (firstAt < cutoverMs || firstAt > nowMs) continue;

    const identity = String(lead.dedupeIdentityKey || '');
    if (!/^[a-f0-9]{64}$/.test(identity) || lead.dedupeCanonicalLeadId !== lead.id) {
      result.unresolvedNewWebsiteRecords += 1;
      continue;
    }
    if (uniqueIdentities.has(identity)) continue;
    uniqueIdentities.add(identity);
    result.websiteEnquiries += 1;

    const matching = new Map<string, DemoSession>();
    for (const demo of byLead.get(lead.id) || []) {
      if (toMillis(demo.createdAt) >= firstAt) matching.set(demo.id, demo);
    }
    const explicit = lead.demoSessionId ? byDemoId.get(lead.demoSessionId) : undefined;
    if (
      explicit &&
      (!explicit.leadId || explicit.leadId === lead.id) &&
      toMillis(explicit.createdAt) >= firstAt
    ) {
      matching.set(explicit.id, explicit);
    }
    const attempts = [...matching.values()];
    if (attempts.length > 0) result.demoRequests += 1;
    if (attempts.some((demo) => hasTeacherScheduledSlot(demo, cutoverMs))) {
      result.teacherScheduledSlots += 1;
    }
    if (attempts.some((demo) => isDelivered(demo, cutoverMs))) {
      result.deliveredAssessments += 1;
    }
    if (attempts.some((demo) =>
      isDelivered(demo, cutoverMs) &&
      demo.conversionStatus === 'enrolled' &&
      toMillis(demo.enrolledAt) >= cutoverMs
    )) {
      result.recordedEnrolments += 1;
    }
  }
  return result;
}
