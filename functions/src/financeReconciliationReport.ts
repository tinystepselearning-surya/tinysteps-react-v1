import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { ensureAdmin } from './helpers/adminGuard';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const IST_OFFSET_MINUTES = 330;

function normalizeStatus(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const d = new Date(`${trimmed}T00:00:00+05:30`);
      return Number.isFinite(d.getTime()) ? d : null;
    }
    const parsed = new Date(trimmed);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }
  if (typeof value === 'object' && value !== null) {
    const maybeTs = value as { toDate?: () => Date };
    if (typeof maybeTs.toDate === 'function') {
      const parsed = maybeTs.toDate();
      return parsed instanceof Date && Number.isFinite(parsed.getTime()) ? parsed : null;
    }
  }
  return null;
}

function monthKeyFromDateIST(date: Date): string {
  const istMs = date.getTime() + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istMs);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function normalizeMonthKey(value: unknown): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}$/.test(raw)) {
    throw new HttpsError('invalid-argument', 'monthKey must be YYYY-MM');
  }
  return raw;
}

function toInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function resolveMonthKey(data: Record<string, unknown>): string | null {
  const monthKey = String(data.monthKey || '').trim();
  if (/^\d{4}-\d{2}$/.test(monthKey)) return monthKey;

  const dateText = String(data.date || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return dateText.slice(0, 7);

  const timestampCandidate =
    toDate(data.startAt) ||
    toDate(data.paidAt) ||
    toDate(data.earnedAt) ||
    toDate(data.createdAt) ||
    toDate(data.updatedAt);

  if (!timestampCandidate) return null;
  return monthKeyFromDateIST(timestampCandidate);
}

function inMonthScope(data: Record<string, unknown>, monthKey: string | null): boolean {
  if (!monthKey) return true;
  return resolveMonthKey(data) === monthKey;
}

async function fetchLimitedDocs(
  baseQuery: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>,
  maxDocs: number,
): Promise<{
  docs: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>[];
  truncated: boolean;
}> {
  const limitedSnap = await baseQuery.limit(maxDocs).get();
  let truncated = false;
  if (limitedSnap.size === maxDocs && limitedSnap.docs.length > 0) {
    const lastDoc = limitedSnap.docs[limitedSnap.docs.length - 1];
    const probeSnap = await baseQuery.startAfter(lastDoc).limit(1).get();
    truncated = !probeSnap.empty;
  }
  return { docs: limitedSnap.docs, truncated };
}

async function fetchDocsByIds(
  db: FirebaseFirestore.Firestore,
  collectionName: string,
  ids: string[],
  maxLookups: number,
): Promise<{
  map: Map<string, FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>>;
  truncated: boolean;
}> {
  const uniqueIds = Array.from(new Set(ids.map((id) => String(id || '').trim()).filter(Boolean)));
  const limitedIds = uniqueIds.slice(0, maxLookups);
  const map = new Map<string, FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>>();

  for (let i = 0; i < limitedIds.length; i += 250) {
    const slice = limitedIds.slice(i, i + 250);
    if (slice.length === 0) continue;
    const refs = slice.map((id) => db.collection(collectionName).doc(id));
    const snaps = await db.getAll(...refs);
    snaps.forEach((snap) => map.set(snap.id, snap));
  }

  return { map, truncated: uniqueIds.length > limitedIds.length };
}

function resolvePrimaryKidId(session: Record<string, unknown>): string | null {
  const direct = String(session.kidId || session.studentId || '').trim();
  if (direct) return direct;
  if (Array.isArray(session.kidIds) && session.kidIds.length > 0) {
    const first = String(session.kidIds[0] || '').trim();
    if (first) return first;
  }
  return null;
}

function resolveAttendanceStatus(session: Record<string, unknown>, kidId: string | null): string | null {
  if (!kidId) return null;
  const attendanceRaw = session.attendance;
  if (!attendanceRaw || typeof attendanceRaw !== 'object') return null;
  const attendance = attendanceRaw as Record<string, unknown>;
  const entry = attendance[kidId];
  if (!entry) return null;
  if (typeof entry === 'string') return normalizeStatus(entry);
  if (typeof entry === 'object' && entry !== null) {
    return normalizeStatus((entry as Record<string, unknown>).status);
  }
  return null;
}

function isExpectedFinanciallyCompletedSession(session: Record<string, unknown>): boolean {
  if (session.revenueSuppressed === true) return false;
  if (session.revenueAccrued === true) return true;
  if (normalizeStatus(session.status) !== 'completed') return false;
  const kidId = resolvePrimaryKidId(session);
  const attendanceStatus = resolveAttendanceStatus(session, kidId);
  if (!attendanceStatus) return true;
  return attendanceStatus === 'present' || attendanceStatus === 'late';
}

function sampleRows<T>(rows: T[], limit: number): T[] {
  if (rows.length <= limit) return rows;
  return rows.slice(0, limit);
}

function normalizeAmount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function duplicateFingerprintGroups(
  rows: Array<Record<string, unknown>>,
  idField: string,
  buildFingerprint: (row: Record<string, unknown>) => string,
): Array<{ fingerprint: string; count: number; ids: string[] }> {
  const groups = new Map<string, string[]>();

  rows.forEach((row) => {
    const id = String(row[idField] || '').trim();
    if (!id) return;
    const key = buildFingerprint(row);
    if (!key) return;
    const bucket = groups.get(key) || [];
    bucket.push(id);
    groups.set(key, bucket);
  });

  return Array.from(groups.entries())
    .filter(([, ids]) => ids.length > 1)
    .map(([fingerprint, ids]) => ({ fingerprint, count: ids.length, ids }))
    .sort((a, b) => b.count - a.count);
}

export const runFinanceReconciliationAudit = onCall(
  {
    region: REGION,
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const monthKey = normalizeMonthKey(request.data?.monthKey);
    const sampleLimit = toInt(request.data?.sampleLimit, 20, 5, 100);
    const maxDocsPerCollection = toInt(request.data?.maxDocsPerCollection, 5000, 500, 20000);
    const maxLinkedLookups = toInt(request.data?.maxLinkedLookups, 7000, 500, 25000);

    const db = admin.firestore();
    const warnings: string[] = [];

    const [repairSnap, completedSnap, chargesSnap, earningsSnap, paymentsSnap, payoutsSnap] =
      await Promise.all([
        fetchLimitedDocs(db.collection('classSessions').where('revenueRepairRequired', '==', true), maxDocsPerCollection),
        fetchLimitedDocs(db.collection('classSessions').where('status', '==', 'completed'), maxDocsPerCollection),
        fetchLimitedDocs(
          monthKey
            ? db.collection('billingCharges').where('monthKey', '==', monthKey)
            : db.collection('billingCharges'),
          maxDocsPerCollection,
        ),
        fetchLimitedDocs(
          monthKey
            ? db.collection('teacherEarnings').where('monthKey', '==', monthKey)
            : db.collection('teacherEarnings'),
          maxDocsPerCollection,
        ),
        fetchLimitedDocs(
          monthKey ? db.collection('payments').where('monthKey', '==', monthKey) : db.collection('payments'),
          maxDocsPerCollection,
        ),
        fetchLimitedDocs(
          monthKey
            ? db.collection('teacherPayouts').where('monthKey', '==', monthKey)
            : db.collection('teacherPayouts'),
          maxDocsPerCollection,
        ),
      ]);

    if (repairSnap.truncated) warnings.push('classSessions(revenueRepairRequired) scan truncated');
    if (completedSnap.truncated) warnings.push('classSessions(completed) scan truncated');
    if (chargesSnap.truncated) warnings.push('billingCharges scan truncated');
    if (earningsSnap.truncated) warnings.push('teacherEarnings scan truncated');
    if (paymentsSnap.truncated) warnings.push('payments scan truncated');
    if (payoutsSnap.truncated) warnings.push('teacherPayouts scan truncated');

    const repairSessions = repairSnap.docs
      .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() || {}) }))
      .filter((row) => inMonthScope(row, monthKey));

    const completedSessions = completedSnap.docs
      .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() || {}) }))
      .filter((row) => inMonthScope(row, monthKey));

    const charges = chargesSnap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() || {}) }));
    const earnings = earningsSnap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() || {}) }));
    const payments = paymentsSnap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() || {}) }));
    const payouts = payoutsSnap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() || {}) }));

    const chargeSessionIds = charges
      .map((row) => String(row.sessionId || '').trim())
      .filter(Boolean);
    const earningSessionIds = earnings
      .map((row) => String(row.sessionId || '').trim())
      .filter(Boolean);

    const linkedSessionIds = Array.from(new Set([...chargeSessionIds, ...earningSessionIds]));
    const linkedSessionFetch = await fetchDocsByIds(db, 'classSessions', linkedSessionIds, maxLinkedLookups);
    if (linkedSessionFetch.truncated) {
      warnings.push('linked classSessions lookup truncated');
    }

    const linkedSessionMap = new Map<string, Record<string, unknown>>();
    linkedSessionFetch.map.forEach((snap, id) => {
      if (!snap.exists) return;
      linkedSessionMap.set(id, { id, ...(snap.data() || {}) });
    });

    const expectedCompletedSessions = completedSessions.filter((session) =>
      isExpectedFinanciallyCompletedSession(session),
    );

    const sessionIdsWithCharges = new Set(chargeSessionIds);
    const sessionIdsWithEarnings = new Set(earningSessionIds);

    const missingChargeSessions = expectedCompletedSessions
      .filter((session) => !sessionIdsWithCharges.has(String(session.id)))
      .map((session) => ({
        sessionId: String(session.id),
        date: session.date || null,
        status: session.status || null,
        teacherId: session.teacherId || null,
        parentId: session.parentId || null,
        enrollmentId: session.enrollmentId || null,
        revenueAccrued: session.revenueAccrued === true,
      }));

    const missingEarningSessions = expectedCompletedSessions
      .filter((session) => !sessionIdsWithEarnings.has(String(session.id)))
      .map((session) => ({
        sessionId: String(session.id),
        date: session.date || null,
        status: session.status || null,
        teacherId: session.teacherId || null,
        parentId: session.parentId || null,
        enrollmentId: session.enrollmentId || null,
        revenueAccrued: session.revenueAccrued === true,
      }));

    const chargesMissingSession = charges
      .filter((charge) => {
        const sessionId = String(charge.sessionId || '').trim();
        return !!sessionId && !linkedSessionMap.has(sessionId);
      })
      .map((charge) => ({
        chargeId: String(charge.id),
        sessionId: String(charge.sessionId || '').trim() || null,
        enrollmentId: charge.enrollmentId || null,
        parentId: charge.parentId || null,
        teacherId: charge.teacherId || null,
        status: charge.status || null,
        amount: normalizeAmount(charge.amount),
        monthKey: charge.monthKey || resolveMonthKey(charge) || null,
      }));

    const earningsMissingSession = earnings
      .filter((earning) => {
        const sessionId = String(earning.sessionId || '').trim();
        return !!sessionId && !linkedSessionMap.has(sessionId);
      })
      .map((earning) => ({
        earningId: String(earning.id),
        sessionId: String(earning.sessionId || '').trim() || null,
        enrollmentId: earning.enrollmentId || null,
        parentId: earning.parentId || null,
        teacherId: earning.teacherId || null,
        status: earning.status || null,
        amount: normalizeAmount(earning.amount),
        monthKey: earning.monthKey || resolveMonthKey(earning) || null,
      }));

    const paymentDuplicateGroups = duplicateFingerprintGroups(
      payments,
      'id',
      (payment) => {
        const enrollmentId = String(payment.enrollmentId || '').trim();
        const amount = normalizeAmount(payment.amount).toFixed(2);
        const method = normalizeStatus(payment.method);
        const date = String(payment.date || '').trim();
        const note = String(payment.note || '').trim().toLowerCase();
        if (!enrollmentId || !date) return '';
        return `${enrollmentId}|${amount}|${method}|${date}|${note}`;
      },
    );

    const payoutDuplicateGroups = duplicateFingerprintGroups(
      payouts,
      'id',
      (payout) => {
        const teacherId = String(payout.teacherId || '').trim();
        const amount = normalizeAmount(payout.amount).toFixed(2);
        const method = normalizeStatus(payout.method);
        const date = String(payout.date || '').trim();
        const note = String(payout.note || '').trim().toLowerCase();
        if (!teacherId || !date) return '';
        return `${teacherId}|${amount}|${method}|${date}|${note}`;
      },
    );

    const sessionFinancialInconsistencyMap = new Map<
      string,
      {
        sessionId: string;
        status: string;
        reasons: Set<string>;
        chargeIds: Set<string>;
        earningIds: Set<string>;
      }
    >();
    const allowedFinancialStatuses = new Set(['completed']);

    const upsertInconsistentSession = (sessionId: string, status: string, reason: string) => {
      const existing = sessionFinancialInconsistencyMap.get(sessionId);
      if (existing) {
        existing.reasons.add(reason);
        return existing;
      }
      const next = {
        sessionId,
        status,
        reasons: new Set([reason]),
        chargeIds: new Set<string>(),
        earningIds: new Set<string>(),
      };
      sessionFinancialInconsistencyMap.set(sessionId, next);
      return next;
    };

    charges.forEach((charge) => {
      const status = normalizeStatus(charge.status);
      if (status === 'void') return;
      const sessionId = String(charge.sessionId || '').trim();
      if (!sessionId) return;
      const session = linkedSessionMap.get(sessionId);
      if (!session) return;
      const sessionStatus = normalizeStatus(session.status);
      if (!allowedFinancialStatuses.has(sessionStatus)) {
        const issue = upsertInconsistentSession(
          sessionId,
          sessionStatus || 'unknown',
          'charge_linked_to_non_completed_session',
        );
        issue.chargeIds.add(String(charge.id));
      }
    });

    earnings.forEach((earning) => {
      const status = normalizeStatus(earning.status);
      if (status === 'void') return;
      const sessionId = String(earning.sessionId || '').trim();
      if (!sessionId) return;
      const session = linkedSessionMap.get(sessionId);
      if (!session) return;
      const sessionStatus = normalizeStatus(session.status);
      if (!allowedFinancialStatuses.has(sessionStatus)) {
        const issue = upsertInconsistentSession(
          sessionId,
          sessionStatus || 'unknown',
          'earning_linked_to_non_completed_session',
        );
        issue.earningIds.add(String(earning.id));
      }
    });

    linkedSessionMap.forEach((session, sessionId) => {
      const sessionStatus = normalizeStatus(session.status);
      if (session.revenueAccrued === true && sessionStatus !== 'completed') {
        upsertInconsistentSession(sessionId, sessionStatus || 'unknown', 'revenue_accrued_but_not_completed');
      }
    });

    const inconsistentStatusSessions = Array.from(sessionFinancialInconsistencyMap.values()).map((row) => ({
      sessionId: row.sessionId,
      status: row.status,
      reasons: Array.from(row.reasons),
      chargeIds: Array.from(row.chargeIds),
      earningIds: Array.from(row.earningIds),
    }));

    const enrollmentIdsForLookup = Array.from(
      new Set(
        [...charges, ...earnings]
          .map((row) => String(row.enrollmentId || '').trim())
          .filter(Boolean),
      ),
    );
    const enrollmentFetch = await fetchDocsByIds(db, 'enrollments', enrollmentIdsForLookup, maxLinkedLookups);
    if (enrollmentFetch.truncated) warnings.push('linked enrollments lookup truncated');

    const enrollmentMap = new Map<string, Record<string, unknown>>();
    enrollmentFetch.map.forEach((snap, id) => {
      if (!snap.exists) return;
      enrollmentMap.set(id, { id, ...(snap.data() || {}) });
    });

    const linkageIssues: Array<Record<string, unknown>> = [];
    const collectLinkageIssues = (docType: 'billingCharge' | 'teacherEarning', row: Record<string, unknown>) => {
      const reasons: string[] = [];
      const sessionId = String(row.sessionId || '').trim();
      const enrollmentId = String(row.enrollmentId || '').trim();
      const parentId = String(row.parentId || '').trim();
      const teacherId = String(row.teacherId || '').trim();

      if (!sessionId) reasons.push('missing_sessionId');
      if (!enrollmentId) reasons.push('missing_enrollmentId');
      if (!parentId) reasons.push('missing_parentId');
      if (!teacherId) reasons.push('missing_teacherId');

      const session = sessionId ? linkedSessionMap.get(sessionId) : null;
      const enrollment = enrollmentId ? enrollmentMap.get(enrollmentId) : null;

      if (sessionId && !session) reasons.push('session_not_found');
      if (enrollmentId && !enrollment) reasons.push('enrollment_not_found');

      if (session) {
        const sessionEnrollmentId = String(session.enrollmentId || '').trim();
        const sessionParentId = String(session.parentId || '').trim();
        const sessionTeacherId = String(session.teacherId || '').trim();
        if (enrollmentId && sessionEnrollmentId && enrollmentId !== sessionEnrollmentId) {
          reasons.push('enrollment_mismatch_with_session');
        }
        if (parentId && sessionParentId && parentId !== sessionParentId) {
          reasons.push('parent_mismatch_with_session');
        }
        if (teacherId && sessionTeacherId && teacherId !== sessionTeacherId) {
          reasons.push('teacher_mismatch_with_session');
        }
      }

      if (enrollment) {
        const enrollmentParentId = String(enrollment.parentId || '').trim();
        const enrollmentTeacherId = String(enrollment.teacherId || '').trim();
        if (parentId && enrollmentParentId && parentId !== enrollmentParentId) {
          reasons.push('parent_mismatch_with_enrollment');
        }
        if (teacherId && enrollmentTeacherId && teacherId !== enrollmentTeacherId) {
          reasons.push('teacher_mismatch_with_enrollment');
        }
      }

      if (reasons.length === 0) return;
      linkageIssues.push({
        docType,
        docId: String(row.id || ''),
        sessionId: sessionId || null,
        enrollmentId: enrollmentId || null,
        parentId: parentId || null,
        teacherId: teacherId || null,
        reasons,
      });
    };

    charges.forEach((row) => collectLinkageIssues('billingCharge', row));
    earnings.forEach((row) => collectLinkageIssues('teacherEarning', row));

    return {
      ok: true,
      generatedAt: new Date().toISOString(),
      scope: {
        monthKey: monthKey || 'all_time_scanned',
        sampleLimit,
        maxDocsPerCollection,
        maxLinkedLookups,
      },
      counts: {
        sessionsRevenueRepairRequired: repairSessions.length,
        completedSessionsMissingBillingCharge: missingChargeSessions.length,
        completedSessionsMissingTeacherEarning: missingEarningSessions.length,
        billingChargesMissingSession: chargesMissingSession.length,
        teacherEarningsMissingSession: earningsMissingSession.length,
        duplicateLookingPayments: paymentDuplicateGroups.reduce((sum, group) => sum + group.count, 0),
        duplicateLookingPaymentGroups: paymentDuplicateGroups.length,
        duplicateLookingPayouts: payoutDuplicateGroups.reduce((sum, group) => sum + group.count, 0),
        duplicateLookingPayoutGroups: payoutDuplicateGroups.length,
        financiallyLinkedSessionsInconsistentStatus: inconsistentStatusSessions.length,
        financeLinkageIssues: linkageIssues.length,
      },
      samples: {
        sessionsRevenueRepairRequired: sampleRows(
          repairSessions.map((row) => ({
            sessionId: String(row.id || ''),
            date: row.date || null,
            status: row.status || null,
            revenueRepairReason: row.revenueRepairReason || null,
            revenueRepairDetectedAt: row.revenueRepairDetectedAt || null,
            revenueAccrued: row.revenueAccrued === true,
          })),
          sampleLimit,
        ),
        completedSessionsMissingBillingCharge: sampleRows(missingChargeSessions, sampleLimit),
        completedSessionsMissingTeacherEarning: sampleRows(missingEarningSessions, sampleLimit),
        billingChargesMissingSession: sampleRows(chargesMissingSession, sampleLimit),
        teacherEarningsMissingSession: sampleRows(earningsMissingSession, sampleLimit),
        duplicateLookingPayments: sampleRows(paymentDuplicateGroups, sampleLimit),
        duplicateLookingPayouts: sampleRows(payoutDuplicateGroups, sampleLimit),
        financiallyLinkedSessionsInconsistentStatus: sampleRows(inconsistentStatusSessions, sampleLimit),
        financeLinkageIssues: sampleRows(linkageIssues, sampleLimit),
      },
      warnings,
    };
  },
);
