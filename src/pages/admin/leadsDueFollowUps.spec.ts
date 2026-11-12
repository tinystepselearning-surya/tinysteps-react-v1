import { describe, expect, it } from 'vitest';
import { isAdminFollowUpDue } from './leadsDueFollowUps';

const dateAtIst = (day: string, clock: string): number =>
  Date.parse(`${day}T${clock}+05:30`);

describe('bounded admin follow-up priority', () => {
  const today = '2026-11-13';

  it('includes an Admin Review follow-up earlier today or overdue', () => {
    expect(isAdminFollowUpDue({
      bucket: 'admin_review',
      followUpAtMs: dateAtIst(today, '12:00:00.000'),
    }, today)).toBe(true);
    expect(isAdminFollowUpDue({
      bucket: 'admin_review',
      followUpAtMs: dateAtIst('2026-11-12', '23:59:59.999'),
    }, today)).toBe(true);
  });

  it('includes the end-of-day IST boundary and excludes tomorrow', () => {
    expect(isAdminFollowUpDue({
      bucket: 'admin_review',
      followUpAtMs: dateAtIst(today, '23:59:59.999'),
    }, today)).toBe(true);
    expect(isAdminFollowUpDue({
      bucket: 'admin_review',
      followUpAtMs: dateAtIst('2026-11-14', '00:00:00.000'),
    }, today)).toBe(false);
  });

  it('does not count an Open, With Teacher, or Closed lead as admin due', () => {
    for (const bucket of ['open', 'in_progress', 'closed'] as const) {
      expect(isAdminFollowUpDue({
        bucket,
        followUpAtMs: dateAtIst(today, '12:00:00.000'),
      }, today)).toBe(false);
    }
  });

  it('never equates unknown or invalid follow-up dates to a missed contact', () => {
    for (const followUpAtMs of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(isAdminFollowUpDue({
        bucket: 'admin_review',
        followUpAtMs,
      }, today)).toBe(false);
    }
    expect(isAdminFollowUpDue({
      bucket: 'admin_review',
      followUpAtMs: dateAtIst(today, '12:00:00.000'),
    }, '')).toBe(false);
  });

  it('adds no fetching, messaging, or mutation to a pure workload predicate', async () => {
    const source = await import('./leadsDueFollowUps?raw').then((module) => module.default as string);
    expect(source).not.toContain('firebase/firestore');
    expect(source).not.toContain('fetchLeadCommunications');
    expect(source).not.toContain('window.open');
    const workspace = await import('./LeadsInquiriesWorkspaceV2?raw').then((module) => module.default as string);
    expect(workspace).toContain('Scheduled Admin Review follow-ups due by today (IST) within the selected enquiry period only.');
    expect(workspace).toContain("setBucket('admin_review');");
    expect(workspace).toContain("setDueTodayOnly((current) => !current);");
  });
});
