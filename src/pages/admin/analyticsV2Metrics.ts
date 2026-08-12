export const ANALYTICS_TIME_ZONE = 'Asia/Kolkata';

export const analyticsMonthKeyFromDate = (date: Date): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ANALYTICS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value || '';
  const month = parts.find((part) => part.type === 'month')?.value || '';
  return year && month ? `${year}-${month}` : '';
};

const normalize = (value: unknown): string => String(value || '').trim().toLowerCase();

const isSessionCharge = (entry: any): boolean =>
  normalize(entry?.source) === 'session_present_completed' || Boolean(String(entry?.sessionId || '').trim());

export const summarizeSessionCharges = (charges: any[]): {
  sessionChargesTotal: number;
  sessionChargesCount: number;
} => {
  const sessions = new Map<string, number>();
  charges.forEach((charge, index) => {
    if (normalize(charge?.status) === 'void' || !isSessionCharge(charge)) return;
    const amount = Number(charge?.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const sessionId = String(charge?.sessionId || '').trim();
    const identity = sessionId || `charge:${String(charge?.id || index)}`;
    // Canonical billing is one charge per session. Defensively choose the largest
    // duplicate rather than inflating completed-session counts or revenue.
    sessions.set(identity, Math.max(sessions.get(identity) || 0, amount));
  });
  return {
    sessionChargesTotal: Array.from(sessions.values()).reduce((sum, amount) => sum + amount, 0),
    sessionChargesCount: sessions.size,
  };
};

export type TeacherEarningsRow = {
  teacherId: string;
  demoCount: number;
  demoEarned: number;
  sessionCount: number;
  sessionEarned: number;
  totalEarned: number;
  pending: number;
};

const isDemoEarning = (entry: any): boolean => {
  const source = normalize(entry?.source);
  return source === 'demo_completed' || source === 'demo_enrolled_bonus';
};

const isSessionEarning = (entry: any): boolean =>
  normalize(entry?.source) === 'session_present_completed' || Boolean(String(entry?.sessionId || '').trim());

export const aggregateTeacherEarnings = (entries: any[]): TeacherEarningsRow[] => {
  const byTeacher = new Map<string, TeacherEarningsRow>();
  entries.forEach((entry) => {
    const teacherId = String(entry?.teacherId || '').trim();
    if (!teacherId || normalize(entry?.status) === 'void') return;
    const amountRaw = Number(entry?.amount);
    const amount = Number.isFinite(amountRaw) && amountRaw > 0 ? amountRaw : 0;
    const paidRaw = Number(entry?.paidAmount);
    const paid = Number.isFinite(paidRaw) && paidRaw > 0
      ? Math.min(paidRaw, amount)
      : ['paid', 'settled'].includes(normalize(entry?.status)) ? amount : 0;
    const row = byTeacher.get(teacherId) || {
      teacherId,
      demoCount: 0,
      demoEarned: 0,
      sessionCount: 0,
      sessionEarned: 0,
      totalEarned: 0,
      pending: 0,
    };
    row.totalEarned += amount;
    row.pending += Math.max(amount - paid, 0);
    if (isDemoEarning(entry)) {
      row.demoCount += 1;
      row.demoEarned += amount;
    } else if (isSessionEarning(entry)) {
      row.sessionCount += 1;
      row.sessionEarned += amount;
    }
    byTeacher.set(teacherId, row);
  });
  return Array.from(byTeacher.values()).sort(
    (a, b) => b.pending - a.pending || b.totalEarned - a.totalEarned || a.teacherId.localeCompare(b.teacherId),
  );
};

export const summarizeTeacherEarnings = (rows: TeacherEarningsRow[]) => {
  const totals = rows.reduce(
    (sum, row) => ({
      totalDemoEarned: sum.totalDemoEarned + row.demoEarned,
      totalSessionEarned: sum.totalSessionEarned + row.sessionEarned,
      totalDemoCount: sum.totalDemoCount + row.demoCount,
      totalSessionCount: sum.totalSessionCount + row.sessionCount,
    }),
    { totalDemoEarned: 0, totalSessionEarned: 0, totalDemoCount: 0, totalSessionCount: 0 },
  );
  return { ...totals, totalCombinedEarned: totals.totalDemoEarned + totals.totalSessionEarned };
};
