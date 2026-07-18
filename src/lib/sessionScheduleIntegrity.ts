const IST_OFFSET_MINUTES = 330;
const TIME_HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

const OPERATIONAL_ENROLLMENT_STATUSES = new Set(['active', 'trial']);

const NON_OPERATIONAL_SESSION_STATUSES = new Set(['cancelled', 'paused']);

const SCHEDULE_EXCEPTION_SOURCES = [
  'ad_hoc',
  'adhoc',
  'makeup',
  'reschedule',
  'manual_one_off',
  'approved_request',
  'one_off',
  'replacement',
];

const LEGACY_MANUAL_SESSION_SOURCES = [
  'admin_manual_adhoc',
  'admin_manual_one_off',
  'manual_one_off',
  'manual_adhoc',
  'manual_ad_hoc',
];

const TERMINAL_ENROLLMENT_STATUSES = new Set([
  'completed',
  'cancelled',
  'archived',
  'inactive',
  'discontinued',
  'expired',
]);

export type ManualSessionState = 'approved' | 'cancelled' | 'withdrawn' | 'completed';

export interface EnrollmentWeeklySlot {
  weekday: number;
  time: string;
  durationMinutes: number;
}

const normalizeText = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const normalizeLookupId = (value: unknown): string => {
  return normalizeText(value);
};

const collectEnrollmentKidIds = (enrollmentLike: Record<string, unknown> | undefined): string[] => {
  if (!enrollmentLike) return [];
  const fromKidIds = Array.isArray(enrollmentLike.kidIds) ? enrollmentLike.kidIds : [];
  const fromSingles = [enrollmentLike.kidId, enrollmentLike.studentId, enrollmentLike.childId];
  return Array.from(
    new Set(
      [...fromKidIds, ...fromSingles]
        .map((item) => normalizeLookupId(item))
        .filter(Boolean),
    ),
  );
};

const collectEnrollmentTeacherIds = (enrollmentLike: Record<string, unknown>): string[] => {
  const fromTeacherIds = Array.isArray(enrollmentLike.teacherIds) ? enrollmentLike.teacherIds : [];
  const fromSingles = [
    enrollmentLike.teacherId,
    enrollmentLike.assignedTeacherId,
    enrollmentLike.primaryTeacherId,
    enrollmentLike.teacherUid,
    enrollmentLike.teacher_id,
  ];
  return Array.from(
    new Set(
      [...fromTeacherIds, ...fromSingles]
        .map((item) => normalizeLookupId(item))
        .filter(Boolean),
    ),
  );
};

const collectSessionKidIds = (sessionLike: Record<string, unknown>): string[] => {
  const fromKidIds = Array.isArray(sessionLike.kidIds) ? sessionLike.kidIds : [];
  const fromSingles = [sessionLike.kidId, sessionLike.studentId, sessionLike.childId];
  return Array.from(
    new Set(
      [...fromKidIds, ...fromSingles]
        .map((item) => normalizeLookupId(item))
        .filter(Boolean),
    ),
  );
};

const collectSessionTeacherIds = (sessionLike: Record<string, unknown>): string[] => {
  const fromTeacherIds = Array.isArray(sessionLike.teacherIds) ? sessionLike.teacherIds : [];
  const fromSingles = [
    sessionLike.teacherId,
    sessionLike.assignedTeacherId,
    sessionLike.primaryTeacherId,
    sessionLike.teacherUid,
    sessionLike.teacher_id,
  ];
  return Array.from(
    new Set(
      [...fromTeacherIds, ...fromSingles]
        .map((item) => normalizeLookupId(item))
        .filter(Boolean),
    ),
  );
};

export const normalizeEnrollmentStatusForOperations = (value: unknown): string => {
  const raw = normalizeText(value).toLowerCase();
  if (!raw) return 'active';
  if (raw === 'pending_teacher') return 'trial';
  if (raw === 'pending_payment' || raw === 'pending_lp' || raw === 'pending_lp_assignment') {
    return 'active';
  }
  if (raw === 'enrolled' || raw === 'current' || raw === 'ongoing') return 'active';
  if (raw === 'canceled') return 'cancelled';
  return raw;
};

export const isEnrollmentOperationallyActive = (enrollmentLike: Record<string, unknown> | undefined): boolean => {
  if (!enrollmentLike) return false;
  if (enrollmentLike.archivedAt || enrollmentLike.archived === true || enrollmentLike.isArchived === true) {
    return false;
  }
  const normalized = normalizeEnrollmentStatusForOperations(enrollmentLike.status);
  // Unknown statuses are deliberately non-operational. A new production status
  // must be reviewed and added here instead of silently exposing its sessions.
  return OPERATIONAL_ENROLLMENT_STATUSES.has(normalized);
};

/**
 * Paused enrollments are hidden operationally but continue to reserve the
 * child/course pair. Unknown non-terminal states also reserve it so a new
 * production status cannot silently permit duplicate enrollment creation.
 */
export const doesEnrollmentOccupyCourseSlot = (
  enrollmentLike: Record<string, unknown> | undefined,
): boolean => {
  if (!enrollmentLike) return false;
  if (enrollmentLike.archivedAt || enrollmentLike.archived === true || enrollmentLike.isArchived === true) {
    return false;
  }
  const normalized = normalizeEnrollmentStatusForOperations(enrollmentLike.status);
  return !TERMINAL_ENROLLMENT_STATUSES.has(normalized);
};

export const isSessionStatusOperationallyVisible = (value: unknown): boolean => {
  const normalized = normalizeText(value).toLowerCase();
  const canonical = normalized === 'canceled' ? 'cancelled' : normalized;
  return !NON_OPERATIONAL_SESSION_STATUSES.has(canonical);
};

const isValidWeekday = (value: unknown): value is number => {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 6;
};

const normalizeTimeHHmm = (value: unknown): string => {
  const raw = normalizeText(value);
  if (TIME_HHMM_RE.test(raw)) return raw;
  const match = /^(\d{1,2}):(\d{2})$/.exec(raw);
  if (!match) return '';
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
    return '';
  }
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

const clampDurationMinutes = (value: unknown, fallback = 35): number => {
  const parsed = Number(value);
  const safe = Number.isFinite(parsed) ? parsed : fallback;
  return Math.max(10, Math.min(180, Math.floor(safe)));
};

export const normalizeEnrollmentScheduleSlots = (
  scheduleLike: Record<string, unknown> | undefined,
  fallbackDuration = 35,
): EnrollmentWeeklySlot[] => {
  if (!scheduleLike) return [];
  const weeklySlotsRaw = Array.isArray(scheduleLike.weeklySlots) ? scheduleLike.weeklySlots : [];
  const parsedFromWeeklySlots = weeklySlotsRaw
    .map((slot) => {
      const source = (slot || {}) as Record<string, unknown>;
      const weekday = Number(source.weekday);
      const time = normalizeTimeHHmm(source.time);
      const durationMinutes = clampDurationMinutes(source.durationMinutes ?? source.durationMins, fallbackDuration);
      if (!isValidWeekday(weekday) || !time) return null;
      return { weekday, time, durationMinutes };
    })
    .filter((slot): slot is EnrollmentWeeklySlot => Boolean(slot));

  if (parsedFromWeeklySlots.length > 0) {
    return parsedFromWeeklySlots.sort((a, b) =>
      a.weekday === b.weekday ? a.time.localeCompare(b.time, undefined, { numeric: true }) : a.weekday - b.weekday,
    );
  }

  const weekdaysRaw = Array.isArray(scheduleLike.weekdays) ? scheduleLike.weekdays : [];
  const weekdays = weekdaysRaw.map((day) => Number(day)).filter((day): day is number => isValidWeekday(day));
  const legacyTime = normalizeTimeHHmm(scheduleLike.timeHHmm);
  if (!weekdays.length || !legacyTime) return [];
  const durationMinutes = clampDurationMinutes(scheduleLike.durationMins, fallbackDuration);
  return Array.from(new Set(weekdays))
    .sort((a, b) => a - b)
    .map((weekday) => ({ weekday, time: legacyTime, durationMinutes }));
};

const toDateMaybe = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'object' && value !== null) {
    const maybeTimestamp = value as { toDate?: () => Date };
    if (typeof maybeTimestamp.toDate === 'function') {
      const dateValue = maybeTimestamp.toDate();
      if (dateValue instanceof Date && !Number.isNaN(dateValue.getTime())) return dateValue;
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const dateValue = new Date(value);
    if (!Number.isNaN(dateValue.getTime())) return dateValue;
  }
  return null;
};

const parseYmdWeekday = (value: string): number | null => {
  if (!YMD_RE.test(value)) return null;
  const [yearRaw, monthRaw, dayRaw] = value.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
};

const resolveSessionWeekday = (sessionLike: Record<string, unknown>): number | null => {
  const ymd = normalizeText(sessionLike.date);
  const fromDateField = parseYmdWeekday(ymd);
  if (fromDateField !== null) return fromDateField;
  const startAt = toDateMaybe(sessionLike.startAt);
  if (!startAt) return null;
  const istShifted = new Date(startAt.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return istShifted.getUTCDay();
};

const resolveSessionTime = (sessionLike: Record<string, unknown>): string => {
  const fromStartTime = normalizeTimeHHmm(sessionLike.startTime);
  if (fromStartTime) return fromStartTime;
  const startAt = toDateMaybe(sessionLike.startAt);
  if (!startAt) return '';
  const istShifted = new Date(startAt.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  const hh = String(istShifted.getUTCHours()).padStart(2, '0');
  const mm = String(istShifted.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const resolveSessionDuration = (sessionLike: Record<string, unknown>): number | null => {
  const raw = Number(sessionLike.durationMinutes ?? sessionLike.durationMins);
  if (Number.isFinite(raw) && raw > 0) return clampDurationMinutes(raw, 35);
  const startTime = normalizeTimeHHmm(sessionLike.startTime);
  const endTime = normalizeTimeHHmm(sessionLike.endTime);
  if (!startTime || !endTime) return null;
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  let durationMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  if (durationMinutes <= 0) durationMinutes += 24 * 60;
  return clampDurationMinutes(durationMinutes, 35);
};

export const isScheduleExceptionSession = (sessionLike: Record<string, unknown>): boolean => {
  if (sessionLike.isAdHoc === true || sessionLike.isMakeup === true) return true;
  const adHocType = normalizeText(sessionLike.adHocType).toLowerCase();
  if (adHocType.includes('one_off') || adHocType.includes('adhoc') || adHocType.includes('ad_hoc')) {
    return true;
  }
  if (
    sessionLike.makeupCreditId ||
    sessionLike.makeupForSessionId ||
    sessionLike.rescheduledFromSessionId ||
    sessionLike.replacementSessionId
  ) {
    return true;
  }
  const exceptionSignals = [sessionLike.source, sessionLike.sessionType, sessionLike.createdByFlow]
    .map((value) => normalizeText(value).toLowerCase())
    .filter(Boolean);
  return exceptionSignals.some((signal) =>
    SCHEDULE_EXCEPTION_SOURCES.some((token) => signal.includes(token)),
  );
};

export const isManualSession = (sessionLike: Record<string, unknown>): boolean => {
  if (getManualSessionState(sessionLike)) return true;
  if (sessionLike.isAdHoc === true) return true;
  const adHocType = normalizeText(sessionLike.adHocType).toLowerCase();
  if (adHocType.includes('one_off') || adHocType.includes('adhoc') || adHocType.includes('ad_hoc')) return true;
  const source = normalizeText(sessionLike.source).toLowerCase();
  return LEGACY_MANUAL_SESSION_SOURCES.includes(source);
};

const hasCanonicalManualSessionIdentity = (sessionLike: Record<string, unknown>): boolean => {
  const hasKidIdentity = collectSessionKidIds(sessionLike).length > 0;
  const hasTeacherIdentity = collectSessionTeacherIds(sessionLike).length > 0;
  return Boolean(
    normalizeLookupId(sessionLike.enrollmentId) &&
      normalizeLookupId(sessionLike.courseId) &&
      hasKidIdentity &&
      hasTeacherIdentity,
  );
};

export const getManualSessionState = (
  sessionLike: Record<string, unknown>,
): ManualSessionState | null => {
  const raw = normalizeText(sessionLike.manualSessionState).toLowerCase();
  if (raw === 'canceled') return 'cancelled';
  if (raw === 'approved' || raw === 'cancelled' || raw === 'withdrawn' || raw === 'completed') {
    return raw;
  }
  return null;
};

export const isLegacyManualSession = (sessionLike: Record<string, unknown>): boolean => {
  if (getManualSessionState(sessionLike)) return false;
  const source = normalizeText(sessionLike.source).toLowerCase();
  if (!LEGACY_MANUAL_SESSION_SOURCES.includes(source)) return false;
  if (!hasCanonicalManualSessionIdentity(sessionLike)) return false;
  if (!sessionLike.createdAt || !normalizeLookupId(sessionLike.createdBy)) return false;
  const status = normalizeText(sessionLike.status).toLowerCase();
  return status !== 'cancelled' && status !== 'canceled' && status !== 'withdrawn' && status !== 'completed';
};

export const isOperationalManualSession = (sessionLike: Record<string, unknown>): boolean => {
  if (!isManualSession(sessionLike)) return false;
  if (!isSessionStatusOperationallyVisible(sessionLike.status)) return false;
  if (normalizeText(sessionLike.status).toLowerCase() === 'completed') return false;
  const state = getManualSessionState(sessionLike);
  if (state) return state === 'approved';
  // Transitional compatibility for legacy admin one-offs. New sessions must
  // carry an explicit manualSessionState and approval metadata.
  return isLegacyManualSession(sessionLike);
};

export const shouldAllowTeacherOwnedScheduleExceptionWithoutEnrollment = (
  sessionLike: Record<string, unknown>,
  teacherId: string,
): boolean => {
  const normalizedTeacherId = normalizeLookupId(teacherId);
  if (!normalizedTeacherId) return false;
  if (!isScheduleExceptionSession(sessionLike)) return false;
  if (!hasCanonicalManualSessionIdentity(sessionLike)) return false;
  if (isManualSession(sessionLike) && !isOperationalManualSession(sessionLike)) return false;
  const sessionTeacherIds = collectSessionTeacherIds(sessionLike);
  return sessionTeacherIds.includes(normalizedTeacherId);
};

const doesSessionMatchEnrollmentIdentity = (
  sessionLike: Record<string, unknown>,
  enrollmentLike: Record<string, unknown>,
): boolean => {
  const sessionEnrollmentId = normalizeLookupId(sessionLike.enrollmentId);
  const enrollmentId = normalizeLookupId(enrollmentLike.id);
  if (!sessionEnrollmentId) {
    return false;
  }
  if (enrollmentId && sessionEnrollmentId !== enrollmentId) return false;

  const enrollmentCourseId = normalizeLookupId(enrollmentLike.courseId);
  const sessionCourseId = normalizeLookupId(sessionLike.courseId);
  if (enrollmentCourseId && sessionCourseId && enrollmentCourseId !== sessionCourseId) {
    return false;
  }
  if (enrollmentCourseId && !sessionCourseId) {
    return false;
  }

  const enrollmentTeacherIds = collectEnrollmentTeacherIds(enrollmentLike);
  const sessionTeacherIds = collectSessionTeacherIds(sessionLike);
  if (
    enrollmentTeacherIds.length > 0 &&
    (sessionTeacherIds.length === 0 || !sessionTeacherIds.some((teacherId) => enrollmentTeacherIds.includes(teacherId)))
  ) {
    return false;
  }

  const enrollmentKidIds = collectEnrollmentKidIds(enrollmentLike);
  const sessionKidIds = collectSessionKidIds(sessionLike);
  if (!enrollmentKidIds.length || !sessionKidIds.length) return false;
  return sessionKidIds.every((kidId) => enrollmentKidIds.includes(kidId));
};

export const doesSessionMatchEnrollmentSchedule = (
  sessionLike: Record<string, unknown>,
  enrollmentLike: Record<string, unknown> | undefined,
): boolean => {
  if (!enrollmentLike) return false;
  if (!doesSessionMatchEnrollmentIdentity(sessionLike, enrollmentLike)) return false;
  if (isScheduleExceptionSession(sessionLike)) {
    return !isManualSession(sessionLike) || isOperationalManualSession(sessionLike);
  }

  const scheduleLike = (enrollmentLike.schedule || {}) as Record<string, unknown>;
  const slots = normalizeEnrollmentScheduleSlots(scheduleLike, 35);
  if (!slots.length) return false;

  const sessionWeekday = resolveSessionWeekday(sessionLike);
  const sessionTime = resolveSessionTime(sessionLike);
  if (sessionWeekday === null || !sessionTime) return false;

  const sessionDuration = resolveSessionDuration(sessionLike);
  return slots.some((slot) => {
    if (slot.weekday !== sessionWeekday) return false;
    if (slot.time !== sessionTime) return false;
    if (sessionDuration === null) return false;
    return slot.durationMinutes === sessionDuration;
  });
};

export const isSessionCanonicalForEnrollment = (
  sessionLike: Record<string, unknown>,
  enrollmentLike: Record<string, unknown> | undefined,
): boolean => {
  if (!enrollmentLike) return false;
  if (!isEnrollmentOperationallyActive(enrollmentLike)) return false;
  return doesSessionMatchEnrollmentSchedule(sessionLike, enrollmentLike);
};
