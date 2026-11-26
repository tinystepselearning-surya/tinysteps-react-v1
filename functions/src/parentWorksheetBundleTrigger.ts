import * as admin from 'firebase-admin';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import {
  PARENT_WORKSHEET_BUNDLE_COLLECTION,
  PARENT_WORKSHEET_BUNDLE_ID,
  buildParentWorksheetBundle,
  decodeParentWorksheetBundle,
  updateParentWorksheetBundle,
} from './helpers/parentWorksheetBundle';

if (!admin.apps.length) admin.initializeApp();

/**
 * Covers privileged/legacy worksheet writers other than the admin UI.
 * Read the CURRENT source inside the transaction (rather than using the
 * potentially out-of-order event payload) to avoid replaying stale events.
 * The normal admin UI updates the bundle in the original worksheet transaction,
 * so this trigger should be a no-op for those already-synchronised writes.
 */
export const onParentWorksheetLibraryBundleSync = onDocumentWritten(
  { document: 'parentWorksheetLibrary/{worksheetId}', region: 'asia-south1' },
  async (event) => {
    if (!event.data) return;
    const worksheetId = String(event.params.worksheetId || '').trim();
    if (!worksheetId) return;
    const db = admin.firestore();
    const bundleRef = db.collection(PARENT_WORKSHEET_BUNDLE_COLLECTION).doc(PARENT_WORKSHEET_BUNDLE_ID);
    const sourceRef = db.collection('parentWorksheetLibrary').doc(worksheetId);
    await db.runTransaction(async (tx) => {
      const bundle = await tx.get(bundleRef);
      const entries = decodeParentWorksheetBundle(bundle.data() as Record<string, unknown> | undefined);
      if (!entries) return; // First parent request bootstraps; oversized bundles use source fallback.
      const current = await tx.get(sourceRef);
      const next = updateParentWorksheetBundle(entries, worksheetId, current.exists ? (current.data() || {}) : null);
      if (JSON.stringify(next) === JSON.stringify(entries)) return;
      tx.set(bundleRef, buildParentWorksheetBundle(next));
    });
  },
);
