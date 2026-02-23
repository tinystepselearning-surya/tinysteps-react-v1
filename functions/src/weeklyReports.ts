import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const IST_OFFSET_MINUTES = 330;

type CallerRole = 'admin' | 'teacher' | 'parent' | 'learning-partner' | 'unknown';

type WeeklyReportDoc = {
  studentId: string;
  courseId: string;
  weekKey: string;
  weekStartAt: number;
  weekEndAt: number;
  weekStartYMD?: string;
  weekEndYMD?: string;
  periodStartAt?: admin.firestore.Timestamp;
  periodEndAt?: admin.firestore.Timestamp;
  sessionsPlanned: number;
  sessionsAttended: number;
  scores: {
    overall: number;
    consistency: number;
    understanding: number;
    confidence: number;
  };
  covered: string[];
  wins: string[];
  focusAreas: string[];
  nextWeekPlan: string[];
  homePractice: {
    quickRevision: string;
    focusedSkill: string;
    confidenceBooster: string;
  };
  teacherNote?: string | null;
  status: 'draft' | 'published';
  computed?: {
    sessionsPlanned: number;
    sessionsAttended: number;
    scores: {
      overall: number;
      consistency: number;
      understanding: number;
      confidence: number;
    };
    covered: string[];
    wins: string[];
    focusAreas: string[];
    nextWeekPlan: string[];
    homePractice: {
      quickRevision: string;
      focusedSkill: string;
      confidenceBooster: string;
    };
  };
  computedAt?: number | admin.firestore.Timestamp | admin.firestore.FieldValue;
  updatedBy: string;
  updatedAt: number;
  publishedAt?: admin.firestore.FieldValue;
  publishedBy?: string;
};

const MASTERY_SCORE: Record<string, number> = {
  not_started: 0,
  emerging: 25,
  developing: 50,
  proficient: 75,
  mastered: 100,
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function masteryScore(value: unknown): number {
  const key = String(value ?? '').toLowerCase();
  return MASTERY_SCORE[key] ?? 0;
}

function masteryRank(value: unknown): number {
  const key = String(value ?? '').toLowerCase();
  if (key === 'mastered') return 4;
  if (key === 'proficient') return 3;
  if (key === 'developing') return 2;
  if (key === 'emerging') return 1;
  return 0;
}

function toMillis(value: any): number {
  if (!value) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  return 0;
}

function uniqueNonEmpty(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  list.forEach((item) => {
    const v = item.trim();
    if (!v || seen.has(v)) return;
    seen.add(v);
    out.push(v);
  });
  return out;
}

function parseWeekKey(weekKey: string): { isoYear: number; isoWeek: number } {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekKey);
  if (!match) throw new HttpsError('invalid-argument', 'Invalid weekKey format');
  return { isoYear: Number(match[1]), isoWeek: Number(match[2]) };
}

function isoWeekStartUtc(isoYear: number, isoWeek: number): Date {
  const simple = new Date(Date.UTC(isoYear, 0, 1 + (isoWeek - 1) * 7));
  const day = simple.getUTCDay();
  const diff = day <= 4 ? day - 1 : day - 8;
  simple.setUTCDate(simple.getUTCDate() - diff);
  return simple;
}

function weekRangeFromKey(weekKey: string): { weekStartAt: number; weekEndAt: number } {
  const { isoYear, isoWeek } = parseWeekKey(weekKey);
  const weekStartUtc = isoWeekStartUtc(isoYear, isoWeek);
  const offsetMs = IST_OFFSET_MINUTES * 60 * 1000;
  const weekStartAt = weekStartUtc.getTime() - offsetMs;
  const weekEndAt = weekStartAt + 7 * 24 * 60 * 60 * 1000 - 1;
  return { weekStartAt, weekEndAt };
}

function formatYMDFromMillis(ms: number): string {
  const offsetMs = IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(ms + offsetMs);
  const y = istDate.getUTCFullYear();
  const m = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(istDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatYMFromYMD(ymd: string): string {
  return ymd.slice(0, 7);
}

async function getCallerRole(uid: string): Promise<CallerRole> {
  const db = admin.firestore();
  const snap = await db.doc(`users/${uid}`).get();
  if (!snap.exists) return 'unknown';
  const data = snap.data() as any;
  const role = data?.role as CallerRole | undefined;
  if (role === 'admin' || role === 'teacher') return role;
  if (Array.isArray(data?.roles)) {
    if (data.roles.includes('admin')) return 'admin';
    if (data.roles.includes('teacher')) return 'teacher';
  }
  return role ?? 'unknown';
}

async function assertTeacherAccess(db: admin.firestore.Firestore, uid: string, kidId: string) {
  const role = await getCallerRole(uid);
  if (role === 'admin') return;
  if (role !== 'teacher') {
    throw new HttpsError('permission-denied', 'Only teachers can generate reports.');
  }
  const kidSnap = await db.doc(`kids/${kidId}`).get();
  if (!kidSnap.exists) {
    throw new HttpsError('not-found', 'Student not found.');
  }
  const data = kidSnap.data() as any;
  const teacherIds = Array.isArray(data?.teacherIds) ? data.teacherIds : [];
  if (!teacherIds.includes(uid)) {
    throw new HttpsError('permission-denied', 'Teacher not assigned to this student.');
  }
}

async function fetchSessions(
  db: admin.firestore.Firestore,
  studentId: string,
  courseId: string,
  weekStartAt: number,
  weekEndAt: number,
) {
  const sessionsCol = db.collection('classSessions');
  const start = admin.firestore.Timestamp.fromMillis(weekStartAt);
  const end = admin.firestore.Timestamp.fromMillis(weekEndAt);

  const qA = courseId
    ? sessionsCol
        .where('kidIds', 'array-contains', studentId)
        .where('courseId', '==', courseId)
        .where('startAt', '>=', start)
        .where('startAt', '<=', end)
    : sessionsCol
        .where('kidIds', 'array-contains', studentId)
        .where('startAt', '>=', start)
        .where('startAt', '<=', end);

  const qB = courseId
    ? sessionsCol
        .where('kidId', '==', studentId)
        .where('courseId', '==', courseId)
        .where('startAt', '>=', start)
        .where('startAt', '<=', end)
    : sessionsCol
        .where('kidId', '==', studentId)
        .where('startAt', '>=', start)
        .where('startAt', '<=', end);

  const [snapA, snapB] = await Promise.all([qA.get(), qB.get()]);
  const map = new Map<string, any>();
  snapA.docs.forEach((doc) => map.set(doc.id, { id: doc.id, ...(doc.data() as any) }));
  snapB.docs.forEach((doc) => map.set(doc.id, { id: doc.id, ...(doc.data() as any) }));
  return Array.from(map.values());
}

function computeAttendance(sessions: any[], studentId: string) {
  let planned = 0;
  let attended = 0;
  sessions.forEach((session) => {
    const status = String(session?.status || '').toLowerCase();
    if (['cancelled', 'canceled', 'no_show', 'noshow'].includes(status)) return;
    planned += 1;
    const attendance = session?.attendance?.[studentId];
    const attStatus = String(attendance?.status || '').toLowerCase();
    if (attStatus === 'present' || attStatus === 'late') {
      attended += 1;
      return;
    }
    if (!attStatus && status === 'completed') {
      attended += 1;
    }
  });
  return { planned, attended };
}

export const generateWeeklyReport = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'You must be logged in.');

  const studentId = String(request.data?.studentId || '').trim();
  const courseId = String(request.data?.courseId || '').trim();
  const weekKey = String(request.data?.weekKey || '').trim();

  if (!studentId || !courseId || !weekKey) {
    throw new HttpsError('invalid-argument', 'studentId, courseId, and weekKey are required.');
  }

  const db = admin.firestore();
  await assertTeacherAccess(db, uid, studentId);

  const reportId = `${courseId}__${weekKey}`;
  const reportRef = db.doc(`students/${studentId}/weeklyReports/${reportId}`);
  const existingSnap = await reportRef.get();
  const existing = existingSnap.exists ? (existingSnap.data() as any) : null;
  const existingStatus = String(existing?.status || '');

  const { weekStartAt, weekEndAt } = weekRangeFromKey(weekKey);
  const progressSnap = await db.collection(`students/${studentId}/progress`).get();
  const progressDocs = progressSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

  const matchesCourse = (doc: any) => {
    const docCourse = String(doc?.courseId || '').trim();
    return !docCourse || docCourse === courseId;
  };

  const currentDocs = progressDocs.filter((doc) => {
    const updatedAt = toMillis(doc.updatedAt);
    return updatedAt >= weekStartAt && updatedAt <= weekEndAt && matchesCourse(doc);
  });

  const prevStart = weekStartAt - 7 * 24 * 60 * 60 * 1000;
  const prevEnd = weekStartAt - 1;
  const prevDocs = progressDocs.filter((doc) => {
    const updatedAt = toMillis(doc.updatedAt);
    return updatedAt >= prevStart && updatedAt <= prevEnd && matchesCourse(doc);
  });

  const prevById = new Map<string, any>();
  prevDocs.forEach((doc) => {
    const key = String(doc?.topicId || doc?.id || '');
    if (key) prevById.set(key, doc);
  });

  const labelFor = (doc: any): string =>
    String(doc?.topicName || doc?.topicLabel || doc?.label || doc?.topicId || doc?.id || '').trim();

  const covered = uniqueNonEmpty(currentDocs.map(labelFor)).slice(0, 5);

  const wins = uniqueNonEmpty(
    currentDocs
      .filter((doc) => {
        const key = String(doc?.topicId || doc?.id || '');
        const prev = key ? prevById.get(key) : null;
        if (!prev) return false;
        return masteryRank(doc?.mastery) > masteryRank(prev?.mastery);
      })
      .map(labelFor),
  ).slice(0, 3);

  const focusBuckets = new Map<string, number>();
  currentDocs.forEach((doc) => {
    if (String(doc?.mastery || '').toLowerCase() === 'mastered') return;
    const chips = Array.isArray(doc?.selectedSubskills) ? doc.selectedSubskills : [];
    chips.forEach((chip: string) => {
      const key = String(chip).trim();
      if (!key) return;
      focusBuckets.set(key, (focusBuckets.get(key) ?? 0) + 1);
    });
  });
  const focusAreas = Array.from(focusBuckets.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([chip]) => chip)
    .slice(0, 2);

  const nextWeekPlan = focusAreas.length > 0
    ? focusAreas.map((item) => `Practice ${item}`).slice(0, 2)
    : ['Continue the same practice plan'];

  const topicsSnap = await db.doc('config/curriculumTopics').get();
  const topicsData = topicsSnap.exists ? (topicsSnap.data() as any) : {};
  const allTopics = Array.isArray(topicsData?.topics) ? topicsData.topics : [];
  const totalTopics = allTopics.filter((t: any) => String(t?.courseId || '') === courseId).length;

  const masteredCount = progressDocs.filter(
    (doc) => matchesCourse(doc) && String(doc?.mastery || '').toLowerCase() === 'mastered',
  ).length;

  const overall =
    totalTopics > 0 ? clampScore(Math.round((masteredCount / totalTopics) * 100)) : 0;

  const understandingValues = currentDocs.map((doc) => masteryScore(doc?.mastery));
  const understanding =
    understandingValues.length > 0
      ? clampScore(
          Math.round(
            understandingValues.reduce((acc, v) => acc + v, 0) / understandingValues.length,
          ),
        )
      : 0;

  const sessions = await fetchSessions(db, studentId, courseId, weekStartAt, weekEndAt);
  const { planned, attended } = computeAttendance(sessions, studentId);
  const consistency = planned > 0 ? clampScore(Math.round((attended / planned) * 100)) : 0;
  const confidence = clampScore(Math.round(0.6 * understanding + 0.4 * consistency));

  const computedAtMs = Date.now();
  const weekStartYMD = formatYMDFromMillis(weekStartAt);
  const weekEndYMD = formatYMDFromMillis(weekEndAt);
  const computed = {
    sessionsPlanned: planned,
    sessionsAttended: attended,
    scores: {
      overall,
      consistency,
      understanding,
      confidence,
    },
    covered,
    wins,
    focusAreas,
    nextWeekPlan,
    homePractice: {
      quickRevision: '2 minutes: quick revision',
      focusedSkill: '2 minutes: one focused skill',
      confidenceBooster: '1 minute: confidence booster',
    },
  };

  const existingUpdatedAtMs = toMillis(existing?.updatedAt);
  const existingComputedAtMs = toMillis(existing?.computedAt);
  const hasTeacherEdits =
    existing &&
    existingUpdatedAtMs > 0 &&
    existingComputedAtMs > 0 &&
    existingUpdatedAtMs > existingComputedAtMs;
  const shouldOverwriteTopLevel =
    !existing ||
    existingComputedAtMs === 0 ||
    existingUpdatedAtMs === 0 ||
    existingUpdatedAtMs <= existingComputedAtMs;
  const isPublished = existingStatus === 'published';
  const shouldWriteTopLevel = shouldOverwriteTopLevel && !isPublished;

  const baseUpdate: Partial<WeeklyReportDoc> = {
    studentId,
    courseId,
    weekKey,
    weekStartAt,
    weekEndAt,
    weekStartYMD,
    weekEndYMD,
    periodStartAt: admin.firestore.Timestamp.fromMillis(weekStartAt),
    periodEndAt: admin.firestore.Timestamp.fromMillis(weekEndAt),
    computed,
    computedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (shouldWriteTopLevel) {
    Object.assign(baseUpdate, {
      sessionsPlanned: computed.sessionsPlanned,
      sessionsAttended: computed.sessionsAttended,
      scores: computed.scores,
      covered: computed.covered,
      wins: computed.wins,
      focusAreas: computed.focusAreas,
      nextWeekPlan: computed.nextWeekPlan,
      homePractice: computed.homePractice,
      teacherNote: existing?.teacherNote ?? null,
      status: existing?.status ?? 'draft',
      updatedBy: uid,
      updatedAt: computedAtMs,
    });
  }

  await reportRef.set(baseUpdate, { merge: true });
  logger.info('[generateWeeklyReport] Draft generated', { studentId, courseId, weekKey });
  let reason: 'teacher_edits' | 'published' | 'new_doc' | undefined;
  if (!existing) reason = 'new_doc';
  else if (isPublished) reason = 'published';
  else if (hasTeacherEdits) reason = 'teacher_edits';
  const ok = !isPublished;
  return {
    ok,
    reportId,
    overwrittenTopLevel: shouldWriteTopLevel,
    reason,
    message: isPublished ? 'Report already published.' : undefined,
  };
});

export const publishWeeklyReport = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'You must be logged in.');

  const studentId = String(request.data?.studentId || '').trim();
  const courseId = String(request.data?.courseId || '').trim();
  const weekKey = String(request.data?.weekKey || '').trim();

  if (!studentId || !courseId || !weekKey) {
    throw new HttpsError('invalid-argument', 'studentId, courseId, and weekKey are required.');
  }

  const db = admin.firestore();
  await assertTeacherAccess(db, uid, studentId);

  const reportId = `${courseId}__${weekKey}`;
  const reportRef = db.doc(`students/${studentId}/weeklyReports/${reportId}`);
  const snap = await reportRef.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Weekly report not found.');
  const weekly = snap.data() as any;

  await reportRef.set(
    {
      status: 'published',
      updatedBy: uid,
      updatedAt: Date.now(),
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      publishedBy: uid,
    },
    { merge: true },
  );

  const weekStartAtFromDoc = toMillis(weekly?.weekStartAt);
  const weekStartAtResolved = weekStartAtFromDoc || weekRangeFromKey(weekKey).weekStartAt;
  const weekStartYMD = String(weekly?.weekStartYMD || formatYMDFromMillis(weekStartAtResolved));
  const monthKey = formatYMFromYMD(weekStartYMD);
  const monthRef = db.doc(`students/${studentId}/monthlyReports/${courseId}__${monthKey}`);

  const weeklySessionsPlanned = Number(
    weekly?.sessionsPlanned ?? weekly?.computed?.sessionsPlanned ?? 0,
  );
  const weeklySessionsAttended = Number(
    weekly?.sessionsAttended ?? weekly?.computed?.sessionsAttended ?? 0,
  );
  const weeklyOverall = Number(weekly?.scores?.overall ?? weekly?.computed?.scores?.overall ?? 0);
  const weeklyWins = Array.isArray(weekly?.wins)
    ? weekly.wins
    : Array.isArray(weekly?.computed?.wins)
      ? weekly.computed.wins
      : [];
  const weeklyFocus = Array.isArray(weekly?.focusAreas)
    ? weekly.focusAreas
    : Array.isArray(weekly?.computed?.focusAreas)
      ? weekly.computed.focusAreas
      : [];
  const weeklyHomePractice = weekly?.homePractice ?? weekly?.computed?.homePractice ?? null;

  await db.runTransaction(async (tx) => {
    const monthSnap = await tx.get(monthRef);
    const monthData = monthSnap.exists ? (monthSnap.data() as any) : {};
    const includedWeekKeys = Array.isArray(monthData?.includedWeekKeys)
      ? monthData.includedWeekKeys
      : [];
    if (includedWeekKeys.includes(weekKey)) return;

    const nextIncluded = [...includedWeekKeys, weekKey];
    const sessionsPlanned = (Number(monthData?.sessionsPlanned) || 0) + weeklySessionsPlanned;
    const sessionsAttended = (Number(monthData?.sessionsAttended) || 0) + weeklySessionsAttended;

    const totals = monthData?.monthTotals ?? {};
    const prevNumerator = Number(totals.overallNumerator) || 0;
    const prevDenominator = Number(totals.overallDenominator) || 0;
    const weight = Math.max(weeklySessionsAttended, 0);
    const nextNumerator = prevNumerator + weeklyOverall * weight;
    const nextDenominator = prevDenominator + weight;
    const overall =
      nextDenominator > 0 ? clampScore(Math.round(nextNumerator / nextDenominator)) : 0;

    const highlights = uniqueNonEmpty([
      ...(Array.isArray(monthData?.highlights) ? monthData.highlights : []),
      ...weeklyWins,
    ]).slice(0, 8);

    const focusAreas = uniqueNonEmpty([
      ...(Array.isArray(monthData?.focusAreas) ? monthData.focusAreas : []),
      ...weeklyFocus,
    ]).slice(0, 6);

    const homePlan =
      weeklyHomePractice ??
      monthData?.homePlan ?? {
        quickRevision: '2 minutes: quick revision',
        focusedSkill: '2 minutes: one focused skill',
        confidenceBooster: '1 minute: confidence booster',
      };

    tx.set(
      monthRef,
      {
        studentId,
        courseId,
        monthKey,
        includedWeekKeys: nextIncluded,
        sessionsPlanned,
        sessionsAttended,
        scores: { overall },
        highlights,
        focusAreas,
        homePlan,
        monthTotals: {
          overallNumerator: nextNumerator,
          overallDenominator: nextDenominator,
        },
        status: 'published',
        updatedBy: uid,
        updatedAt: Date.now(),
      },
      { merge: true },
    );
  });

  logger.info('[publishWeeklyReport] Report published', { studentId, courseId, weekKey });
  return { ok: true, reportId, status: 'published' };
});
