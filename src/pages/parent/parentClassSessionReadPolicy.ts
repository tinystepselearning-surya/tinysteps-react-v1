export const PARENT_UPCOMING_CLASS_DAYS = 14;

export type ParentClassSessionReadMode = "operational" | "history" | "calendar";

type ParentClassSessionReadPolicyInput = {
  activeTab: string;
  classesView: string;
  now?: Date;
  calendarMonth?: Date;
};

export type ParentClassSessionDateBounds = {
  startKey: string;
  endKey: string;
};

const PARENT_LEGACY_SESSION_PROBE_VERSION = "v2";
const PARENT_LEGACY_SESSION_PROBE_PREFIX =
  `ts-parent-class-legacy-probe:${PARENT_LEGACY_SESSION_PROBE_VERSION}:`;

const pad2 = (value: number): string => String(value).padStart(2, "0");

const toYmd = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const isHistoryView = (classesView: string): boolean =>
  classesView === "completed"
  || classesView === "past_pending"
  || classesView === "rescheduled";

const claimParentLegacySessionProbe = (): boolean => {
  if (typeof window === "undefined") return false;

  const kidId = new URLSearchParams(window.location.search).get("kidId")?.trim() || "";
  if (!kidId) return false;

  try {
    const storageKey = `${PARENT_LEGACY_SESSION_PROBE_PREFIX}${kidId}`;
    if (window.sessionStorage.getItem(storageKey) === "1") return false;
    window.sessionStorage.setItem(storageKey, "1");
    return true;
  } catch {
    // Storage can be blocked in hardened/private browser modes. In that case we
    // keep the canonical bounded read and avoid accidentally turning every load
    // into an unbounded compatibility scan.
    return false;
  }
};

export const resolveParentClassSessionReadMode = ({
  activeTab,
  classesView,
}: Pick<ParentClassSessionReadPolicyInput, "activeTab" | "classesView">): ParentClassSessionReadMode => {
  if (activeTab === "classes" && isHistoryView(classesView)) return "history";
  if (activeTab === "classes" && classesView === "calendar") return "calendar";
  return "operational";
};

export const resolveParentClassSessionDateBounds = ({
  activeTab,
  classesView,
  now = new Date(),
  calendarMonth = now,
}: ParentClassSessionReadPolicyInput): ParentClassSessionDateBounds | null => {
  const mode = resolveParentClassSessionReadMode({ activeTab, classesView });
  if (mode === "history") return null;

  if (mode === "calendar") {
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const lastDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    return {
      startKey: toYmd(firstDay),
      endKey: toYmd(lastDay),
    };
  }

  // Keep the current month available for attendance/billing fallback calculations,
  // while bounding the operational future horizon to what parents actually need.
  const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const upcomingEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  upcomingEnd.setDate(upcomingEnd.getDate() + PARENT_UPCOMING_CLASS_DAYS);

  return {
    startKey: toYmd(firstDayOfCurrentMonth),
    endKey: toYmd(upcomingEnd),
  };
};

export const shouldRunParentLegacySessionFallback = (canonicalResultCount: number): boolean => {
  if (!Number.isFinite(canonicalResultCount) || canonicalResultCount <= 0) return true;

  // Existing parents can have a mixed month: canonical dated completed sessions
  // plus older/future sessions that only carry startAt/legacy ownership. A
  // non-empty bounded result therefore does not prove migration completeness.
  // Probe the legacy ownership path once per selected child per browser session.
  // The ParentDashboard query still filters the compatibility result back to the
  // current operational bounds, and subsequent loads stay on the bounded path.
  return claimParentLegacySessionProbe();
};
