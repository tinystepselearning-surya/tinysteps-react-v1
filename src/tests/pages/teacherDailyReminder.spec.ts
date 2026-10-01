import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildTeacherDailyReminderGroups,
  buildTeacherDailyReminderMessage,
} from '../../pages/admin/teacherDailyReminder';

describe('teacher daily reminder aggregation', () => {
  it('groups by canonical resolved teacher identity, sorts classes by time, and preserves double sessions', () => {
    const groups = buildTeacherDailyReminderGroups([
      {
        id: 'ria-late',
        teacherRef: 'teacher-ria',
        teacherName: 'Ria',
        teacherWhatsappDigits: '919999999999',
        childName: 'Aarav',
        startTime: '18:00',
        sessionDateKey: '2026-10-02',
      },
      {
        id: 'ria-early',
        teacherRef: 'teacher-ria',
        teacherName: 'Ria',
        teacherWhatsappDigits: '919999999999',
        childName: 'Aarav',
        startTime: '16:00',
        sessionDateKey: '2026-10-02',
      },
      {
        id: 'other-ria',
        teacherRef: 'teacher-ria-2',
        teacherName: 'Ria',
        teacherWhatsappDigits: '918888888888',
        childName: 'Diya',
        startTime: '17:00',
        sessionDateKey: '2026-10-02',
      },
    ], '2026-10-02');

    expect(groups).toHaveLength(2);

    const primaryRia = groups.find((group) => group.teacherRef === 'teacher-ria');
    expect(primaryRia?.classes.map((item) => ({
      childName: item.childName,
      timeLabel: item.timeLabel,
      sessionId: item.sessionId,
    }))).toEqual([
      { childName: 'Aarav', timeLabel: '4:00 PM', sessionId: 'ria-early' },
      { childName: 'Aarav', timeLabel: '6:00 PM', sessionId: 'ria-late' },
    ]);

    const secondRia = groups.find((group) => group.teacherRef === 'teacher-ria-2');
    expect(secondRia?.classes).toHaveLength(1);
    expect(secondRia?.teacherWhatsappDigits).toBe('918888888888');
  });

  it('collapses UID and document-ID aliases for the same resolved teacher into one row', () => {
    const groups = buildTeacherDailyReminderGroups([
      {
        id: 'doc-ref-session',
        teacherRef: 'teacher-doc-123',
        teacherUserDocId: 'teacher-doc-123',
        teacherName: 'Ria',
        childName: 'Aarav',
        startTime: '15:00',
        sessionDateKey: '2026-10-02',
      },
      {
        id: 'uid-ref-session',
        teacherRef: 'firebase-auth-uid-ria',
        teacherUserDocId: 'teacher-doc-123',
        teacherName: 'Ria',
        childName: 'Diya',
        startTime: '16:00',
        sessionDateKey: '2026-10-02',
      },
    ], '2026-10-02');

    expect(groups).toHaveLength(1);
    expect(groups[0].teacherRef).toBe('teacher-doc-123');
    expect(groups[0].classes.map((item) => item.sessionId)).toEqual([
      'doc-ref-session',
      'uid-ref-session',
    ]);
  });

  it('uses the full student label for sibling/shared sessions', () => {
    const [group] = buildTeacherDailyReminderGroups([
      {
        id: 'siblings',
        teacherRef: 'teacher-ria',
        teacherUserDocId: 'teacher-ria',
        teacherName: 'Ria',
        childName: 'Saanvika',
        studentLabel: 'Saanvika, Rihana',
        startTime: '17:00',
        sessionDateKey: '2026-10-02',
      },
    ], '2026-10-02');

    expect(group.classes[0].childName).toBe('Saanvika, Rihana');
    expect(buildTeacherDailyReminderMessage(group)).toContain(
      'Saanvika, Rihana — 5:00 PM',
    );
  });

  it('keeps only the selected date and ignores rows without a stable teacher identity', () => {
    const groups = buildTeacherDailyReminderGroups([
      {
        id: 'selected',
        teacherRef: 'teacher-a',
        teacherName: 'Aditi',
        childName: 'Mira',
        classTimeIst: '5:00 PM - 5:35 PM IST',
        sessionDateKey: '2026-10-03',
      },
      {
        id: 'different-date',
        teacherRef: 'teacher-a',
        teacherName: 'Aditi',
        childName: 'Noah',
        startTime: '18:00',
        sessionDateKey: '2026-10-04',
      },
      {
        id: 'missing-ref',
        teacherName: 'Aditi',
        childName: 'Ishaan',
        startTime: '19:00',
        sessionDateKey: '2026-10-03',
      },
    ], '2026-10-03');

    expect(groups).toHaveLength(1);
    expect(groups[0].teacherRef).toBe('teacher-a');
    expect(groups[0].classes.map((item) => item.sessionId)).toEqual(['selected']);
    expect(groups[0].classes[0].timeLabel).toBe('5:00 PM');
  });

  it('fills teacher display data from another row in the same teacher group without another lookup', () => {
    const groups = buildTeacherDailyReminderGroups([
      {
        id: 'first',
        teacherRef: 'teacher-a',
        teacherName: '',
        teacherWhatsappDigits: '',
        childName: 'Mira',
        startTime: '16:00',
        sessionDateKey: '2026-10-03',
      },
      {
        id: 'second',
        teacherRef: 'teacher-a',
        teacherName: 'Aditi',
        teacherWhatsappDigits: '+91 98765 43210',
        childName: 'Noah',
        startTime: '17:00',
        sessionDateKey: '2026-10-03',
      },
    ], '2026-10-03');

    expect(groups).toHaveLength(1);
    expect(groups[0].teacherName).toBe('Aditi');
    expect(groups[0].teacherWhatsappDigits).toBe('919876543210');
  });

  it('builds the compact teacher WhatsApp message with only child name and class time', () => {
    const [group] = buildTeacherDailyReminderGroups([
      {
        id: 'one',
        teacherRef: 'teacher-ria',
        teacherName: 'Ria',
        childName: 'Aarav',
        startTime: '15:00',
        sessionDateKey: '2026-10-03',
      },
      {
        id: 'two',
        teacherRef: 'teacher-ria',
        teacherName: 'Ria',
        childName: 'Diya',
        startTime: '16:30',
        sessionDateKey: '2026-10-03',
      },
    ], '2026-10-03');

    expect(buildTeacherDailyReminderMessage(group, '3 Oct 2026')).toBe(
      [
        'Hello Ria,',
        '',
        'Your classes for 3 Oct 2026:',
        'Aarav — 3:00 PM',
        'Diya — 4:30 PM',
        '',
        'Please join the classes on time.',
        '',
        'Tiny Steps',
      ].join('\n'),
    );
  });

  it('remains a pure in-memory helper with no Firebase or network read path', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/pages/admin/teacherDailyReminder.ts'),
      'utf8',
    );

    expect(source).not.toContain('firebase');
    expect(source).not.toContain('firestore');
    expect(source).not.toContain('httpsCallable');
    expect(source).not.toContain('getDoc(');
    expect(source).not.toContain('getDocs(');
    expect(source).not.toContain('onSnapshot(');
  });
});
