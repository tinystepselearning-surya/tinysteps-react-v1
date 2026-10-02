import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolvePreferredSessionTeacherRef } from '../../lib/sessionTeacherRefs';
import {
  buildTeacherDailyReminderGroups,
  buildTeacherDailyReminderMessage,
} from '../../pages/admin/teacherDailyReminder';

const pageSource = readFileSync(
  resolve(process.cwd(), 'src/pages/admin/TodaysNotifications.tsx'),
  'utf8',
);

describe('Sessions Management teacher updates UI', () => {
  it('adds Student Updates and Teacher Updates without changing the date modes', () => {
    expect(pageSource).toContain("type UpdatesAudience = 'students' | 'teachers';");
    expect(pageSource).toContain("useState<UpdatesAudience>('students')");
    expect(pageSource).toContain('Student Updates');
    expect(pageSource).toContain('Teacher Updates');
    expect(pageSource).toContain("mode === 'today'");
    expect(pageSource).toContain("mode === 'upcoming'");
    expect(pageSource).toContain("mode === 'overall-admissions'");
  });

  it('derives teacher rows only from the already-resolved session rows for the active date', () => {
    expect(pageSource).toContain(
      '() => buildTeacherDailyReminderGroups(rows, activeReminderDateKey)',
    );
    expect(pageSource).toContain(
      '[activeReminderDateKey, rows]',
    );
    expect(pageSource).toContain(
      "mode !== 'overall-admissions' && updatesAudience === 'teachers'",
    );
  });

  it('feeds the canonical resolved teacher document ID into the aggregation rows', () => {
    expect(pageSource).toContain(
      "teacherUserDocId: teacherUserResolved?.docId || '',",
    );
    expect(pageSource).toContain(
      '() => buildTeacherDailyReminderGroups(rows, activeReminderDateKey)',
    );
  });

  it('uses teacher-group counts in the date badge while Teacher Updates is active', () => {
    expect(
      pageSource.match(
        /isTeacherUpdatesMode \? teacherDailyGroups\.length : sortedRows\.length/g,
      ),
    ).toHaveLength(2);
  });

  it('shows one teacher row with class count and schedule entries', () => {
    expect(pageSource).toContain('{teacherDailyGroups.map((group) => {');
    expect(pageSource).toContain('{group.classes.length}');
    expect(pageSource).toContain('{group.classes.map((item) => (');
    expect(pageSource).toContain('{item.childName}');
    expect(pageSource).toContain('— {item.timeLabel}');
  });

  it('resolves a reassigned session through the current enrollment teacher to the final WhatsApp destination', () => {
    const session = {
      teacherId: 'teacher-former',
      teacherIds: ['teacher-former', 'teacher-current'],
    };
    const teacherRef = resolvePreferredSessionTeacherRef(session, ['teacher-current']);
    expect(teacherRef).toBe('teacher-current');

    const resolvedUsers = {
      'teacher-former': {
        docId: 'teacher-doc-former',
        name: 'Former Teacher',
        whatsappDigits: '919111111111',
      },
      'teacher-current': {
        docId: 'teacher-doc-current',
        name: 'Current Teacher',
        whatsappDigits: '919222222222',
      },
    };
    const resolvedTeacher = resolvedUsers[teacherRef];

    const [group] = buildTeacherDailyReminderGroups([
      {
        id: 'reassigned-session',
        teacherRef,
        teacherUserDocId: resolvedTeacher.docId,
        teacherName: resolvedTeacher.name,
        teacherWhatsappDigits: resolvedTeacher.whatsappDigits,
        studentLabel: 'Aarav',
        startTime: '15:00',
        sessionDateKey: '2026-10-03',
      },
    ], '2026-10-03');

    expect(group.teacherRef).toBe('teacher-doc-current');
    expect(group.teacherName).toBe('Current Teacher');
    expect(group.teacherWhatsappDigits).toBe('919222222222');
    expect(buildTeacherDailyReminderMessage(group)).toContain('Hello Current Teacher,');
  });

  it('uses enrollment-aware teacher resolution in the row builder', () => {
    expect(pageSource).toContain(
      'const enrollment = enrollmentId ? enrollmentMap[enrollmentId] : undefined;',
    );
    expect(pageSource).toContain('getEnrollmentTeacherRefs(enrollment)');
    expect(pageSource).toContain('}, [enrollmentMap, sessions, usersMap]);');
    expect(pageSource).not.toContain(
      "resolvePreferredSessionTeacherRef(\n          session as unknown as Record<string, unknown>,\n          [],",
    );
  });

  it('compiles one teacher WhatsApp message and opens it through a read/write-free client path', () => {
    expect(pageSource).toContain('buildTeacherDailyReminderMessage(');
    expect(pageSource).toContain(
      'openWhatsApp(group.teacherWhatsappDigits, teacherMessage)',
    );

    const openStart = pageSource.indexOf('const openWhatsApp =');
    const openEnd = pageSource.indexOf('const openMeetingLink =', openStart);
    expect(openStart).toBeGreaterThan(-1);
    expect(openEnd).toBeGreaterThan(openStart);

    const openSource = pageSource.slice(openStart, openEnd);
    expect(openSource).toContain('window.open(');
    expect(openSource).not.toContain('setDoc(');
    expect(openSource).not.toContain('handleNotifiedToggle(');
    expect(openSource).not.toContain('getDoc(');
    expect(openSource).not.toContain('getDocs(');
    expect(openSource).not.toContain('httpsCallable(');
    expect(openSource).not.toContain('onSnapshot(');
  });

  it('requires a WhatsApp-ready number to stay within the E.164 digit limit', () => {
    expect(pageSource).toContain('return length >= 8 && length <= 15;');
  });

  it('uses today for the current day and an explicit date label for another selected date', () => {
    expect(pageSource).toContain(
      "mode === 'today'\n      ? 'today'\n      : formatKolkataShortDateFromDateKey(activeReminderDateKey)",
    );
  });

  it('hides per-session teacher/status controls while viewing the teacher list', () => {
    expect(pageSource).toContain('{!isTeacherUpdatesMode ? (');
    expect(pageSource).toContain(
      "{mode !== 'overall-admissions' && !isTeacherUpdatesMode ? (",
    );
    expect(pageSource).toContain(
      "mode !== 'overall-admissions' && !isTeacherUpdatesMode && teacherFilter !== ALL_TEACHERS_FILTER",
    );
  });
});
