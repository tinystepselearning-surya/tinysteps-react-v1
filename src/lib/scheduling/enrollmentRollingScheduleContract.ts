import {
  ROLLING_SCHEDULE_TIME_ZONE,
  type RollingScheduleConfigInput,
  type RollingScheduleSlotInput,
  normalizeRollingScheduleSlots,
} from './rollingScheduleRecurrence';

export const ROLLING_SCHEDULE_CONTRACT_VERSION = 1;
export const ROLLING_SCHEDULE_MATERIALIZATION_VERSION = 1;
export const ROLLING_SCHEDULE_HORIZON_DAYS = 14;
export const ROLLING_SCHEDULE_DELIVERY_MODE = 'rolling' as const;

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

const ACTIVE_STATUS_ALIASES = new Set([
  '',
  'active',
  'trial',
  'enrolled',
  'current',
  'ongoing',
  'pending_teacher',
  'pending_payment',
  'pending_lp',
]);

const TERMINAL_STATUS_ALIASES = new Set([
  'completed',
  'discontinued',
  'expired',
  'cancelled',
  'canceled',
  'archived',
  'inactive',
]);

export type RollingScheduleLifecycleState = 'active' | 'paused' | 'terminal' | 'inactive';
export type RollingScheduleContractSource = 'canonical_rolling' | 'legacy_compatible' | 'unconfigured';

export type CanonicalRollingEnrollmentSchedule = {
  schemaVersion: typeof ROLLING_SCHEDULE_CONTRACT_VERSION;
  deliveryMode: typeof ROLLING_SCHEDULE_DELIVERY_MODE;
  timezone: typeof ROLLING_SCHEDULE_TIME_ZONE;
  revision: number;
  weeklySlots: Array<{
    weekday: number;
    time: string;
    durationMinutes: number;
  }>;
};

export type RollingScheduleMaterializationState = {
  schemaVersion: typeof ROLLING_SCHEDULE_MATERIALIZATION_VERSION;
  horizonDays: typeof ROLLING_SCHEDULE_HORIZON_DAYS;
  scheduleRevision: number;
  materializedThroughYmd: string | null;
  nextOccurrenceYmd: string | null;
  nextMaterializationDueYmd: string | null;
};

export type EnrollmentRollingScheduleContract = {
  source: RollingScheduleContractSource;
  lifecycleState: RollingScheduleLifecycleState;
  canMaterializeAutomatically: boolean;
  classesStartDateYmd: string | null;
  schedule: CanonicalRollingEnrollmentSchedule | null;
  materialization: RollingScheduleMaterializationState;
  legacyFiniteFieldsPresent: {
    weeksAhead: boolean;
    plannedSessions: boolean;
    endDateYmd: boolean;
  };
};

type RecordLike = Record<string, unknown>;

type ScheduleLike = RollingScheduleConfigInput & {
  schemaVersion?: unknown;
  deliveryMode?: unknown;
  revision?: unknown;
  weeksAhead?: unknown;
  plannedSessions?: unknown;
  endDateYmd?: unknown;
};

const isRecordLike = (value: unknown): value is RecordLike => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const normalizeStatus = (value: unknown): string => text(value).toLowerCase();

const isValidYmd = (value: unknown): value is string => {
  const raw = text(value);
  if (!YMD_RE.test(raw)) return false;
  const [yearText, monthText, dayText] = raw.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day
  );
};

const ymdInIndia = (date: Date): string | null => {
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ROLLING_SCHEDULE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return year && month && day ? `${year}-${month}-${day}` : null;
};

const dateLikeToYmd = (value: unknown): string | null => {
  if (!value) return null;
  if (isValidYmd(value)) return text(value);

  if (value instanceof Date) return ymdInIndia(value);

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return ymdInIndia(parsed);
  }

  if (!isRecordLike(value)) return null;

  const toDate = value.toDate;
  if (typeof toDate === 'function') {
    try {
      const parsed = (toDate as () => Date)();
      if (parsed instanceof Date) return ymdInIndia(parsed);
    } catch {
      return null;
    }
  }

  const seconds = Number(value.seconds ?? value._seconds);
  if (Number.isFinite(seconds)) {
    return ymdInIndia(new Date(seconds * 1000));
  }

  return null;
};

const positiveRevision = (value: unknown, fallback = 1): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
};

const normalizeMaterializationYmd = (value: unknown): string | null => (
  isValidYmd(value) ? text(value) : null
);

export const resolveRollingScheduleLifecycleState = (
  enrollmentLike: RecordLike | null | undefined,
): RollingScheduleLifecycleState => {
  if (!enrollmentLike) return 'inactive';
  if (enrollmentLike.archivedAt || enrollmentLike.archived === true || enrollmentLike.isArchived === true) {
    return 'terminal';
  }

  const status = normalizeStatus(enrollmentLike.status);
  if (status === 'paused') return 'paused';
  if (TERMINAL_STATUS_ALIASES.has(status)) return 'terminal';
  if (ACTIVE_STATUS_ALIASES.has(status)) return 'active';
  return 'inactive';
};

export const resolveEnrollmentClassesStartDateYmd = (
  enrollmentLike: RecordLike | null | undefined,
): string | null => {
  if (!enrollmentLike) return null;
  return (
    dateLikeToYmd(enrollmentLike.classesStartDateYmd)
    || dateLikeToYmd(enrollmentLike.classesStartDate)
    || dateLikeToYmd(enrollmentLike.startDateYmd)
    || dateLikeToYmd(enrollmentLike.startDate)
    || null
  );
};

const toScheduleLike = (value: unknown): ScheduleLike | null => {
  if (!isRecordLike(value)) return null;
  return value as ScheduleLike;
};

export const buildCanonicalRollingEnrollmentSchedule = (
  scheduleLike: unknown,
): CanonicalRollingEnrollmentSchedule | null => {
  const schedule = toScheduleLike(scheduleLike);
  if (!schedule) return null;

  const slots = normalizeRollingScheduleSlots(schedule);
  if (!slots.length) return null;

  const timezone = text(schedule.timezone) || ROLLING_SCHEDULE_TIME_ZONE;
  if (timezone !== ROLLING_SCHEDULE_TIME_ZONE) {
    throw new Error(`Unsupported rolling schedule timezone: ${timezone}`);
  }

  return {
    schemaVersion: ROLLING_SCHEDULE_CONTRACT_VERSION,
    deliveryMode: ROLLING_SCHEDULE_DELIVERY_MODE,
    timezone: ROLLING_SCHEDULE_TIME_ZONE,
    revision: positiveRevision(schedule.revision),
    weeklySlots: slots.map((slot) => ({
      weekday: slot.weekday,
      time: slot.time,
      durationMinutes: slot.durationMinutes,
    })),
  };
};

export const buildInitialRollingScheduleMaterializationState = (
  scheduleRevision = 1,
): RollingScheduleMaterializationState => ({
  schemaVersion: ROLLING_SCHEDULE_MATERIALIZATION_VERSION,
  horizonDays: ROLLING_SCHEDULE_HORIZON_DAYS,
  scheduleRevision: positiveRevision(scheduleRevision),
  materializedThroughYmd: null,
  nextOccurrenceYmd: null,
  nextMaterializationDueYmd: null,
});

export const normalizeRollingScheduleMaterializationState = (
  value: unknown,
  scheduleRevision = 1,
): RollingScheduleMaterializationState => {
  const raw = isRecordLike(value) ? value : {};
  return {
    schemaVersion: ROLLING_SCHEDULE_MATERIALIZATION_VERSION,
    // The operational horizon is intentionally code-owned. A stale persisted 21/30-day
    // value must never widen future session creation.
    horizonDays: ROLLING_SCHEDULE_HORIZON_DAYS,
    scheduleRevision: positiveRevision(raw.scheduleRevision, positiveRevision(scheduleRevision)),
    materializedThroughYmd: normalizeMaterializationYmd(raw.materializedThroughYmd),
    nextOccurrenceYmd: normalizeMaterializationYmd(raw.nextOccurrenceYmd),
    nextMaterializationDueYmd: normalizeMaterializationYmd(raw.nextMaterializationDueYmd),
  };
};

export const resolveEnrollmentRollingScheduleContract = (
  enrollmentLike: RecordLike | null | undefined,
): EnrollmentRollingScheduleContract => {
  const enrollment = enrollmentLike || {};
  const scheduleLike = toScheduleLike(enrollment.schedule);
  const schedule = buildCanonicalRollingEnrollmentSchedule(scheduleLike);
  const lifecycleState = resolveRollingScheduleLifecycleState(enrollment);

  const explicitDeliveryMode = scheduleLike ? text(scheduleLike.deliveryMode).toLowerCase() : '';
  const explicitSchemaVersion = scheduleLike ? Number(scheduleLike.schemaVersion) : Number.NaN;
  const source: RollingScheduleContractSource = !schedule
    ? 'unconfigured'
    : explicitDeliveryMode === ROLLING_SCHEDULE_DELIVERY_MODE
      && explicitSchemaVersion === ROLLING_SCHEDULE_CONTRACT_VERSION
      ? 'canonical_rolling'
      : 'legacy_compatible';

  return {
    source,
    lifecycleState,
    canMaterializeAutomatically: lifecycleState === 'active' && Boolean(schedule),
    classesStartDateYmd: resolveEnrollmentClassesStartDateYmd(enrollment),
    schedule,
    materialization: normalizeRollingScheduleMaterializationState(
      enrollment.scheduleMaterialization,
      schedule?.revision || 1,
    ),
    legacyFiniteFieldsPresent: {
      weeksAhead: Boolean(scheduleLike && scheduleLike.weeksAhead !== undefined && scheduleLike.weeksAhead !== null),
      plannedSessions: Boolean(scheduleLike && scheduleLike.plannedSessions !== undefined && scheduleLike.plannedSessions !== null),
      endDateYmd: Boolean(scheduleLike && text(scheduleLike.endDateYmd)),
    },
  };
};

export const toRollingScheduleConfigInput = (
  schedule: CanonicalRollingEnrollmentSchedule,
): RollingScheduleConfigInput => ({
  timezone: schedule.timezone,
  weeklySlots: schedule.weeklySlots.map<RollingScheduleSlotInput>((slot) => ({
    weekday: slot.weekday,
    time: slot.time,
    durationMinutes: slot.durationMinutes,
  })),
});
