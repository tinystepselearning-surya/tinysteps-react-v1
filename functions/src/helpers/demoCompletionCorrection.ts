export const DEMO_CORRECTION_EARNING_SOURCES = new Set([
  'demo_completed',
  'demo_enrolled_bonus',
]);

const normalize = (value: unknown): string => String(value || '').trim().toLowerCase();

export function isDemoCorrectionEarningSource(value: unknown): boolean {
  return DEMO_CORRECTION_EARNING_SOURCES.has(normalize(value));
}

export function resolveDemoCorrectionPaidAmount(
  earning: Record<string, unknown>,
  amount: number,
): number {
  const paidRaw = Number(earning.paidAmount);
  if (Number.isFinite(paidRaw) && paidRaw > 0) {
    return Math.min(Math.max(paidRaw, 0), Math.max(amount, 0));
  }
  const status = normalize(earning.status);
  if (status === 'paid' || status === 'settled') return Math.max(amount, 0);
  return 0;
}

export function buildDemoCorrectionCycleKey(demoId: string, completedAtMs: number): string {
  const safeDemoId = String(demoId || '').trim().replace(/[^A-Za-z0-9_-]/g, '_');
  const safeCompletedAtMs = Number.isFinite(completedAtMs) && completedAtMs > 0
    ? Math.round(completedAtMs)
    : 0;
  return `${safeDemoId}_${safeCompletedAtMs}`;
}
