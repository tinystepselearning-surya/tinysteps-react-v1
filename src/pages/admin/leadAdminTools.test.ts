import { describe, expect, it } from 'vitest';
import type { DemoSession } from '../../types/models';
import {
  buildLeadAdminSummary,
  buildLeadTimeline,
  resolveLeadRecoveryActions,
} from './leadAdminTools';

const demo = (overrides: Partial<DemoSession> = {}): DemoSession => ({
  id: 'demo-1',
  parentName: 'Parent',
  childName: 'Child',
  childGrade: '1',
  courseInterested: 'Phonics',
  preferredDateTimeText: 'Tomorrow 4 pm',
  status: 'completed',
  createdBy: 'admin',
  history: [
    { action: 'assigned', actorName: 'Admin', atMs: 20, note: 'Assigned to Teacher A' },
    { action: 'completed', actorName: 'Teacher A', atMs: 30, note: 'Outcome: completed' },
  ],
  ...overrides,
});

const row = (demoValue: DemoSession | null) => ({
  parentName: 'Parent',
  childName: 'Child',
  parentPhone: '+91 99999 99999',
  course: 'Phonics',
  source: 'Website',
  teacherName: 'Teacher A',
  statusLabel: 'Ready for admin review',
  createdAtMs: 10,
  updatedAtMs: 30,
  followUpAtMs: 0,
  demo: demoValue,
  lead: { id: 'lead-1' },
});

describe('lead admin tools', () => {
  it('offers the correct recovery action for each demo lifecycle state', () => {
    expect(resolveLeadRecoveryActions(demo({ status: 'assigned' }))).toMatchObject({
      canReassign: true,
      canRelease: true,
      canCancel: true,
      canUndoCompletion: false,
    });
    expect(resolveLeadRecoveryActions(demo({ status: 'completed' }))).toMatchObject({
      canRelease: false,
      canCancel: false,
      canUndoCompletion: true,
    });
    expect(resolveLeadRecoveryActions(demo({ status: 'cancelled' }))).toMatchObject({
      canReopenCancelled: true,
    });
  });

  it('guards enrolled demos from independent completion reversal', () => {
    expect(resolveLeadRecoveryActions(demo({ conversionStatus: 'enrolled' })).enrollmentGuard).toBe(true);
  });

  it('builds timeline from data already present on the row', () => {
    const timeline = buildLeadTimeline(row(demo()));
    expect(timeline.map((item) => item.title)).toEqual(['Completed', 'Assigned', 'Enquiry received']);
  });

  it('builds a copyable summary without another data lookup', () => {
    expect(buildLeadAdminSummary(row(demo()))).toContain('Parent: Parent');
    expect(buildLeadAdminSummary(row(demo()))).toContain('Course: Phonics');
  });
});
