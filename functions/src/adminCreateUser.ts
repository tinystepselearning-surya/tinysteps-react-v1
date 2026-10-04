import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

import { ensureAdmin } from './helpers/adminGuard';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';

type UserStatus =
  | 'active'
  | 'suspended'
  | 'archived';

const DEFAULT_STATUS: UserStatus = 'active';

export { adminCreateUser } from './adminCreateUserCanonical';

export const backfillTeacherDocs = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 120,
    maxInstances: 5,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const db = admin.firestore();
    const ts =
      admin.firestore.FieldValue
        .serverTimestamp();

    const seen = new Set<string>();
    let scanned = 0;
    let created = 0;
    let skipped = 0;

    const roleSnap = await db
      .collection('users')
      .where('role', '==', 'teacher')
      .get();

    const rolesSnap = await db
      .collection('users')
      .where(
        'roles',
        'array-contains',
        'teacher',
      )
      .get();

    const allDocs = [
      ...roleSnap.docs,
      ...rolesSnap.docs,
    ];

    for (const doc of allDocs) {
      const uid = doc.id;
      if (seen.has(uid)) continue;
      seen.add(uid);
      scanned += 1;

      const data = doc.data() || {};
      const teacherRef =
        db.collection('teachers').doc(uid);
      const teacherSnap =
        await teacherRef.get();

      if (teacherSnap.exists) {
        skipped += 1;
        continue;
      }

      const displayName =
        (
          data.displayName ||
          data.name ||
          ''
        ).toString();

      const email =
        (data.email || '').toString();
      const phone = data.phone || null;
      const status: UserStatus =
        (data.status as UserStatus) ||
        DEFAULT_STATUS;

      await teacherRef.set(
        {
          userId: uid,
          displayName,
          email,
          phone,
          status,
          createdAt: ts,
          updatedAt: ts,
          createdBy:
            request.auth?.uid || null,
          updatedBy:
            request.auth?.uid || null,
        },
        { merge: true },
      );

      created += 1;
    }

    logger.info(
      'backfillTeacherDocs complete',
      {
        scanned,
        created,
        skipped,
      },
    );

    return {
      scanned,
      created,
      skipped,
    };
  },
);
