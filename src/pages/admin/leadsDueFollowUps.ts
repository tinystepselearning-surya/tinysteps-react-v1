import type { SimpleLeadBucket } from './leadsWorkflowBuckets';

/**
 * Presentation-only priority for the bounded enquiry range already loaded in
 * Leads & Enquiries. This is not a historical reconciliation or an SLA metric.
 *
 * Do not interpret a missing follow-up date as proof of no contact.
 * The staff must still verify the actual next action before contacting anyone.
 */
/** Convert a YYYY-MM-DD follow-up date to a consistent midday IST instant.
 * Browser-local Date constructors shift dates for admins outside India.
 * The exact midday clock is only a stable date marker, not an appointment time.
 */
export const parseAdminFollowUpDateIstMs = (value: unknown): number => {
  if (typeof value !== 'string') return 0;
  const date = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 0;
  const ms = Date.parse(`${date}T12:00:00.000+05:30`);
  if (!Number.isFinite(ms)) return 0;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(ms));
  const part = (type: string): string => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}` === date ? ms : 0;
};

export const isAdminFollowUpDue = (
  row: { bucket: SimpleLeadBucket; followUpAtMs: number },
  todayIstDateKey: string,
): boolean => {
  if (row.bucket !== 'admin_review') return false;
  if (!Number.isFinite(row.followUpAtMs) || row.followUpAtMs <= 0) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(todayIstDateKey)) return false;

  const endOfTodayMs = Date.parse(`${todayIstDateKey}T23:59:59.999+05:30`);
  return Number.isFinite(endOfTodayMs) && row.followUpAtMs <= endOfTodayMs;
};
