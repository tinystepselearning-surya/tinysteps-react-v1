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

const pad2 = (value: number): string => String(value).padStart(2, "0");

const toYmd = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const isHistoryView = (classesView: string): boolean =>
  classesView === "completed"
  || classesView === "past_pending"
  || classesView === "rescheduled";

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

  // Current-month totals come from parentMonthlyReadModels, not an
  // automatic scan of old classSessions when a parent opens the calendar.
  // Operational exceptions are needed only for today and the next 14 days.
  // Service dates use IST, not the parent's device time zone.
  const todayYmd=new Date(now.getTime()+330*60_000).toISOString().slice(0,10);
  const upcomingEnd=new Date(Date.parse(todayYmd+'T00:00:00.000Z')+
    PARENT_UPCOMING_CLASS_DAYS*86_400_000).toISOString().slice(0,10);
  return {
    startKey: todayYmd,
    endKey: upcomingEnd,
  };
};

export const shouldRunParentLegacySessionFallback = (canonicalResultCount: number): boolean =>
  !Number.isFinite(canonicalResultCount) || canonicalResultCount <= 0;
