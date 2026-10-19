/**
 * Parent receipts ledger V3 — pure, read-only settlement projection.
 *
 * This module deliberately never reads or changes billingCharges.paidAmount,
 * wallet balances, existing payment allocations, or live Firestore data.
 * It is a foundation for the opt-in V3 migration, NOT a live migration tool.
 *
 * Values are reconciled in integer paise, avoiding floating-point drift.
 */
export type LedgerReceiptKind = 'regular' | 'advance';

export interface LedgerChargeInput {
  id: string;
  amount: number;
  serviceDate: string; // YYYY-MM-DD: authoritative charge service date
  monthKey: string; // YYYY-MM
  status?: string | null;
  archived?: boolean;
}

export interface LedgerReceiptInput {
  id: string;
  amount: number;
  receivedDate: string; // YYYY-MM-DD: actual money-received date
  kind?: LedgerReceiptKind;
}

export interface LedgerChargeResult {
  id: string;
  serviceDate: string;
  monthKey: string;
  amount: number;
  applied: number;
  due: number;
}

export interface LedgerMonthResult {
  monthKey: string;
  billed: number;
  applied: number;
  due: number;
  classes: number;
}

export interface ParentLedgerResult {
  totalBilled: number;
  totalReceived: number;
  totalApplied: number;
  availableAdvance: number;
  outstandingDue: number;
  netDue: number;
  charges: LedgerChargeResult[];
  months: LedgerMonthResult[];
}

const EXCLUDED_STATUSES = new Set(['void', 'cancelled', 'canceled', 'reversed', 'refunded']);
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function validDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function paise(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid ${label}`);
  const amount = Math.round(value * 100);
  if (!Number.isSafeInteger(amount) || Math.abs(value * 100 - amount) > 0.00001) {
    throw new Error(`Invalid precision for ${label}`);
  }
  return amount;
}

type InternalCharge = {
  id: string;
  serviceDate: string;
  monthKey: string;
  billed: number;
  applied: number;
};
type Event =
  | { type: 'charge'; date: string; id: string; charge: InternalCharge }
  | { type: 'receipt'; date: string; id: string; amount: number; kind: LedgerReceiptKind };

const rupees = (value: number) => value / 100;

/**
 * Replays charges and receipts in actual event-date order.
 * - Regular receipts settle the oldest eligible unpaid charges first.
 * - All excess becomes advance credit.
 * - Explicit advances do not retroactively pay older debts, but automatically
 *   settle eligible NEW charges created after the advance was received.
 * - Billing amounts are never derived from/imported from a CSV.
 *
 * Note: corrections/refunds, cross-parent transfers and ambiguous/missing dates
 * require their own reviewed business flows before production cutover.
 */
export function projectParentLedger(
  charges: LedgerChargeInput[],
  receipts: LedgerReceiptInput[],
  asOfDate?: string,
): ParentLedgerResult {
  if (asOfDate !== undefined && !validDate(asOfDate)) throw new Error('Invalid as-of date');
  const seenCharges = new Set<string>();
  const seenReceipts = new Set<string>();
  const events: Event[] = [];

  for (const row of charges) {
    if (!row.id || seenCharges.has(row.id)) throw new Error('Missing or duplicate charge ID');
    seenCharges.add(row.id);
    if (!validDate(row.serviceDate) || !MONTH_RE.test(row.monthKey) || row.monthKey !== row.serviceDate.slice(0, 7)) {
      throw new Error(`Invalid service date or month for charge ${row.id}`);
    }
    if (asOfDate && row.serviceDate > asOfDate) continue;
    if (row.archived || EXCLUDED_STATUSES.has(String(row.status || '').trim().toLowerCase())) continue;
    const amount = paise(row.amount, `charge ${row.id}`);
    if (!amount) continue;
    events.push({
      type: 'charge', date: row.serviceDate, id: row.id,
      charge: { id: row.id, serviceDate: row.serviceDate, monthKey: row.monthKey, billed: amount, applied: 0 },
    });
  }

  for (const row of receipts) {
    if (!row.id || seenReceipts.has(row.id)) throw new Error('Missing or duplicate receipt ID');
    seenReceipts.add(row.id);
    if (!validDate(row.receivedDate)) throw new Error(`Invalid receipt date for ${row.id}`);
    if (asOfDate && row.receivedDate > asOfDate) continue;
    const amount = paise(row.amount, `receipt ${row.id}`);
    if (!amount) throw new Error(`Zero-value receipt ${row.id}`);
    const kind = row.kind ?? 'regular';
    if (kind !== 'regular' && kind !== 'advance') throw new Error(`Invalid receipt kind for ${row.id}`);
    events.push({ type: 'receipt', date: row.receivedDate, id: row.id, amount, kind });
  }

  // Same-day charges become eligible before same-day regular receipts.
  events.sort((a, b) => a.date.localeCompare(b.date)
    || (a.type === b.type ? a.id.localeCompare(b.id) : a.type === 'charge' ? -1 : 1));

  const open: InternalCharge[] = [];
  let advancePaise = 0;
  let receivedPaise = 0;
  for (const event of events) {
    if (event.type === 'charge') {
      const charge = event.charge;
      const applied = Math.min(charge.billed, advancePaise);
      charge.applied += applied;
      advancePaise -= applied;
      open.push(charge);
      continue;
    }
    receivedPaise += event.amount;
    if (event.kind === 'advance') {
      advancePaise += event.amount;
      continue;
    }
    let remaining = event.amount;
    for (const charge of open) {
      const due = charge.billed - charge.applied;
      if (!due) continue;
      const applied = Math.min(remaining, due);
      charge.applied += applied;
      remaining -= applied;
      if (!remaining) break;
    }
    advancePaise += remaining;
  }

  const months = new Map<string, { billed: number; applied: number; classes: number }>();
  for (const charge of open) {
    const m = months.get(charge.monthKey) || { billed: 0, applied: 0, classes: 0 };
    m.billed += charge.billed;
    m.applied += charge.applied;
    m.classes += 1;
    months.set(charge.monthKey, m);
  }
  const totalBilledPaise = open.reduce((sum, charge) => sum + charge.billed, 0);
  const totalAppliedPaise = open.reduce((sum, charge) => sum + charge.applied, 0);
  const outstandingPaise = totalBilledPaise - totalAppliedPaise;
  if (receivedPaise !== totalAppliedPaise + advancePaise) {
    throw new Error('Receipt balance conservation failed');
  }

  return {
    totalBilled: rupees(totalBilledPaise),
    totalReceived: rupees(receivedPaise),
    totalApplied: rupees(totalAppliedPaise),
    availableAdvance: rupees(advancePaise),
    outstandingDue: rupees(outstandingPaise),
    netDue: rupees(outstandingPaise - advancePaise),
    charges: open.map((charge) => ({
      id: charge.id,
      serviceDate: charge.serviceDate,
      monthKey: charge.monthKey,
      amount: rupees(charge.billed),
      applied: rupees(charge.applied),
      due: rupees(charge.billed - charge.applied),
    })),
    months: [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([monthKey, m]) => ({
      monthKey,
      billed: rupees(m.billed),
      applied: rupees(m.applied),
      due: rupees(m.billed - m.applied),
      classes: m.classes,
    })),
  };
}
