import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import {
  normalizeWebsiteLeadChildName,
  normalizeWebsiteLeadPhone,
} from './websiteLeadDeduplication';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const REPAIR_VERSION = 1;
const PAGE_SIZE = 400;
const MIGRATION_DOC_ID = 'leadDemoPreparationRepairV1';
const TERMINAL_LEAD_STATUSES = new Set([
  'admitted_confirmed',
  'not_interested',
  'wrong_fit',
  'no_response',
  'lost',
]);
const TERMINAL_CONVERSION_STATUSES = new Set([
  'enrolled',
  'not_interested',
  'wrong_fit',
  'no_response',
]);

const cleanText = (value: unknown, maxLength = 500): string =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const hasIdentity = (lead: Record<string, unknown>): boolean => {
  const phone = normalizeWebsiteLeadPhone(
    lead.primaryPhone || lead.whatsappNumber || lead.phoneNormalized,
  );
  const child = normalizeWebsiteLeadChildName(lead.childName);
  return phone.length >= 7 && child.length >= 2;
};

const hasExistingDemoLifecycle = (lead: Record<string, unknown>): boolean => {
  if (cleanText(lead.demoSessionId, 120)) return true;
  if (Array.isArray(lead.demoIds) && lead.demoIds.some((id) => cleanText(id, 120))) return true;
  return Boolean(
    lead.demoCreatedAt ||
    lead.demoAssignedAt ||
    lead.demoCompletedAt ||
    lead.demoCancelledAt,
  );
};

export const shouldRepairPreparingDemoLead = (
  leadId: string,
  lead: Record<string, unknown>,
): boolean => {
  if (!leadId || leadId.startsWith('demo_')) return false;
  if (lead.archived === true) return false;

  const status = cleanText(lead.status, 80).toLowerCase();
  const conversion = cleanText(lead.conversionStatus, 80).toLowerCase();
  if (TERMINAL_LEAD_STATUSES.has(status) || TERMINAL_CONVERSION_STATUSES.has(conversion)) {
    return false;
  }

  // Do not create a second demo for a record that already contains any demo lifecycle
  // evidence. Existing orphan/reconciliation logic is responsible for those records.
  if (hasExistingDemoLifecycle(lead)) return false;
  if (!hasIdentity(lead)) return false;

  // A known website dedupe conflict requires manual resolution. Legacy website leads that
  // merely predate the canonical fields are intentionally repairable: touching them causes
  // onWebsiteLeadIdentityWrite to establish/merge canonical identity first, after which
  // onLeadEnsureDemoRequest creates exactly one deterministic demo request.
  if (
    cleanText(lead.source, 80).toLowerCase() === 'website' &&
    cleanText(lead.dedupeConflict, 160)
  ) {
    return false;
  }

  return true;
};

/**
 * One-time self-healing migration for leads that existed before the automatic
 * lead -> demo workflow was deployed.
 *
 * PR #44 added onDocumentWritten handlers, so historical leads never received an
 * event and remained in the UI as "Preparing demo request". This migration pages
 * through existing leads and performs a harmless repair-marker write only for
 * genuinely unlinked, non-terminal leads. The existing dedupe + demo triggers then
 * perform the canonical work. A persisted cursor makes the job restart-safe and the
 * completed flag turns subsequent scheduled invocations into a single-document read.
 */
export const repairLegacyPreparingDemoRequests = onSchedule(
  {
    schedule: 'every 15 minutes',
    timeZone: 'Asia/Kolkata',
    region: REGION,
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async () => {
    const db = admin.firestore();
    const stateRef = db.collection('systemMigrations').doc(MIGRATION_DOC_ID);
    const stateSnap = await stateRef.get();
    const state = stateSnap.exists ? (stateSnap.data() || {}) : {};

    if (state.completed === true) return;

    const lastProcessedLeadId = cleanText(state.lastProcessedLeadId, 160);
    let leadsQuery: FirebaseFirestore.Query = db
      .collection('leads')
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(PAGE_SIZE);
    if (lastProcessedLeadId) leadsQuery = leadsQuery.startAfter(lastProcessedLeadId);

    const snapshot = await leadsQuery.get();
    if (snapshot.empty) {
      await stateRef.set(
        {
          version: REPAIR_VERSION,
          completed: true,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      logger.info('[lead-demo-repair] migration complete: no remaining lead documents');
      return;
    }

    const batch = db.batch();
    let repairRequests = 0;
    let skippedExistingLifecycle = 0;
    let skippedInvalidOrTerminal = 0;

    for (const docSnap of snapshot.docs) {
      const lead = docSnap.data() || {};
      if (shouldRepairPreparingDemoLead(docSnap.id, lead)) {
        batch.set(
          docSnap.ref,
          {
            demoRepairVersion: REPAIR_VERSION,
            demoRepairRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
            demoRepairRequestedBy: 'system:lead-demo-preparation-backfill',
          },
          { merge: true },
        );
        repairRequests += 1;
      } else if (hasExistingDemoLifecycle(lead)) {
        skippedExistingLifecycle += 1;
      } else {
        skippedInvalidOrTerminal += 1;
      }
    }

    const lastDocumentId = snapshot.docs[snapshot.docs.length - 1].id;
    const completed = snapshot.size < PAGE_SIZE;
    batch.set(
      stateRef,
      {
        version: REPAIR_VERSION,
        completed,
        lastProcessedLeadId: lastDocumentId,
        lastBatchScanned: snapshot.size,
        lastBatchRepairRequests: repairRequests,
        lastBatchSkippedExistingLifecycle: skippedExistingLifecycle,
        lastBatchSkippedInvalidOrTerminal: skippedInvalidOrTerminal,
        totalScanned: admin.firestore.FieldValue.increment(snapshot.size),
        totalRepairRequests: admin.firestore.FieldValue.increment(repairRequests),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(completed
          ? { completedAt: admin.firestore.FieldValue.serverTimestamp() }
          : {}),
      },
      { merge: true },
    );

    await batch.commit();

    logger.info('[lead-demo-repair] migration page processed', {
      scanned: snapshot.size,
      repairRequests,
      skippedExistingLifecycle,
      skippedInvalidOrTerminal,
      lastDocumentId,
      completed,
    });
  },
);
