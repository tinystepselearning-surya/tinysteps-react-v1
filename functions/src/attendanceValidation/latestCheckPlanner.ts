import type { Av53ShadowWorkItem } from './shadowRunner';

export const AVS_LATEST_CHECK_MAX_DIRTY_SESSIONS = 100;
export const AVS_LATEST_CHECK_MAX_RANGE_DAYS = 31;
export const AVS_LATEST_CHECK_START_YMD = '2026-09-01';

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface AvsLatestDirtySessionInput {
  sessionId: string;
  serviceDateYmd: string;
}

export interface AvsLatestExistingCaseInput {
  sessionId: string;
  caseExists: boolean;
  evidenceId: string | null;
}

export interface AvsLatestCheckPlan {
  workItems: Av53ShadowWorkItem[];
  baselineRequiredSessionIds: string[];
}

function parseYmd(value: unknown, field: string): string {
  const normalized = String(value ?? '').trim();
  if (!YMD_RE.test(normalized)) {
    throw new TypeError(`${field} must be YYYY-MM-DD.`);
  }
  const parsed = Date.parse(`${normalized}T00:00:00.000Z`);
  if (
    !Number.isFinite(parsed)
    || new Date(parsed).toISOString().slice(0, 10) !== normalized
  ) {
    throw new TypeError(`${field} must be a real calendar date.`);
  }
  return normalized;
}

export function normalizeAvsLatestCheckRange(
  fromDate: unknown,
  toDate: unknown,
): { fromDate: string; toDate: string } {
  const from = parseYmd(fromDate, 'fromDate');
  const to = parseYmd(toDate, 'toDate');

  if (from < AVS_LATEST_CHECK_START_YMD) {
    throw new RangeError(
      `fromDate cannot be before ${AVS_LATEST_CHECK_START_YMD}.`,
    );
  }
  if (to < from) {
    throw new RangeError('toDate cannot be before fromDate.');
  }

  const inclusiveDays =
    Math.round(
      (Date.parse(`${to}T00:00:00.000Z`)
        - Date.parse(`${from}T00:00:00.000Z`))
      / 86_400_000,
    ) + 1;

  if (inclusiveDays > AVS_LATEST_CHECK_MAX_RANGE_DAYS) {
    throw new RangeError(
      `Latest Check supports at most ${AVS_LATEST_CHECK_MAX_RANGE_DAYS} calendar days per run.`,
    );
  }

  return { fromDate: from, toDate: to };
}

function cleanId(value: unknown): string | null {
  const normalized = String(value ?? '').trim();
  return normalized && !normalized.includes('/') ? normalized : null;
}

export function planAvsLatestCheck(
  dirtySessions: readonly AvsLatestDirtySessionInput[],
  existingCases: readonly AvsLatestExistingCaseInput[],
): AvsLatestCheckPlan {
  const caseBySession = new Map(
    existingCases.map((item) => [item.sessionId, item]),
  );
  const workItems: Av53ShadowWorkItem[] = [];
  const baselineRequiredSessionIds: string[] = [];

  for (const dirty of dirtySessions) {
    const sessionId = cleanId(dirty.sessionId);
    if (!sessionId) continue;

    const existingCase = caseBySession.get(sessionId);
    const evidenceId = cleanId(existingCase?.evidenceId);
    if (!existingCase?.caseExists || !evidenceId) {
      baselineRequiredSessionIds.push(sessionId);
      continue;
    }

    workItems.push({ classSessionId: sessionId, evidenceId });
  }

  return {
    workItems,
    baselineRequiredSessionIds,
  };
}
