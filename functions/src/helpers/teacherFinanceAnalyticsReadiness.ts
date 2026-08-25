export type TeacherFinanceAnalyticsReadinessRow = Record<string, unknown>;

export type TeacherFinanceAnalyticsReadinessCheck = {
  relevant: boolean;
  safe: boolean;
  teacherId: string;
  monthKey: string;
  reasons: string[];
};

const normalizeText = (value: unknown): string => String(value || '').trim();
const normalizeStatus = (value: unknown): string => normalizeText(value).toLowerCase();
const MONTH_KEY_RE = /^\d{4}-\d{2}$/;

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return null;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? new Date(`${raw}T00:00:00+05:30`)
      : new Date(raw);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  if (typeof value === 'object' && value !== null) {
    const row = value as {
      toDate?: () => Date;
      seconds?: number;
      nanoseconds?: number;
      _seconds?: number;
      _nanoseconds?: number;
    };
    if (typeof row.toDate === 'function') {
      const date = row.toDate();
      return date instanceof Date && Number.isFinite(date.getTime()) ? date : null;
    }
    const seconds = Number(row.seconds ?? row._seconds);
    const nanoseconds = Number(row.nanoseconds ?? row._nanoseconds ?? 0);
    if (Number.isFinite(seconds)) {
      const date = new Date(seconds * 1000 + (Number.isFinite(nanoseconds) ? nanoseconds / 1_000_000 : 0));
      return Number.isFinite(date.getTime()) ? date : null;
    }
  }
  return null;
};

const monthKeyFromDateIST = (date: Date): string => {
  const ist = new Date(date.getTime() + 330 * 60 * 1000);
  return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}`;
};

const resolveMonthKey = (row: TeacherFinanceAnalyticsReadinessRow): string => {
  const direct = normalizeText(row.monthKey);
  if (MONTH_KEY_RE.test(direct)) return direct;

  const dateText = normalizeText(row.date);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return dateText.slice(0, 7);

  for (const candidate of [row.earnedAt, row.createdAt, row.updatedAt]) {
    const date = toDate(candidate);
    if (date) return monthKeyFromDateIST(date);
  }
  return '';
};

/**
 * B6 Brick 6B1 future-readiness guard for one teacherEarnings event image.
 *
 * Archived or void rows do not contribute to the active monthly analytics projection. Active rows
 * must be canonical session earnings or standalone demo earnings. The caller can invalidate a
 * previously prepared month if this check fails; no ledger repair is performed here.
 */
export function checkTeacherFinanceAnalyticsReadinessRow(
  earningId: string,
  row: TeacherFinanceAnalyticsReadinessRow | null | undefined,
): TeacherFinanceAnalyticsReadinessCheck {
  if (!row || row.archived === true || normalizeStatus(row.status) === 'void') {
    return {
      relevant: false,
      safe: true,
      teacherId: normalizeText(row?.teacherId),
      monthKey: row ? resolveMonthKey(row) : '',
      reasons: [],
    };
  }

  const teacherId = normalizeText(row.teacherId);
  const directMonthKey = normalizeText(row.monthKey);
  const monthKey = resolveMonthKey(row);
  const source = normalizeStatus(row.source);
  const sessionId = normalizeText(row.sessionId);
  const isDemo = source === 'demo_completed' || source === 'demo_enrolled_bonus';
  const isSessionSource = source === 'session_present_completed';
  const isSessionLinked = isSessionSource || Boolean(sessionId);
  const reasons: string[] = [];

  if (!teacherId) reasons.push('missing_teacher_id');
  if (!MONTH_KEY_RE.test(directMonthKey)) reasons.push('missing_or_invalid_month_key');

  if (isDemo && isSessionLinked) reasons.push('demo_session_classification_conflict');
  if (isSessionSource && !sessionId) reasons.push('session_source_missing_session_id');
  if (sessionId && normalizeText(earningId) !== sessionId) reasons.push('noncanonical_session_earning_id');
  if (!isDemo && !isSessionLinked) reasons.push('unclassified_earning_source');

  return {
    relevant: true,
    safe: reasons.length === 0,
    teacherId,
    monthKey,
    reasons,
  };
}
