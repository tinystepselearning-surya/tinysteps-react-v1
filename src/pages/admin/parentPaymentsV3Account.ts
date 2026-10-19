/**
 * Admin V3 account contract returned by the gated Cloud Function.
 * Amounts are in INR, sourced from existing Firestore billing charges and
 * versioned V3 receipts only. No legacy settlement totals are included.
 */
export type ParentLedgerMonthV3 = {
  monthKey: string;
  classes: number;
  billed: number;
  applied: number;
  due: number;
};

export type ParentLedgerClassV3 = {
  id: string;
  serviceDate: string;
  monthKey: string;
  studentName: string;
  courseName: string;
  attendance: 'Present' | 'Absent' | 'Not verified';
  amount: number;
  applied: number;
  due: number;
};

export type ParentLedgerReceiptV3 = {
  id: string;
  amount: number;
  receivedDate: string;
  kind: 'regular' | 'advance';
  method: string | null;
  reference: string | null;
};

export type ParentLedgerAccountV3 = {
  schemaVersion: 3;
  complete: true;
  parentId: string;
  parentName: string;
  cutoverRunId: string;
  source: 'firestore_billing_charges_and_v3_receipts';
  generatedAt: string;
  asOfDate: string | null;
  chargeCount: number;
  receiptCount: number;
  totalBilled: number;
  totalReceived: number;
  totalApplied: number;
  availableAdvance: number;
  outstandingDue: number;
  netDue: number;
  months: ParentLedgerMonthV3[];
  classDetails: ParentLedgerClassV3[];
  billingWarnings: Array<{ chargeId: string; code: 'BILLED_ABSENT'; message: string }>;
  receiptDetails: ParentLedgerReceiptV3[];
};

export function assertParentLedgerAccountV3(
  raw: unknown,
  expectedParentId: string,
): asserts raw is ParentLedgerAccountV3 {
  const data = raw as Partial<ParentLedgerAccountV3> | null;
  if (!data || data.schemaVersion !== 3 || data.complete !== true
    || data.parentId !== expectedParentId
    || data.source !== 'firestore_billing_charges_and_v3_receipts'
    || !data.cutoverRunId
    || !Array.isArray(data.months)
    || !Array.isArray(data.classDetails)
    || !Array.isArray(data.billingWarnings)
    || !Array.isArray(data.receiptDetails)) {
    throw new Error('Account ledger was incomplete or mismatched; no financial totals can be displayed.');
  }
  const amounts = [
    data.totalBilled, data.totalReceived, data.totalApplied,
    data.availableAdvance, data.outstandingDue, data.netDue,
  ];
  if (amounts.some((value) => typeof value !== 'number' || !Number.isFinite(value))) {
    throw new Error('Account ledger contains invalid financial amounts.');
  }
  const close = (a: number, b: number) => Math.abs(Math.round(a * 100) - Math.round(b * 100)) <= 1;
  if (!close(data.totalReceived!, data.totalApplied! + data.availableAdvance!)
    || !close(data.totalBilled!, data.totalApplied! + data.outstandingDue!)
    || !close(data.netDue!, data.outstandingDue! - data.availableAdvance!)) {
    throw new Error('Ledger is not balanced; financial display has been blocked.');
  }
}
