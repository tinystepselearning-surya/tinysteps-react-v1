import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import Papa from 'papaparse';

if (!admin.apps.length) admin.initializeApp();

interface MappingColumns {
  kidId?: string;
  kidEmail?: string;
  parentId?: string;
  parentEmail?: string;
  teacherId?: string;
  teacherEmail?: string;
  sessionId?: string;
}

interface AdminProcessEnrollmentCSVRequest {
  csv: string;
  mapping: MappingColumns;
  validateOnly?: boolean;
}

interface RowResult {
  rowIndex: number;
  success: boolean;
  message?: string;
}

function parseCSV(csv: string): { data: string[][]; errors: any[] } {
  const parsed = Papa.parse(csv, { skipEmptyLines: true });
  const rows = parsed.data as string[][];
  return {
    data: rows.map((r) => r.map((c) => String(c).trim())),
    errors: parsed.errors,
  };
}

async function resolveUidByEmailOrId(value?: string): Promise<string | null> {
  if (!value) return null;
  const v = value.trim();
  // If it looks like a UID (28 chars alphanumeric), treat it as UID
  if (/^[a-zA-Z0-9]{28}$/.test(v)) return v;
  try {
    const user = await admin.auth().getUserByEmail(v);
    return user.uid;
  } catch (err) {
    logger.warn(`Could not resolve email ${v} to uid`, { err: String(err) });
    return null;
  }
}

export const adminProcessEnrollmentCSV = onCall(
  { region: 'asia-south1', memory: '512MiB', timeoutSeconds: 540 },
  // v2 style: single `request` argument
  async (request) => {
    try {
      const { data, auth } = request;

      // ---------- 1) Admin check ----------
      if (!auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in');
      }

      const callerUid = auth.uid;
      const tokenIsAdmin =
        auth.token?.admin === true || auth.token?.role === 'admin';

      let firestoreIsAdmin = false;
      if (!tokenIsAdmin) {
        try {
          const doc = await admin.firestore().collection('users').doc(callerUid).get();
          const d = doc.data();
          if (d?.role === 'admin' || (Array.isArray(d?.roles) && d?.roles.includes('admin'))) {
            firestoreIsAdmin = true;
          }
        } catch (e) {
          logger.warn('adminProcessEnrollmentCSV: could not verify admin role via Firestore', {
            callerUid,
            error: String(e),
          });
        }
      }

      if (!tokenIsAdmin && !firestoreIsAdmin) {
        throw new HttpsError('permission-denied', 'Admin access required');
      }

      // ---------- 2) Validate input ----------
      const req = data as AdminProcessEnrollmentCSVRequest;
      if (!req || !req.csv || !req.mapping) {
        throw new HttpsError('invalid-argument', 'csv and mapping are required');
      }

      const parsed = parseCSV(req.csv);
      const rows = parsed.data || [];
      const parseErrors = parsed.errors || [];

      if (rows.length < 1) {
        throw new HttpsError('invalid-argument', 'CSV has no rows');
      }

      const headerRow = rows[0];

      const getCell = (row: string[], colName?: string) => {
        if (!colName) return '';
        const idx = headerRow.indexOf(colName);
        return idx >= 0 ? row[idx] : '';
      };

      const payloadRows = rows.slice(1);
      const results: RowResult[] = [];

      const db = admin.firestore();

      // ---------- 3) VALIDATE-ONLY MODE ----------
      if (req.validateOnly) {
        for (let i = 0; i < payloadRows.length; i++) {
          const r = payloadRows[i];
          try {
            const kidIdRaw = getCell(r, req.mapping.kidId);
            const parentIdRaw = getCell(r, req.mapping.parentId);
            const teacherIdRaw = getCell(r, req.mapping.teacherId);
            const sessionIdRaw = getCell(r, req.mapping.sessionId);

            const kidUid =
              (await resolveUidByEmailOrId(kidIdRaw)) ||
              (req.mapping.kidEmail
                ? await resolveUidByEmailOrId(getCell(r, req.mapping.kidEmail))
                : null);

            const parentUid =
              (await resolveUidByEmailOrId(parentIdRaw)) ||
              (req.mapping.parentEmail
                ? await resolveUidByEmailOrId(getCell(r, req.mapping.parentEmail))
                : null);

            const teacherUid =
              (await resolveUidByEmailOrId(teacherIdRaw)) ||
              (req.mapping.teacherEmail
                ? await resolveUidByEmailOrId(getCell(r, req.mapping.teacherEmail))
                : null);

            const sessionId = sessionIdRaw || '';

            const errors: string[] = [];
            if (!kidUid) errors.push('Could not resolve kidId or kidEmail');
            if (!parentUid && (req.mapping.parentId || req.mapping.parentEmail)) {
              errors.push('Could not resolve parentId or parentEmail');
            }
            if (!teacherUid && (req.mapping.teacherId || req.mapping.teacherEmail)) {
              errors.push('Could not resolve teacherId or teacherEmail');
            }
            if (!sessionId) errors.push('Missing sessionId');

            if (errors.length) {
              results.push({
                rowIndex: i + 1,
                success: false,
                message: errors.join('; '),
              });
            } else {
              results.push({ rowIndex: i + 1, success: true, message: 'OK' });
            }
          } catch (err: any) {
            results.push({
              rowIndex: i + 1,
              success: false,
              message: String(err?.message || err),
            });
          }
        }

        return { validated: true, rowCount: payloadRows.length, results, parseErrors };
      }

      // ---------- 4) FULL PROCESSING MODE ----------
      const BATCH_SIZE = 400;
      const batchResults: RowResult[] = [];
      let batch = db.batch();
      let writeCount = 0;

      const flushBatch = async () => {
        if (writeCount === 0) return;
        await batch.commit();
        batch = db.batch();
        writeCount = 0;
      };

      // Create a bulk upload job doc for audit/tracking
      const jobRef = db.collection('bulkUploadJobs').doc();
      const jobId = jobRef.id;

      await jobRef.set({
        createdBy: callerUid || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'processing',
        rowCount: payloadRows.length,
        mapping: req.mapping || {},
        parseErrors: parseErrors || [],
      });

      for (let i = 0; i < payloadRows.length; i++) {
        const r = payloadRows[i];

        try {
          const kidIdRaw = getCell(r, req.mapping.kidId);
          const parentIdRaw = getCell(r, req.mapping.parentId);
          const teacherIdRaw = getCell(r, req.mapping.teacherId);
          const sessionIdRaw = getCell(r, req.mapping.sessionId);

          const kidUid =
            (await resolveUidByEmailOrId(kidIdRaw)) ||
            (req.mapping.kidEmail
              ? await resolveUidByEmailOrId(getCell(r, req.mapping.kidEmail))
              : null);

          const parentUid =
            (await resolveUidByEmailOrId(parentIdRaw)) ||
            (req.mapping.parentEmail
              ? await resolveUidByEmailOrId(getCell(r, req.mapping.parentEmail))
              : null);

          const teacherUid =
            (await resolveUidByEmailOrId(teacherIdRaw)) ||
            (req.mapping.teacherEmail
              ? await resolveUidByEmailOrId(getCell(r, req.mapping.teacherEmail))
              : null);

          const sessionId = sessionIdRaw || '';

          const errors: string[] = [];
          if (!kidUid) errors.push('Could not resolve kidId or kidEmail');
          if (!parentUid && (req.mapping.parentId || req.mapping.parentEmail)) {
            errors.push('Could not resolve parentId or parentEmail');
          }
          if (!teacherUid && (req.mapping.teacherId || req.mapping.teacherEmail)) {
            errors.push('Could not resolve teacherId or teacherEmail');
          }
          if (!sessionId) errors.push('Missing sessionId');

          if (errors.length) {
            batchResults.push({
              rowIndex: i + 1,
              success: false,
              message: errors.join('; '),
            });
            continue;
          }

          if (!kidUid) {
            batchResults.push({
              rowIndex: i + 1,
              success: false,
              message: 'Kid UID missing',
            });
            continue;
          }

          // Validate session existence
          if (sessionId) {
            const sDoc = await db.collection('sessions').doc(sessionId).get();
            if (!sDoc.exists) {
              batchResults.push({
                rowIndex: i + 1,
                success: false,
                message: 'Session not found',
              });
              continue;
            }
          }

          // Enrollments collection
          const enrollmentId = `${sessionId}_${kidUid}`;
          const enrollmentRef = db.collection('enrollments').doc(enrollmentId);

          batch.set(
            enrollmentRef,
            {
              sessionId,
              kidId: kidUid,      // legacy naming
              studentId: kidUid,  // new naming
              teacherId: teacherUid,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          writeCount++;

          // Update STUDENT doc (was /kids before)
          const studentRef = db.collection('students').doc(kidUid as string);
          const studentUpdates: any = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          if (parentUid) {
            studentUpdates.parentIds = admin.firestore.FieldValue.arrayUnion(parentUid);
            studentUpdates.primaryParentId = parentUid;
          }

          if (teacherUid) {
            studentUpdates.teacherIds = admin.firestore.FieldValue.arrayUnion(teacherUid);
            // Optionally set a single assignedTeacherId for your rules:
            studentUpdates.assignedTeacherId = teacherUid;
          }

          if (sessionId) {
            studentUpdates.sessionId = sessionId;
          }

          batch.update(studentRef, studentUpdates);
          writeCount++;

          // Optionally update session doc
          const sessionRef = db.collection('sessions').doc(sessionId);
          batch.set(
            sessionRef,
            {
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              // No-op for now, but keeps the field in place
              studentCount: admin.firestore.FieldValue.increment(0),
            },
            { merge: true }
          );
          writeCount++;

          batchResults.push({
            rowIndex: i + 1,
            success: true,
            message: 'Processed',
          });

          if (writeCount >= BATCH_SIZE) {
            await flushBatch();
          }
        } catch (err: any) {
          batchResults.push({
            rowIndex: i + 1,
            success: false,
            message: String(err?.message || err),
          });
        }
      }

      await flushBatch();

      // Update bulk upload job doc
      await jobRef.update({
        status: 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        results: batchResults,
      });

      return {
        processed: true,
        rowCount: payloadRows.length,
        results: batchResults,
        jobId,
      };
    } catch (error: any) {
      logger.error('adminProcessEnrollmentCSV failed', { error: String(error) });
      const httpError = error as HttpsError;
      if (httpError && (httpError as any).code) throw httpError;
      throw new HttpsError('internal', 'Failed to process CSV');
    }
  }
);

// Optional default export (fine to keep or remove)
export default adminProcessEnrollmentCSV;
