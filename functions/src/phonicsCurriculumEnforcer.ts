import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import {
  CANONICAL_PHONICS_TOPICS,
  PHONICS_CURRICULUM_REVISION,
  canonicalizeCurriculumTopics,
  hasCanonicalPhonicsTopics,
} from './phonicsCurriculumConfig';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const CURRICULUM_DOC_PATH = 'config/curriculumTopics';

async function ensureCanonicalPhonicsCurriculum(options?: {
  actorUid?: string | null;
  source?: string;
}): Promise<{ updated: boolean; topicCount: number }> {
  const db = admin.firestore();
  const ref = db.doc(CURRICULUM_DOC_PATH);
  const snap = await ref.get();
  const current = snap.exists ? (snap.data() || {}) : {};
  const topics = Array.isArray(current.topics) ? current.topics : [];
  const revision = String(current.phonicsCurriculumRevision || '').trim();

  if (
    revision === PHONICS_CURRICULUM_REVISION
    && hasCanonicalPhonicsTopics(topics)
  ) {
    return { updated: false, topicCount: CANONICAL_PHONICS_TOPICS.length };
  }

  const canonicalTopics = canonicalizeCurriculumTopics(topics);
  await ref.set(
    {
      ...(!snap.exists || !current.createdAt
        ? { createdAt: FieldValue.serverTimestamp() }
        : {}),
      topics: canonicalTopics,
      phonicsCurriculumRevision: PHONICS_CURRICULUM_REVISION,
      phonicsCurriculumTopicCount: CANONICAL_PHONICS_TOPICS.length,
      phonicsCurriculumEnforcedAt: FieldValue.serverTimestamp(),
      phonicsCurriculumEnforcedBy: options?.actorUid || 'system',
      phonicsCurriculumEnforcementSource: options?.source || 'server',
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  logger.info('Canonical phonics curriculum enforced', {
    revision: PHONICS_CURRICULUM_REVISION,
    topicCount: CANONICAL_PHONICS_TOPICS.length,
    source: options?.source || 'server',
    actorUid: options?.actorUid || null,
  });

  return { updated: true, topicCount: CANONICAL_PHONICS_TOPICS.length };
}

async function assertAdmin(uid: string, tokenRole?: unknown): Promise<void> {
  const userSnap = await admin.firestore().collection('users').doc(uid).get();
  const userData = userSnap.exists ? userSnap.data() || {} : {};
  const databaseRole = String(userData.role || '').trim().toLowerCase();
  const tokenRoleNormalized = String(tokenRole || '').trim().toLowerCase();
  const databaseStatus = String(userData.status || '').trim().toLowerCase();
  const isActive = userData.active !== false && databaseStatus !== 'inactive';
  const effectiveRole = userSnap.exists ? databaseRole : tokenRoleNormalized;

  if (!isActive || effectiveRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }
}

/**
 * Admin/manual seed. Student Management calls this on mount so an already-stale
 * config document is repaired immediately after this release is deployed.
 */
export const adminSyncCanonicalPhonicsCurriculum = onCall(
  { region: REGION },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');
    await assertAdmin(uid, request.auth?.token?.role);

    return ensureCanonicalPhonicsCurriculum({
      actorUid: uid,
      source: 'admin_callable',
    });
  },
);

/**
 * Guardrail for legacy/admin config writers. Any write that reintroduces an old
 * 30/41/20 phonics payload is immediately canonicalized to the approved
 * 31/40/30 (101-topic) curriculum. The second trigger invocation is a no-op.
 */
export const onCurriculumTopicsCanonicalize = onDocumentWritten(
  { document: CURRICULUM_DOC_PATH, region: REGION },
  async (event) => {
    const after = event.data?.after;
    if (!after?.exists) return;

    const data = after.data() || {};
    const revision = String(data.phonicsCurriculumRevision || '').trim();
    if (
      revision === PHONICS_CURRICULUM_REVISION
      && hasCanonicalPhonicsTopics(data.topics)
    ) {
      return;
    }

    await ensureCanonicalPhonicsCurriculum({ source: 'firestore_guard' });
  },
);
