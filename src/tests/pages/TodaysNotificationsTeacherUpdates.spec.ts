import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

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

  it('shows one teacher row with class count and schedule entries', () => {
    expect(pageSource).toContain('{teacherDailyGroups.map((group) => {');
    expect(pageSource).toContain('{group.classes.length}');
    expect(pageSource).toContain('{group.classes.map((item) => (');
    expect(pageSource).toContain('{item.childName}');
    expect(pageSource).toContain('— {item.timeLabel}');
  });

  it('compiles one teacher WhatsApp message and opens it without notification fan-out writes', () => {
    const teacherViewStart = pageSource.indexOf(') : isTeacherUpdatesMode ? (');
    const teacherViewEnd = pageSource.indexOf('      ) : (', teacherViewStart + 1);
    expect(teacherViewStart).toBeGreaterThan(-1);
    expect(teacherViewEnd).toBeGreaterThan(teacherViewStart);

    const teacherViewSource = pageSource.slice(teacherViewStart, teacherViewEnd);
    expect(teacherViewSource).toContain('buildTeacherDailyReminderMessage(');
    expect(teacherViewSource).toContain(
      'openWhatsApp(group.teacherWhatsappDigits, teacherMessage)',
    );
    expect(teacherViewSource).not.toContain('setDoc(');
    expect(teacherViewSource).not.toContain('handleNotifiedToggle(');
    expect(teacherViewSource).not.toContain('getDoc(');
    expect(teacherViewSource).not.toContain('getDocs(');
    expect(teacherViewSource).not.toContain('httpsCallable(');
    expect(teacherViewSource).not.toContain('onSnapshot(');
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
