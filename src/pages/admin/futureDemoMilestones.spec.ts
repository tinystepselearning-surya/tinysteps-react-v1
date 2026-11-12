import { describe, expect, it } from 'vitest';
import type { DemoSession } from '../../types/models';
import {
  buildFutureDemoMilestones,
  parseFutureDemoCutover,
  type FutureWebsiteLead,
} from './futureDemoMilestones';

const ts = (iso: string) => ({ toMillis: () => Date.parse(iso) });
const CUTOVER = '2026-11-14T10:00:00+05:30';
const NOW = Date.parse('2026-11-20T23:00:00+05:30');
const before = '2026-11-13T12:00:00+05:30';
const after = '2026-11-14T10:02:00+05:30';
const hash = (char: string) => char.repeat(64);

function lead(id: string, identity: string, when = after): FutureWebsiteLead {
  return {
    id, source: 'website', firstInquiryAt: ts(when),
    dedupeIdentityKey: hash(identity), dedupeCanonicalLeadId: id,
  };
}

function demo(id: string, leadId: string, overrides: Partial<DemoSession> = {}): DemoSession {
  return {
    id, leadId, parentName: 'Parent', childName: 'Child', childGrade: '1',
    courseInterested: 'Phonics', preferredDateTimeText: 'Evenings',
    createdBy: 'system', status: 'open',
    createdAt: ts('2026-11-14T10:03:00+05:30') as any,
    ...overrides,
  };
}

const scheduled = {
  status: 'assigned' as const,
  assignedTeacherId: 'teacher-a',
  assignedAt: ts('2026-11-14T10:04:00+05:30') as any,
  teacherConfirmedDate: '2026-11-15',
  teacherConfirmedTime: '17:30',
};

const delivered = {
  ...scheduled,
  status: 'completed' as const,
  outcome: 'completed' as const,
  completedAt: ts('2026-11-15T18:05:00+05:30') as any,
};

describe('prospective website demo milestone evidence', () => {
  it('refuses missing, invalid, future, or pre-policy cutover values', () => {
    for (const value of ['', '2026-11-13', '2026-11-14T10:00:00Z',
      '2026-11-12T23:59:59+05:30', '2026-11-21T10:00:00+05:30',
      '2026-13-14T10:00:00+05:30']) {
      expect(parseFutureDemoCutover(value, NOW)).toBeNull();
      expect(buildFutureDemoMilestones([], [], value, NOW)).toBeNull();
    }
    expect(parseFutureDemoCutover(CUTOVER, NOW)).toBe(Date.parse(CUTOVER));
  });

  it('counts one milestone per canonical parent-child regardless of repeat demo attempts', () => {
    const leads = [lead('first-child', 'a'), lead('second-child', 'b')];
    const attempts = [
      demo('auto-open', 'first-child'),
      demo('teacher-slot', 'first-child', scheduled),
      demo('repeated-demo', 'first-child', {
        ...delivered, conversionStatus: 'enrolled',
        enrolledAt: ts('2026-11-16T10:00:00+05:30') as any,
      }),
      demo('second-child-request', 'second-child'),
    ];
    const result = buildFutureDemoMilestones(leads, attempts, CUTOVER, NOW);
    expect(result).toEqual({
      cutoverIst: CUTOVER,
      websiteEnquiries: 2, demoRequests: 2,
      teacherScheduledSlots: 1, deliveredAssessments: 1, recordedEnrolments: 1,
      unresolvedNewWebsiteRecords: 0,
    });
  });

  it('never treats auto-created open or teacher assignment without slot as confirmed appointments', () => {
    const leads = [lead('open', 'a'), lead('assigned-no-time', 'b')];
    const result = buildFutureDemoMilestones(leads, [
      demo('open-demo', 'open'),
      demo('incomplete-slot', 'assigned-no-time', {
        status: 'assigned',
        assignedTeacherId: 'teacher-a',
        assignedAt: ts('2026-11-14T10:05:00+05:30') as any,
      }),
    ], CUTOVER, NOW);
    expect(result?.demoRequests).toBe(2);
    expect(result?.teacherScheduledSlots).toBe(0);
    expect(result?.deliveredAssessments).toBe(0);
  });

  it('excludes no-shows and reschedules even when they were marked completed', () => {
    const leads = [lead('parent-no-show', 'a'), lead('teacher-no-show', 'b'),
      lead('reschedule', 'c')];
    const outcomes = ['parent_no_show', 'teacher_no_show', 'reschedule_requested'] as const;
    const attempts = outcomes.map((outcome, index) => demo(
      'attempt-' + index, leads[index].id, {
        ...delivered, outcome, conversionStatus: 'enrolled',
        enrolledAt: ts('2026-11-16T10:00:00+05:30') as any,
      },
    ));
    const result = buildFutureDemoMilestones(leads, attempts, CUTOVER, NOW);
    expect(result?.deliveredAssessments).toBe(0);
    expect(result?.recordedEnrolments).toBe(0);
  });

  it('counts no old leads and no pre-cutover demo events or unenforced enrolment timestamps', () => {
    const leads = [lead('old', 'a', before), lead('new', 'b')];
    const result = buildFutureDemoMilestones(leads, [
      demo('old-attempt', 'old', delivered),
      demo('pre-cutover-attempt', 'new', {
        ...delivered, createdAt: ts(before) as any,
      }),
      demo('missing-enrolled-at', 'new', {
        ...delivered, conversionStatus: 'enrolled',
        enrolledAt: null,
      }),
    ], CUTOVER, NOW);
    expect(result?.websiteEnquiries).toBe(1);
    expect(result?.demoRequests).toBe(1);
    expect(result?.deliveredAssessments).toBe(1);
    expect(result?.recordedEnrolments).toBe(0);
  });

  it('keeps identity conflicts unresolved and never links a demo owned by another child', () => {
    const leads: FutureWebsiteLead[] = [
      lead('child-a', 'a'),
      { ...lead('child-b', 'b'), dedupeCanonicalLeadId: 'child-a' },
      { ...lead('child-c', 'c'), dedupeIdentityKey: null },
      lead('repeat-doc', 'a'),
      lead('child-d', 'd'),
    ];
    leads[4].demoSessionId = 'conflicting-owner';
    const result = buildFutureDemoMilestones(leads, [
      demo('conflicting-owner', 'someone-else', delivered),
    ], CUTOVER, NOW);
    expect(result?.websiteEnquiries).toBe(2);
    expect(result?.unresolvedNewWebsiteRecords).toBe(2);
    expect(result?.demoRequests).toBe(0);
  });

  it('is a pure projection with no Firestore, GA4, ledger, or WhatsApp side effects', async () => {
    const source = await import('./futureDemoMilestones?raw').then((mod) => mod.default as string);
    for (const prohibited of ['firebase/firestore', 'httpsCallable', 'trackEvent',
      'window.open', 'addDoc(', 'updateDoc(', 'setDoc(', 'onSnapshot(']) {
      expect(source).not.toContain(prohibited);
    }
  });
});
