import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { ensureCanonicalAdmin } from './helpers/canonicalAdminGuard';
import { resolveParentPaymentsV3Cutover } from './parentPaymentsV3Control';
import { resolveCanonicalServiceDate } from './helpers/serviceDate';
import {
  projectParentLedger,
  type LedgerChargeInput,
  type LedgerReceiptInput,
} from './parentLedgerProjectionV3';

if (!admin.apps.length) admin.initializeApp();

const MAX_CHARGES_PER_PARENT = 500;
const MAX_RECEIPTS_PER_PARENT = 500;
const MAX_SESSION_LOOKUP_CHUNK = 50;
const ID_PATTERN = /^[A-Za-z0-9_-]{6,128}$/;

/**
 * Read-only parent V3 account snapshot. Never trust legacy paidAmount,
 * outstandingAmount, status=paid, wallet balances or old payment collections.
 *
 * The hard bound is intentionally fail-closed. Later pagination must provide
 * a completeness proof before rendering financial conclusions.
 */
export const adminGetParentLedgerV3 = onCall(
  { region: 'asia-south1', memory: '512MiB', timeoutSeconds: 60, maxInstances: 3 },
  async (request) => {
    await ensureCanonicalAdmin(request.auth);
    const data = (request.data || {}) as Record<string, unknown>;
    const parentId = typeof data.parentId === 'string' ? data.parentId.trim() : '';
    if (!ID_PATTERN.test(parentId)) {
      throw new HttpsError('invalid-argument', 'Invalid parent ID.');
    }
    const asOfDate = typeof data.asOfDate === 'string' ? data.asOfDate : undefined;
    if (asOfDate && !/^\d{4}-\d{2}-\d{2}$/.test(asOfDate)) {
      throw new HttpsError('invalid-argument', 'Invalid date.');
    }

    const db = admin.firestore();
    const controlSnap = await db.collection('parentPaymentsV3Config').doc('control').get();
    const control = (controlSnap.data() || {}) as Record<string, unknown>;
    const cutoverRunId = resolveParentPaymentsV3Cutover(control);
    if (!cutoverRunId) {
      throw new HttpsError('failed-precondition', 'V3 account statements are unavailable before verified cutover.');
    }

    const parentSnap = await db.collection('users').doc(parentId).get();
    if (!parentSnap.exists) {
      throw new HttpsError('not-found', 'Parent not found.');
    }
    const parent = (parentSnap.data() || {}) as Record<string, unknown>;
    const isParent = String(parent.role || '').trim().toLowerCase() === 'parent'
      || (Array.isArray(parent.roles) && parent.roles.some(
        (role) => String(role).trim().toLowerCase() === 'parent',
      ));
    if (!isParent) {
      throw new HttpsError('failed-precondition', 'Account is not a parent.');
    }

    const [chargeSnap, receiptSnap] = await Promise.all([
      db.collection('billingCharges').where('parentId', '==', parentId)
        .limit(MAX_CHARGES_PER_PARENT + 1).get(),
      db.collection('parentReceiptsV3').doc(parentId).collection('receipts')
        .limit(MAX_RECEIPTS_PER_PARENT + 1).get(),
    ]);
    if (chargeSnap.size > MAX_CHARGES_PER_PARENT || receiptSnap.size > MAX_RECEIPTS_PER_PARENT) {
      throw new HttpsError('resource-exhausted', 'Account history exceeds the verified read limit. Paginated reconciliation required.');
    }

    const chargeRows = chargeSnap.docs.map((item) => ({
      id: item.id, ...(item.data() as Record<string, unknown>),
    }));
    const sessionIds = [...new Set(chargeRows.map((row) =>
      String(row.sessionId || row.classSessionId || '').trim()).filter(Boolean))];
    const sessionsById = new Map<string, Record<string, unknown>>();
    for (let offset = 0; offset < sessionIds.length; offset += MAX_SESSION_LOOKUP_CHUNK) {
      const refs = sessionIds.slice(offset, offset + MAX_SESSION_LOOKUP_CHUNK).map(
        (id) => db.collection('classSessions').doc(id),
      );
      const results = await db.getAll(...refs);
      results.forEach((snap) => {
        if (snap.exists) sessionsById.set(snap.id, (snap.data() || {}) as Record<string, unknown>);
      });
    }

    const excludedStatuses = new Set(['void', 'cancelled', 'canceled', 'reversed', 'refunded']);
    const charges: LedgerChargeInput[] = chargeRows
      .filter((row) => row.archived !== true
        && !excludedStatuses.has(String(row.status || '').trim().toLowerCase()))
      .map((row) => {
        const sessionId = String(row.sessionId || row.classSessionId || '').trim();
        const resolved = resolveCanonicalServiceDate(sessionsById.get(sessionId) || null, row);
        if (!resolved.serviceDate || typeof row.monthKey !== 'string') {
          throw new HttpsError('failed-precondition', 'Unresolved billing service date or billing month. Finance audit required.');
        }
        return {
          id: row.id,
          serviceDate: resolved.serviceDate,
          monthKey: row.monthKey,
          amount: typeof row.amount === 'number' ? row.amount : Number.NaN,
          status: typeof row.status === 'string' ? row.status : null,
        };
      });

    const receipts: LedgerReceiptInput[] = receiptSnap.docs.map((item) => {
      const row = item.data() as Record<string, unknown>;
      if (row.schemaVersion !== 3 || row.status !== 'recorded'
        || row.parentId !== parentId
        || row.cutoverRunId !== control.cutoverRunId
        || row.idempotencyKey !== item.id
        || !Number.isSafeInteger(row.amountPaise)
        || Number(row.amountPaise) <= 0) {
        throw new HttpsError('failed-precondition', 'Receipt integrity review required.');
      }
      if (row.kind !== 'regular' && row.kind !== 'advance') {
        throw new HttpsError('failed-precondition', 'Unknown receipt category.');
      }
      return {
        id: item.id,
        amount: Number(row.amountPaise) / 100,
        receivedDate: String(row.receivedDate || ''),
        kind: row.kind,
      };
    });

    try {
      const projection = projectParentLedger(charges, receipts, asOfDate);
      return {
        schemaVersion: 3,
        parentId,
        cutoverRunId,
        asOfDate: asOfDate || null,
        generatedAt: new Date().toISOString(),
        complete: true,
        source: 'firestore_billing_charges_and_v3_receipts',
        chargeCount: chargeSnap.size,
        receiptCount: receiptSnap.size,
        ...projection,
      };
    } catch (error) {
      logger.warn('adminGetParentLedgerV3 integrity error', {
        parentId,
        errorType: error instanceof Error ? error.name : 'unknown',
      });
      throw new HttpsError('failed-precondition', 'Parent finance statement requires integrity review.');
    }
  },
);
