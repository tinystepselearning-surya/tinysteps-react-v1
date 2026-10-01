export interface TeacherDailyReminderSourceRow {
  id: string;
  teacherRef?: string;
  teacherName?: string;
  teacherWhatsappDigits?: string;
  childName?: string;
  studentLabel?: string;
  startTime?: string;
  classTimeIst?: string;
  classTime?: string;
  sessionDateKey?: string;
  date?: string;
}

export interface TeacherDailyReminderClass {
  sessionId: string;
  childName: string;
  timeLabel: string;
  startMinutes: number;
  dateKey: string;
}

export interface TeacherDailyReminderGroup {
  teacherRef: string;
  teacherName: string;
  teacherWhatsappDigits: string;
  classes: TeacherDailyReminderClass[];
}

const normalizeText = (value: unknown): string => String(value || '').trim();

const parseClockMinutes = (value: unknown): number | null => {
  const raw = normalizeText(value);
  if (!raw) return null;

  const match = raw.match(/(\d{1,2})(?::(\d{2}))?\s*([AaPp][Mm])?/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] || '0');
  let meridiem = normalizeText(match[3]).toUpperCase();

  if (!meridiem) {
    const inferred = raw.match(/\b([AaPp][Mm])\b/);
    meridiem = normalizeText(inferred?.[1]).toUpperCase();
  }

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || minutes < 0 || minutes > 59) {
    return null;
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (hours === 12) hours = 0;
    if (meridiem === 'PM') hours += 12;
  } else if (hours < 0 || hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
};

const formatMinutesAs12Hour = (minutes: number): string => {
  const hours24 = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(mins).padStart(2, '0')} ${period}`;
};

const resolveTeacherClassTime = (
  row: TeacherDailyReminderSourceRow,
): { startMinutes: number; timeLabel: string } => {
  const candidates = [row.startTime, row.classTimeIst, row.classTime];
  for (const candidate of candidates) {
    const parsed = parseClockMinutes(candidate);
    if (parsed !== null) {
      return {
        startMinutes: parsed,
        timeLabel: formatMinutesAs12Hour(parsed),
      };
    }
  }

  const fallback = normalizeText(row.classTimeIst || row.classTime || row.startTime) || 'Time TBD';
  return {
    startMinutes: Number.MAX_SAFE_INTEGER,
    timeLabel: fallback,
  };
};

const resolveRowDateKey = (row: TeacherDailyReminderSourceRow): string =>
  normalizeText(row.sessionDateKey || row.date);

export const buildTeacherDailyReminderGroups = (
  rows: TeacherDailyReminderSourceRow[],
  selectedDateKey?: string,
): TeacherDailyReminderGroup[] => {
  const normalizedDateKey = normalizeText(selectedDateKey);
  const groups = new Map<string, TeacherDailyReminderGroup>();

  rows.forEach((row) => {
    const teacherRef = normalizeText(row.teacherRef);
    if (!teacherRef) return;

    const dateKey = resolveRowDateKey(row);
    if (normalizedDateKey && dateKey !== normalizedDateKey) return;

    const teacherName = normalizeText(row.teacherName) || 'Teacher';
    const teacherWhatsappDigits = normalizeText(row.teacherWhatsappDigits).replace(/\D/g, '');
    const childName =
      normalizeText(row.childName) ||
      normalizeText(row.studentLabel) ||
      'Student';
    const time = resolveTeacherClassTime(row);

    const existing = groups.get(teacherRef);
    if (!existing) {
      groups.set(teacherRef, {
        teacherRef,
        teacherName,
        teacherWhatsappDigits,
        classes: [
          {
            sessionId: normalizeText(row.id),
            childName,
            timeLabel: time.timeLabel,
            startMinutes: time.startMinutes,
            dateKey,
          },
        ],
      });
      return;
    }

    if (existing.teacherName === 'Teacher' && teacherName !== 'Teacher') {
      existing.teacherName = teacherName;
    }
    if (!existing.teacherWhatsappDigits && teacherWhatsappDigits) {
      existing.teacherWhatsappDigits = teacherWhatsappDigits;
    }

    existing.classes.push({
      sessionId: normalizeText(row.id),
      childName,
      timeLabel: time.timeLabel,
      startMinutes: time.startMinutes,
      dateKey,
    });
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      classes: [...group.classes].sort((left, right) => {
        const timeDiff = left.startMinutes - right.startMinutes;
        if (timeDiff !== 0) return timeDiff;
        const childDiff = left.childName.localeCompare(right.childName, undefined, {
          sensitivity: 'base',
        });
        if (childDiff !== 0) return childDiff;
        return left.sessionId.localeCompare(right.sessionId);
      }),
    }))
    .sort((left, right) => {
      const nameDiff = left.teacherName.localeCompare(right.teacherName, undefined, {
        sensitivity: 'base',
      });
      if (nameDiff !== 0) return nameDiff;
      return left.teacherRef.localeCompare(right.teacherRef);
    });
};

export const buildTeacherDailyReminderMessage = (
  group: TeacherDailyReminderGroup,
  scheduleLabel = 'today',
): string => {
  const resolvedScheduleLabel = normalizeText(scheduleLabel) || 'today';
  const classLines = group.classes.map(
    (item) => `${item.childName} — ${item.timeLabel}`,
  );

  return [
    `Hello ${group.teacherName || 'Teacher'},`,
    '',
    `Your classes for ${resolvedScheduleLabel}:`,
    ...classLines,
    '',
    'Please join the classes on time.',
    '',
    'Tiny Steps',
  ].join('\n');
};
