import type { SimpleLeadBucket } from './leadsWorkflowBuckets';

/**
 * Presentation-only priority for the bounded enquiry range already loaded in
 * Leads & Enquiries. This is not a historical reconciliation or an SLA metric.
 *
 * Do not interpret a missing follow-up date as proof of no contact.
 * The staff must still verify the actual next action before contacting anyone.
 */
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
