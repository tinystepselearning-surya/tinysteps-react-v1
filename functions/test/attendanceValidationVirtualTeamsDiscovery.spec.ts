import { describe, expect, it } from 'vitest';
import { evidence, registry } from './avsGroupFixtures';
import { classifyVirtualTeamsOccurrence, teamsReportServiceDay, virtualCaseId } from '../src/attendanceValidation/virtualTeamsDiscovery';

const onOctober20 = () => {
  const copy = JSON.parse(JSON.stringify(evidence()).replaceAll('2026-09-18', '2026-10-20'));
  copy.session.existingAttendanceStatus = null;
  return copy;
};

describe('virtual-calendar Teams-only attendance', () => {
  it('maps a Teams attendance report to the correct IST service date', () => {
    expect(teamsReportServiceDay({
      id: 'oct-20',
      meetingStartDateTime: '2026-10-20T06:41:00.000Z',
      meetingEndDateTime: '2026-10-20T07:34:00.000Z',
    })).toBe('2026-10-20');
    expect(teamsReportServiceDay({
      id: 'late-night',
      meetingStartDateTime: '2026-10-19T20:00:00.000Z',
      meetingEndDateTime: '2026-10-19T20:40:00.000Z',
    })).toBe('2026-10-20');
  });

  it('uses a stable sidecar key for reruns without creating any classSessions', () => {
    expect(virtualCaseId('enrollment-1', '2026-10-20')).toBe(virtualCaseId('enrollment-1', '2026-10-20'));
    expect(virtualCaseId('enrollment-1', '2026-10-20')).not.toBe(virtualCaseId('enrollment-2', '2026-10-20'));
    expect(virtualCaseId('enrollment-1', '2026-10-20')).toMatch(/^avs_virtual_[a-f0-9]{40}$/);
  });

  it('flags Teams teacher + child attending over 25 minutes with no Tiny Steps session as False Absent', () => {
    const classified = classifyVirtualTeamsOccurrence(onOctober20(), registry, '2026-10-20');
    expect(classified).toMatchObject({ businessOutcome: 'false_absent', teamsPresent: 1, occurrenceCount: 1 });
    expect(classified.seconds).toBeGreaterThan(1500);
  });

  it('does not fabricate a class from a verified under-threshold Teams call', () => {
    const short = onOctober20();
    const learner = short.attendanceReports[0].participantRecords[1];
    learner.rawAttendanceIntervals[0].leaveDateTime = '2026-10-20T10:20:00.000Z';
    learner.rawAttendanceIntervals[0].durationInSeconds = 1200;
    const classified = classifyVirtualTeamsOccurrence(short, registry, '2026-10-20');
    expect(classified.businessOutcome).toBeNull();
  });

  it('requires review if multiple different children appear on the same Teams link', () => {
    const shared = onOctober20();
    const duplicate = JSON.parse(JSON.stringify(shared.attendanceReports[0].participantRecords[1]));
    duplicate.participantRecordId = 'second-child';
    duplicate.emailAddressHash = 'different-child';
    duplicate.displayNameHash = 'second-name';
    shared.attendanceReports[0].participantRecords.push(duplicate);
    const classified = classifyVirtualTeamsOccurrence(shared, registry, '2026-10-20');
    expect(classified.businessOutcome).toBe('not_evaluable');
  });

  it('requires review if the expected teacher cannot be verified', () => {
    const classified = classifyVirtualTeamsOccurrence(onOctober20(), { ...registry, entries: [] }, '2026-10-20');
    expect(classified.businessOutcome).toBe('not_evaluable');
  });

  it('requires review rather than false absent when Teams reports are incomplete', () => {
    const partial = onOctober20();
    partial.completeness.attendanceRecordsComplete = false;
    const classified = classifyVirtualTeamsOccurrence(partial, registry, '2026-10-20');
    expect(classified.businessOutcome).toBe('not_evaluable');
  });

  it('rejects malformed report timestamps instead of quietly dropping evidence', () => {
    expect(() => teamsReportServiceDay({ id: 'bad' })).toThrow();
  });
});
