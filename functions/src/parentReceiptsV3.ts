import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { ensureCanonicalAdmin } from './helpers/canonicalAdminGuard';
import {
  validateParentReceiptV3,
  parentReceiptV3MatchesExisting,
} from './parentReceiptV3Contract';

if (!admin.apps.length) admin.initializeApp();

/**
 * V3 receipts are an independent event journal. No billing charge, legacy
 * payments, wallet, allocations, or read model is changed by this callable.
 *
 * CLOSED BY DEFAULT. A separate finance-migration procedure must reconcile
 * historical receipts and set parentPaymentsV3Config/control before recording
 * any production receipts. This function intentionally never sets that gate.
 */
export const adminRecordParentReceiptV3 = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, maxInstances: 3 },
  async (request) => {
    await ensureCanonicalAdmin(request.auth);
    const todayInIndia = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    const datePart = (type: 'year' | 'month' | 'day') =>
      todayInIndia.find((part) => part.type === type)?.value || '';
    const today = [datePart('year'), datePart('month'), datePart('day')].join('-');

    let receipt;
    try {
      receipt = validateParentReceiptV3(request.data, today);
    } catch (error) {
      throw new HttpsError(
        'invalid-argument',
        error instanceof Error ? error.message : 'Invalid receipt',
      );
    }

    const db = admin.firestore();
    const controlRef = db.collection('parentPaymentsV3Config').doc('control');
    const parentRef = db.collection('users').doc(receipt.parentId);
    const receiptRef = db.collection('parentReceiptsV3')
      .doc(receipt.parentId).collection('receipts').doc(receipt.idempotencyKey);
    const actor = String(request.auth?.uid || '').trim();

    return db.runTransaction(async (tx) => {
      const [controlSnap, parentSnap, existingSnap] = await Promise.all([
        tx.get(controlRef),
        tx.get(parentRef),
        tx.get(receiptRef),
      ]);
      const control = (controlSnap.data() || {}) as Record<string, unknown>;

      // A deliberate, separately approved switch. No code in this PR enables it.
      if (control.phase !== 'active'
        || control.receiptWritesEnabled !== true
        || control.migrationVerified !== true
        || control.billingPreservationVerified !== true
        || control.legacyPaymentWritersDisabled !== true
        || typeof control.cutoverRunId !== 'string'
        || !control.cutoverRunId.trim()) {
        throw new HttpsError(
          'failed-precondition',
          'Parent Payments V3 is not activated after migration verification.',
        );
      }

      const parent = (parentSnap.data() || {}) as Record<string, unknown>;
      const roles = Array.isArray(parent.roles) ? parent.roles : [];
      const isParent = String(parent.role || '').trim().toLowerCase() === 'parent'
        || roles.some((role) => String(role).trim().toLowerCase() === 'parent');
      if (!parentSnap.exists || !isParent) {
        throw new HttpsError('failed-precondition', 'Parent account could not be verified.');
      }
      if (existingSnap.exists) {
        const existing = (existingSnap.data() || {}) as Record<string, unknown>;
        if (!parentReceiptV3MatchesExisting(receipt, existing)) {
          throw new HttpsError('already-exists', 'Receipt key already belongs to a different transaction.');
        }
        return {
          ok: true,
          idempotentReplay: true,
          receiptId: receiptRef.id,
          parentId: receipt.parentId,
        };
      }

      tx.create(receiptRef, {
        ...receipt,
        schemaVersion: 3,
        status: 'recorded',
        currency: 'INR',
        sourceSystem: 'parent_receipts_v3_admin',
        cutoverRunId: control.cutoverRunId.trim(),
        createdBy: actor,
        createdAt: FieldValue.serverTimestamp(),
      });

      return {
        ok: true,
        idempotentReplay: false,
        receiptId: receiptRef.id,
        parentId: receipt.parentId,
      };
    }).catch((error: unknown) => {
      if (error instanceof HttpsError) throw error;
      logger.error('adminRecordParentReceiptV3 failed', {
        parentId: receipt.parentId, // no parent names, phone or amounts in logs
        errorName: error instanceof Error ? error.name : 'unknown',
      });
      throw new HttpsError('internal', 'Unable to record the receipt. Check its transaction status before retrying.');
    });
  },
);
