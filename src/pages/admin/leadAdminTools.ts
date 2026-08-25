import type { DemoSession } from '../../types/models';

export interface LeadAdminToolRowLike {
  parentName: string;
  childName: string;
  parentPhone: string;
  course: string;
  source: string;
  teacherName: string;
  statusLabel: string;
  createdAtMs: number;
  updatedAtMs: number;
  followUpAtMs: number;
  demo: DemoSession | null;
  lead?: {
    id?: string;
    createdAt?: unknown;
    updatedAt?: unknown;
  } | null;
}

export interface LeadTimelineItem {
  key: string;
  atMs: number;
  title: string;
  detail: string;
  actor: string;
}

const normalizeText = (value: unknown): string => String(value || '').trim();

const toMs = (value: unknown): number => {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && value !== null) {
    const candidate = value as { toMillis?: () => number; seconds?: number };
    if (typeof candidate.toMillis === 'function') return candidate.toMillis();
    if (typeof candidate.seconds === 'number') return candidate.seconds * 1000;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return 0;
};

const labelize = (value: unknown): string =>
  normalizeText(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const buildLeadAdminSummary = (row: LeadAdminToolRowLike): string =>
  [
    `Parent: ${row.parentName}`,
    `Phone: ${row.parentPhone}`,
    `Child: ${row.childName}`,
    `Course: ${row.course}`,
    `Source: ${row.source}`,
    `Status: ${row.statusLabel}`,
    `Teacher: ${row.teacherName}`,
    row.demo?.preferredDateTimeText ? `Preferred slot: ${row.demo.preferredDateTimeText}` : '',
    row.demo?.timezone ? `Timezone: ${row.demo.timezone}` : '',
  ]
    .filter(Boolean)
    .join('\n');

export const buildLeadWhatsAppHelperMessage = (row: LeadAdminToolRowLike): string =>
  [
    `Hi ${row.parentName},`,
    `This is Tiny Steps regarding ${row.childName}'s ${row.course} demo class.`,
    row.demo?.preferredDateTimeText
      ? `We noted your preferred slot: ${row.demo.preferredDateTimeText}${row.demo.timezone ? ` (${row.demo.timezone})` : ''}.`
      : '',
    'Please let us know a suitable time or confirm the preferred slot.',
    'Thank you.',
  ]
    .filter(Boolean)
    .join('\n');

export const buildLeadFollowUpMessage = (row: LeadAdminToolRowLike): string =>
  [
    `Hi ${row.parentName},`,
    `Following up regarding ${row.childName}'s Tiny Steps demo class.`,
    row.demo?.recommendedCourse ? `Recommended course: ${row.demo.recommendedCourse}.` : '',
    row.demo?.recommendedFrequency ? `Suggested frequency: ${row.demo.recommendedFrequency}.` : '',
    row.demo?.followUpDate ? `Follow-up date: ${row.demo.followUpDate}.` : '',
    'Please let us know how you would like to proceed.',
    'Thank you.',
  ]
    .filter(Boolean)
    .join('\n');

export const buildLeadTimeline = (row: LeadAdminToolRowLike): LeadTimelineItem[] => {
  const items: LeadTimelineItem[] = [];
  const leadCreatedAtMs = toMs(row.lead?.createdAt) || row.createdAtMs;
  if (leadCreatedAtMs > 0) {
    items.push({
      key: `lead-created-${leadCreatedAtMs}`,
      atMs: leadCreatedAtMs,
      title: 'Enquiry received',
      detail: `${row.parentName} · ${row.childName}`,
      actor: 'Lead workflow',
    });
  }

  (row.demo?.history || []).forEach((entry, index) => {
    if (!entry?.atMs) return;
    items.push({
      key: `demo-history-${entry.atMs}-${index}`,
      atMs: entry.atMs,
      title: labelize(entry.action) || 'Demo update',
      detail: normalizeText(entry.note) || 'Demo workflow updated',
      actor: normalizeText(entry.actorName || entry.actorId) || 'System',
    });
  });

  if (items.length === 0 && row.updatedAtMs > 0) {
    items.push({
      key: `row-updated-${row.updatedAtMs}`,
      atMs: row.updatedAtMs,
      title: 'Record updated',
      detail: row.statusLabel,
      actor: 'Lead workflow',
    });
  }

  return items.sort((left, right) => right.atMs - left.atMs);
};

export const resolveLeadRecoveryActions = (demo: DemoSession | null) => {
  const status = normalizeText(demo?.status).toLowerCase();
  const conversionStatus = normalizeText(demo?.conversionStatus).toLowerCase();
  return {
    canReassign: status === 'assigned',
    canRelease: status === 'assigned',
    canCancel: status === 'open' || status === 'assigned',
    canUndoCompletion: status === 'completed',
    canReopenCancelled: status === 'cancelled',
    enrollmentGuard: conversionStatus === 'enrolled',
  };
};
