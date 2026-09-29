import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ensureAdmin } from '../helpers/adminGuard';
import { loadProductionStaffIdentityRegistry, type Av3StaffRegistrySnapshot } from './staffIdentityRegistry';
import {
  loadAvsBusinessGroupForSession, loadAvsGroupEvidence,
  persistAvsGroupCases, validateAvsBusinessGroup,
} from './groupValidation';

if (!admin.apps.length) admin.initializeApp();

export function exactAvsId(value: unknown, name: string): string {
  const id = typeof value === 'string' ? value.trim() : '';
  if (!id || id.length > 240 || id.includes('/') || [...id].some((char) => char.charCodeAt(0) < 32)) {
    throw new HttpsError('invalid-argument', `${name} is invalid.`);
  }
  return id;
}

export async function revalidateAvsGroupCached(db: FirebaseFirestore.Firestore, classSessionId: string, kidId: string,
  registryOverride?: Av3StaffRegistrySnapshot) {
  const rows = await loadAvsBusinessGroupForSession(db, classSessionId, kidId);
  const loaded = await loadAvsGroupEvidence(db, rows);
  const registry = registryOverride ?? await loadProductionStaffIdentityRegistry(db);
  let freshRequired = false;
  const result = await validateAvsBusinessGroup({
    rows, evidenceBySession: loaded.evidenceBySession, registry,
    runId: `cached_${Date.now().toString(36)}`,
    collectFresh: async () => {
      freshRequired = true;
      throw new Error('Fresh Teams evidence required; cached recheck never calls Graph.');
    },
    saveCases: async () => undefined,
  });
  if (freshRequired || result.unsafeCount || result.cases.length !== rows.length
    || result.cases.some((item) => item.businessOutcome === 'not_evaluable' || !item.businessOutcome)) {
    return { ok: false, status: 'fresh_teams_evidence_required' as const,
      classSessionIds: rows.map((row) => row.id), graphLogicalCalls: 0 };
  }
  await persistAvsGroupCases(db, rows, result.cases);
  const first = result.cases[0];
  return { ok: true, status: 'revalidated' as const,
    classSessionIds: rows.map((row) => row.id),
    businessOutcome: first.businessOutcome,
    teamsSupportedPresentCount: first.teamsSupportedPresentCount,
    tinyStepsPresentCount: first.tinyStepsPresentCount,
    graphLogicalCalls: 0 };
}

export const revalidateAttendanceValidationGroupCached = onCall({
  region: 'asia-south1', memory: '256MiB', invoker: 'public',
  labels: { 'avs-public-invoker': 'true' }, timeoutSeconds: 120, maxInstances: 2,
}, async (request) => {
  await ensureAdmin(request.auth);
  return revalidateAvsGroupCached(admin.firestore(),
    exactAvsId(request.data?.classSessionId, 'classSessionId'),
    exactAvsId(request.data?.kidId, 'kidId'));
});
