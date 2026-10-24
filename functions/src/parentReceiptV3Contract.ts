/**
 * Validation and immutable data contract for V3 parent receipts.
 * Has no Firestore, Firebase Functions, or runtime IO dependencies.
 */
export type ParentReceiptKindV3 = 'regular' | 'advance';

export interface ParentReceiptV3Input {
  parentId: string;
  idempotencyKey: string;
  amount: number;
  receivedDate: string;
  kind?: ParentReceiptKindV3;
  method?: string | null;
  reference?: string | null;
  note?: string | null;
}

export interface ValidatedParentReceiptV3 {
  parentId: string;
  idempotencyKey: string;
  amountPaise: number;
  amount: number;
  receivedDate: string;
  receiptMonthKey: string;
  kind: ParentReceiptKindV3;
  method: string | null;
  reference: string | null;
  note: string | null;
}

const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/;
const ID_PATTERN = /^[A-Za-z0-9_-]{6,128}$/;
const KEY_PATTERN = /^[A-Za-z0-9_-]{12,128}$/;
const MAX_RECEIPT_PAISE = 1_000_000_000; // ₹1 crore: raise only with reviewed policy

function isDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const candidate = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(candidate.getTime())
    && candidate.toISOString().slice(0, 10) === value;
}

function normalizedOptional(value: unknown, maxLength: number, field: string): string | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') throw new Error(field + ' must be text');
  const trimmed = value.trim();
  if (trimmed.length > maxLength) throw new Error(field + ' is too long');
  return trimmed || null;
}

export function validateParentReceiptV3(
  input: unknown,
  asOfDate?: string,
): ValidatedParentReceiptV3 {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Receipt must be an object');
  }
  const value = input as Record<string, unknown>;
  const parentId = typeof value.parentId === 'string' ? value.parentId.trim() : '';
  if (!ID_PATTERN.test(parentId)) throw new Error('Invalid Firestore parent ID');
  const idempotencyKey = typeof value.idempotencyKey === 'string' ? value.idempotencyKey.trim() : '';
  if (!KEY_PATTERN.test(idempotencyKey)) throw new Error('Invalid receipt idempotency key');
  if (typeof value.amount !== 'number' || !Number.isFinite(value.amount) || value.amount <= 0) {
    throw new Error('Receipt amount must be a positive number');
  }
  const amountPaise = Math.round(value.amount * 100);
  if (!Number.isSafeInteger(amountPaise) || amountPaise > MAX_RECEIPT_PAISE
      || Math.abs(amountPaise - value.amount * 100) > 0.00001) {
    throw new Error('Receipt amount must be within policy and have at most two decimal places');
  }
  const receivedDate = typeof value.receivedDate === 'string' ? value.receivedDate : '';
  if (!isDate(receivedDate)) throw new Error('Invalid receipt date');
  if (asOfDate != null) {
    if (!isDate(asOfDate)) throw new Error('Invalid current date');
    if (receivedDate > asOfDate) throw new Error('Receipt cannot be dated in the future');
  }
  const kind = value.kind === undefined ? 'regular' : value.kind;
  if (kind !== 'regular' && kind !== 'advance') throw new Error('Invalid receipt category');

  return {
    parentId,
    idempotencyKey,
    amountPaise,
    amount: amountPaise / 100,
    receivedDate,
    receiptMonthKey: receivedDate.slice(0, 7),
    kind,
    method: normalizedOptional(value.method, 60, 'Payment source'),
    reference: normalizedOptional(value.reference, 150, 'Payment reference'),
    note: normalizedOptional(value.note, 500, 'Payment note'),
  };
}

/**
 * Idempotent replay must be EXACTLY equivalent, not merely a duplicate ID.
 * No archived receipt can be reused for a new payment.
 */
export function parentReceiptV3MatchesExisting(
  expected: ValidatedParentReceiptV3,
  actual: Record<string, unknown>,
): boolean {
  return actual.parentId === expected.parentId
    && actual.idempotencyKey === expected.idempotencyKey
    && actual.amountPaise === expected.amountPaise
    && actual.receivedDate === expected.receivedDate
    && actual.receiptMonthKey === expected.receiptMonthKey
    && actual.kind === expected.kind
    && (actual.method ?? null) === expected.method
    && (actual.reference ?? null) === expected.reference
    && (actual.note ?? null) === expected.note
    && actual.status === 'recorded'
    && actual.schemaVersion === 3;
}
