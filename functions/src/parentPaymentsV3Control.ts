/**
 * Single cutover guard for both V3 account reads and receipt writes.
 * No automatic gate activation is ever performed by this module.
 */
export function resolveParentPaymentsV3Cutover(
  raw: unknown,
  requireReceiptWrites = false,
): string | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const control = raw as Record<string, unknown>;
  if (control.phase !== 'active'
    || control.migrationVerified !== true
    || control.billingPreservationVerified !== true
    || control.legacyPaymentWritersDisabled !== true
    || (requireReceiptWrites && control.receiptWritesEnabled !== true)
    || typeof control.cutoverRunId !== 'string'
    || !/^[A-Za-z0-9_-]{12,128}$/.test(control.cutoverRunId)) {
    return null;
  }
  return control.cutoverRunId;
}
