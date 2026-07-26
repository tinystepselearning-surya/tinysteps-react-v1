import { createHash } from 'crypto';
import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { ensureAdmin } from '../helpers/adminGuard';
import { deliverPushToUser } from './pushDelivery';
import {
  hasApnsConfiguration,
  isApnsInvalidTokenReason,
  sendApnsAlert,
} from '../lib/sendApnsAlert';

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = 'asia-south1';
const ACTIVE_TOKEN_QUERY_CHUNK = 10;
const FCM_BATCH_SIZE = 500;
const TOKEN_DOC_BATCH_SIZE = 400;
const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 180;
const TOKEN_MIN_LENGTH = 20;

type NotificationPlatform = 'ios' | 'android' | 'web';
type NotificationProvider = 'apns' | 'fcm';

type AuthLike = {
  uid: string;
  token?: Record<string, unknown>;
};

interface RegisterNotificationTokenInput {
  token?: unknown;
  platform?: unknown;
  provider?: unknown;
  deviceId?: unknown;
  appVersion?: unknown;
}

interface SendTestPushNotificationInput {
  userId?: unknown;
  title?: unknown;
  body?: unknown;
}

interface NotificationTokenDoc {
  docId: string;
  token: string;
  userId: string;
  platform: NotificationPlatform;
  provider: NotificationProvider;
}

interface PushSendSummary {
  successCount: number;
  failureCount: number;
  invalidTokenDocIds: string[];
}

function asOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {};
  return value as Record<string, unknown>;
}

function chunk<T>(items: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

function normalizeRole(value: unknown): string | null {
  const role = String(value || '').trim().toLowerCase();
  if (!role) return null;

  if (role === 'learning-partner' || role === 'learningpartner') {
    return 'learningPartner';
  }

  if (role === 'parent' || role === 'teacher' || role === 'admin' || role === 'kid') {
    return role;
  }

  return role;
}

function normalizePlatform(value: unknown): NotificationPlatform {
  const platform = String(value || '').trim().toLowerCase();
  if (platform === 'ios' || platform === 'android' || platform === 'web') {
    return platform;
  }
  throw new HttpsError('invalid-argument', 'platform must be ios, android, or web');
}

function normalizeProvider(
  value: unknown,
  platform: NotificationPlatform,
): NotificationProvider {
  const provider = String(value || '').trim().toLowerCase();
  if (provider === 'apns' || provider === 'fcm') {
    return provider;
  }
  return platform === 'ios' ? 'apns' : 'fcm';
}

function normalizeLimitedString(value: unknown, maxLength: number): string | null {
  const normalized = asOptionalString(value);
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

function buildTokenDocId(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function resolveUserRole(
  db: admin.firestore.Firestore,
  auth: AuthLike,
): Promise<string | null> {
  const roleFromToken = normalizeRole(auth.token?.role);
  if (roleFromToken) return roleFromToken;

  const userSnap = await db.collection('users').doc(auth.uid).get();
  if (!userSnap.exists) return null;

  const userData = userSnap.data() || {};
  return normalizeRole((userData as Record<string, unknown>).role);
}

async function fetchActiveTokensForUsers(
  db: admin.firestore.Firestore,
  userIds: string[],
): Promise<NotificationTokenDoc[]> {
  if (userIds.length === 0) return [];

  const chunks = chunk(userIds, ACTIVE_TOKEN_QUERY_CHUNK);
  const docs: NotificationTokenDoc[] = [];
  const seenDocIds = new Set<string>();

  for (const userChunk of chunks) {
    const snap = await db
      .collection('notificationTokens')
      .where('userId', 'in', userChunk)
      .where('active', '==', true)
      .get();

    snap.docs.forEach((docSnap) => {
      if (seenDocIds.has(docSnap.id)) return;
      const data = asRecord(docSnap.data());
      const token = asOptionalString(data.token);
      const userId = asOptionalString(data.userId);
      if (!token || !userId) return;
      const platform = normalizePlatform(data.platform);
      const provider = normalizeProvider(data.provider, platform);
      seenDocIds.add(docSnap.id);
      docs.push({
        docId: docSnap.id,
        token,
        userId,
        platform,
        provider,
      });
    });
  }

  return docs;
}

async function sendPushToTokenDocs(
  tokenDocs: NotificationTokenDoc[],
  title: string,
  body: string,
  dataPayload: Record<string, string>,
): Promise<PushSendSummary> {
  if (tokenDocs.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokenDocIds: [] };
  }

  let successCount = 0;
  let failureCount = 0;
  const invalidTokenDocIds = new Set<string>();
  const fcmTokenDocs = tokenDocs.filter((item) => item.provider === 'fcm');
  const apnsTokenDocs = tokenDocs.filter((item) => item.provider === 'apns');

  for (const tokenChunk of chunk(fcmTokenDocs, FCM_BATCH_SIZE)) {
    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokenChunk.map((item) => item.token),
      notification: {
        title,
        body,
      },
      data: dataPayload,
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    });

    response.responses.forEach((sendResponse, index) => {
      if (sendResponse.success) {
        successCount += 1;
        return;
      }

      failureCount += 1;
      const code = String(sendResponse.error?.code || '').trim();
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        invalidTokenDocIds.add(tokenChunk[index].docId);
      }
    });
  }

  if (apnsTokenDocs.length > 0 && !hasApnsConfiguration()) {
    logger.warn('notifications:apns_config_missing', {
      apnsTokenCount: apnsTokenDocs.length,
    });
    failureCount += apnsTokenDocs.length;
  }

  for (const tokenDoc of apnsTokenDocs) {
    if (!hasApnsConfiguration()) break;
    const threadId = dataPayload.threadId || dataPayload.sessionId || 'tinysteps';

    try {
      const outcome = await sendApnsAlert({
        deviceToken: tokenDoc.token,
        title,
        body,
        threadId,
        data: dataPayload,
      });

      if (outcome.ok) {
        successCount += 1;
        continue;
      }

      failureCount += 1;
      if (isApnsInvalidTokenReason(outcome.reason)) {
        invalidTokenDocIds.add(tokenDoc.docId);
      }

      logger.warn('notifications:apns_send_failed', {
        tokenDocId: tokenDoc.docId,
        status: outcome.status,
        reason: outcome.reason || 'unknown',
      });
    } catch (error) {
      failureCount += 1;
      logger.warn('notifications:apns_send_exception', {
        tokenDocId: tokenDoc.docId,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    successCount,
    failureCount,
    invalidTokenDocIds: Array.from(invalidTokenDocIds),
  };
}

async function deactivateInvalidTokens(
  db: admin.firestore.Firestore,
  tokenDocIds: string[],
): Promise<void> {
  if (tokenDocIds.length === 0) return;

  const now = FieldValue.serverTimestamp();
  for (const idChunk of chunk(tokenDocIds, TOKEN_DOC_BATCH_SIZE)) {
    const batch = db.batch();
    idChunk.forEach((docId) => {
      const ref = db.collection('notificationTokens').doc(docId);
      batch.set(
        ref,
        {
          active: false,
          updatedAt: now,
          invalidatedAt: now,
        },
        { merge: true },
      );
    });
    await batch.commit();
  }
}

export const registerNotificationToken = onCall(
  { region: REGION, timeoutSeconds: 60, memory: '256MiB' },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const auth = request.auth as AuthLike;
    const input = asRecord(request.data) as RegisterNotificationTokenInput;

    const token = asOptionalString(input.token);
    if (!token || token.length < TOKEN_MIN_LENGTH) {
      throw new HttpsError('invalid-argument', 'A valid push token is required');
    }

    const platform = normalizePlatform(input.platform);
    const provider = normalizeProvider(input.provider, platform);
    const deviceId = normalizeLimitedString(input.deviceId, 120);
    const appVersion = normalizeLimitedString(input.appVersion, 64);

    logger.info('registerNotificationToken:request', {
      uid: auth.uid,
      platform,
      provider,
      tokenLength: token.length,
      hasDeviceId: Boolean(deviceId),
      hasAppVersion: Boolean(appVersion),
    });

    const db = admin.firestore();
    const role = await resolveUserRole(db, auth);
    const tokenDocId = buildTokenDocId(token);
    const tokenRef = db.collection('notificationTokens').doc(tokenDocId);
    const now = FieldValue.serverTimestamp();

    await db.runTransaction(async (tx) => {
      const existingSnap = await tx.get(tokenRef);
      const existing = asRecord(existingSnap.data());
      const createdAt = existing.createdAt || now;

      tx.set(
        tokenRef,
        {
          userId: auth.uid,
          role: role || null,
          token,
          platform,
          provider,
          active: true,
          deviceId: deviceId || null,
          appVersion: appVersion || null,
          createdAt,
          updatedAt: now,
          lastSeenAt: now,
        },
        { merge: true },
      );
    });

    logger.info('registerNotificationToken:stored', {
      uid: auth.uid,
      platform,
      provider,
      tokenDocId,
      tokenDocPath: `notificationTokens/${tokenDocId}`,
    });

    return { ok: true };
  },
);

export const sendTestPushNotification = onCall(
  {
    region: REGION,
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const input = asRecord(request.data) as SendTestPushNotificationInput;
    const targetUserId = asOptionalString(input.userId) || request.auth!.uid;

    const title =
      normalizeLimitedString(input.title, MAX_TITLE_LENGTH) ||
      'Tiny Steps push test';
    const body =
      normalizeLimitedString(input.body, MAX_BODY_LENGTH) ||
      'Push notifications are enabled for Tiny Steps.';

    const db = admin.firestore();
    const tokenDocs = await fetchActiveTokensForUsers(db, [targetUserId]);

    if (tokenDocs.length === 0) {
      return {
        ok: true,
        sent: 0,
        failed: 0,
        targetUserId,
        message: 'No active notification tokens found for this user.',
      };
    }

    const summary = await sendPushToTokenDocs(tokenDocs, title, body, {
      type: 'test_push',
      targetPath: '/messages',
    });

    if (summary.invalidTokenDocIds.length > 0) {
      await deactivateInvalidTokens(db, summary.invalidTokenDocIds);
    }

    return {
      ok: true,
      sent: summary.successCount,
      failed: summary.failureCount,
      targetUserId,
    };
  },
);

// Scheduled reminder delivery uses a narrow startAt query and an idempotent delivery ledger.

const REMINDER_TYPE = 'class_reminder_15m';
const REMINDER_WINDOW_MIN_MS = 14 * 60 * 1000;
const REMINDER_WINDOW_MAX_MS = 16 * 60 * 1000;
const CLAIM_DURATION_MS = 5 * 60 * 1000;
const DELIVERY_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const EXCLUDED_SESSION_STATES = new Set([
  'completed',
  'cancelled',
  'canceled',
  'no_show',
  'reschedule_requested',
  'paused',
  'archived',
  'invalid',
]);
const OPERATIONAL_SESSION_STATES = new Set(['scheduled', 'upcoming', 'confirmed']);

const toStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map(asOptionalString).filter((item): item is string => Boolean(item))));
};

const normalizedSessionState = (value: unknown): string =>
  String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');

const getTimestampMillis = (value: unknown): number | null => {
  if (value instanceof Timestamp) return value.toMillis();
  if (
    value &&
    typeof value === 'object' &&
    typeof (value as { toMillis?: unknown }).toMillis === 'function'
  ) {
    const millis = Number((value as { toMillis: () => number }).toMillis());
    return Number.isFinite(millis) ? millis : null;
  }
  return null;
};

export const buildClassReminderDeliveryId = (
  sessionId: string,
  userId: string,
  sessionStartAtMs: number,
): string => createHash('sha256')
  .update(`${REMINDER_TYPE}:${sessionId}:${userId}:${sessionStartAtMs}`)
  .digest('hex');

export const isEligibleClassReminderSession = (
  session: Record<string, unknown>,
  nowMs: number,
): boolean => {
  const startAtMs = getTimestampMillis(session.startAt);
  if (!startAtMs) return false;
  const untilStart = startAtMs - nowMs;
  if (untilStart < REMINDER_WINDOW_MIN_MS || untilStart > REMINDER_WINDOW_MAX_MS) return false;
  const state = normalizedSessionState(session.status);
  if (!state || EXCLUDED_SESSION_STATES.has(state)) return false;
  return OPERATIONAL_SESSION_STATES.has(state);
};

export const canClaimClassReminderDelivery = (
  previous: Record<string, unknown> | null,
  nowMs: number,
): boolean => {
  if (!previous) return true;
  const status = String(previous.status || '');
  if (status === 'failed') return true;
  return status === 'claimed' &&
    (getTimestampMillis(previous.claimExpiresAt) || 0) <= nowMs;
};

export type ReminderRecipient = {
  userId: string;
  role: 'parent' | 'teacher' | 'learningPartner';
  route: string;
};

export const resolveReminderRecipients = (
  session: Record<string, unknown>,
  enrollment: Record<string, unknown>,
): ReminderRecipient[] => {
  const sessionParents = Array.from(new Set([
    asOptionalString(session.parentId),
    ...toStringList(session.parentIds),
  ].filter((item): item is string => Boolean(item))));
  const enrollmentParents = Array.from(new Set([
    asOptionalString(enrollment.parentId),
    ...toStringList(enrollment.parentIds),
  ].filter((item): item is string => Boolean(item))));
  const parents = sessionParents.filter((userId) => enrollmentParents.includes(userId));

  const sessionTeachers = Array.from(new Set([
    asOptionalString(session.teacherId),
    ...toStringList(session.teacherIds),
  ].filter((item): item is string => Boolean(item))));
  const enrollmentTeachers = Array.from(new Set([
    asOptionalString(enrollment.teacherId),
    ...toStringList(enrollment.teacherIds),
  ].filter((item): item is string => Boolean(item))));
  const teachers = sessionTeachers.filter((userId) => enrollmentTeachers.includes(userId));

  const recipients: ReminderRecipient[] = [
    ...parents.map((userId) => ({
      userId,
      role: 'parent' as const,
      route: '/parent?tab=classes',
    })),
    ...teachers.map((userId) => ({
      userId,
      role: 'teacher' as const,
      route: '/teacher?tab=today',
    })),
  ];

  if (enrollment.learningPartnerNotificationsEnabled === true) {
    const learningPartners = Array.from(new Set([
      asOptionalString(enrollment.learningPartnerId),
      ...toStringList(enrollment.learningPartnerIds),
    ].filter((item): item is string => Boolean(item))));
    learningPartners.forEach((userId) => recipients.push({
      userId,
      role: 'learningPartner',
      route: '/learning-partner/dashboard',
    }));
  }

  return recipients.filter((recipient, index, all) =>
    all.findIndex((candidate) => candidate.userId === recipient.userId) === index);
};

const enrollmentKidIds = (enrollment: Record<string, unknown>): string[] =>
  Array.from(new Set([
    asOptionalString(enrollment.kidId),
    asOptionalString(enrollment.studentId),
    ...toStringList(enrollment.kidIds),
  ].filter((item): item is string => Boolean(item))));

const sessionKidIds = (session: Record<string, unknown>): string[] =>
  Array.from(new Set([
    asOptionalString(session.kidId),
    asOptionalString(session.studentId),
    ...toStringList(session.kidIds),
  ].filter((item): item is string => Boolean(item))));

export const reminderDeliverySkipReason = (args: {
  session: Record<string, unknown>;
  enrollment: Record<string, unknown>;
  enrollmentId: string;
  recipient: ReminderRecipient;
  sessionStartAtMs: number;
}): string | null => {
  const {
    session,
    enrollment,
    enrollmentId,
    recipient,
    sessionStartAtMs,
  } = args;
  if (asOptionalString(session.enrollmentId) !== enrollmentId) {
    return 'session_enrollment_changed';
  }
  if (getTimestampMillis(session.startAt) !== sessionStartAtMs) {
    return 'session_rescheduled';
  }
  if (!OPERATIONAL_SESSION_STATES.has(normalizedSessionState(session.status))) {
    return 'session_not_eligible';
  }
  const enrollmentState = normalizedSessionState(enrollment.status);
  if (enrollmentState !== 'active' && enrollmentState !== 'trial') {
    return 'enrollment_not_operational';
  }
  const currentSessionKidIds = sessionKidIds(session);
  const currentEnrollmentKidIds = enrollmentKidIds(enrollment);
  if (
    currentSessionKidIds.length === 0 ||
    !currentSessionKidIds.some((kidId) => currentEnrollmentKidIds.includes(kidId))
  ) {
    return 'student_relationship_changed';
  }
  const sessionCourseId = asOptionalString(session.courseId);
  const enrollmentCourseId = asOptionalString(enrollment.courseId);
  if (!sessionCourseId || !enrollmentCourseId || sessionCourseId !== enrollmentCourseId) {
    return 'course_relationship_changed';
  }
  const stillLinked = resolveReminderRecipients(session, enrollment)
    .some((candidate) =>
      candidate.userId === recipient.userId &&
      candidate.role === recipient.role &&
      candidate.route === recipient.route);
  if (!stillLinked) {
    return recipient.role === 'teacher'
      ? 'teacher_assignment_changed'
      : recipient.role === 'learningPartner'
        ? 'learning_partner_notifications_disabled'
        : 'parent_relationship_changed';
  }
  return null;
};

const formatClassStartTime = (startAtMs: number): string =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(startAtMs));

export const buildClassReminderBody = (args: {
  role: ReminderRecipient['role'];
  startLabel: string;
  childLabel?: string | null;
  courseLabel?: string | null;
}): string => {
  const verifiedClassLabel = args.childLabel && args.courseLabel
    ? `${args.childLabel}'s ${args.courseLabel} class`
    : 'Your class';
  return args.role === 'teacher'
    ? `${verifiedClassLabel} starts at ${args.startLabel}. Tap to open today's sessions.`
    : `${verifiedClassLabel} starts at ${args.startLabel}. Tap to open Classes.`;
};

const safeFailureReason = (error: unknown): string => {
  if (error instanceof Error && error.name) return error.name.slice(0, 80);
  return 'push_delivery_failed';
};

export const buildReminderClaimRecord = (args: {
  sessionId: string;
  userId: string;
  sessionStartAtMs: number;
  nowMs: number;
}) => ({
  type: REMINDER_TYPE,
  sessionId: args.sessionId,
  userId: args.userId,
  sessionStartAt: Timestamp.fromMillis(args.sessionStartAtMs),
  status: 'claimed',
  claimedAt: FieldValue.serverTimestamp(),
  claimExpiresAt: Timestamp.fromMillis(args.nowMs + CLAIM_DURATION_MS),
  sentAt: null,
  failedAt: null,
  failureReason: null,
  expiresAt: Timestamp.fromMillis(args.nowMs + DELIVERY_TTL_MS),
});

const claimReminderDelivery = async (
  db: admin.firestore.Firestore,
  sessionRef: admin.firestore.DocumentReference,
  enrollmentRef: admin.firestore.DocumentReference,
  recipient: ReminderRecipient,
  sessionStartAtMs: number,
): Promise<admin.firestore.DocumentReference | null> => {
  const deliveryId = buildClassReminderDeliveryId(
    sessionRef.id,
    recipient.userId,
    sessionStartAtMs,
  );
  const deliveryRef = db.collection('notificationDeliveries').doc(deliveryId);
  const nowMs = Date.now();
  return db.runTransaction(async (tx) => {
    const [deliverySnapshot, liveSessionSnapshot, enrollmentSnapshot] = await Promise.all([
      tx.get(deliveryRef),
      tx.get(sessionRef),
      tx.get(enrollmentRef),
    ]);
    const previous = deliverySnapshot.data() || {};
    if (!canClaimClassReminderDelivery(
      deliverySnapshot.exists ? previous : null,
      nowMs,
    )) {
      return null;
    }
    const skipReason = !liveSessionSnapshot.exists
      ? 'session_deleted'
      : !enrollmentSnapshot.exists
        ? 'enrollment_deleted'
        : reminderDeliverySkipReason({
          session: liveSessionSnapshot.data() || {},
          enrollment: enrollmentSnapshot.data() || {},
          enrollmentId: enrollmentRef.id,
          recipient,
          sessionStartAtMs,
        });
    if (skipReason) {
      tx.set(deliveryRef, {
        type: REMINDER_TYPE,
        sessionId: sessionRef.id,
        userId: recipient.userId,
        sessionStartAt: Timestamp.fromMillis(sessionStartAtMs),
        status: 'skipped',
        skippedAt: FieldValue.serverTimestamp(),
        skipReason,
        claimExpiresAt: null,
        expiresAt: Timestamp.fromMillis(nowMs + DELIVERY_TTL_MS),
      }, { merge: true });
      return null;
    }

    tx.set(deliveryRef, buildReminderClaimRecord({
      sessionId: sessionRef.id,
      userId: recipient.userId,
      sessionStartAtMs,
      nowMs,
    }), { merge: true });
    return deliveryRef;
  });
};

const revalidateClaimedReminderDelivery = async (
  db: admin.firestore.Firestore,
  deliveryRef: admin.firestore.DocumentReference,
  sessionRef: admin.firestore.DocumentReference,
  enrollmentRef: admin.firestore.DocumentReference,
  recipient: ReminderRecipient,
  sessionStartAtMs: number,
): Promise<boolean> => db.runTransaction(async (tx) => {
  const [deliverySnapshot, sessionSnapshot, enrollmentSnapshot] = await Promise.all([
    tx.get(deliveryRef),
    tx.get(sessionRef),
    tx.get(enrollmentRef),
  ]);
  const delivery = deliverySnapshot.data() || {};
  if (!deliverySnapshot.exists || delivery.status !== 'claimed') return false;
  const skipReason = !sessionSnapshot.exists
    ? 'session_deleted'
    : !enrollmentSnapshot.exists
      ? 'enrollment_deleted'
      : reminderDeliverySkipReason({
        session: sessionSnapshot.data() || {},
        enrollment: enrollmentSnapshot.data() || {},
        enrollmentId: enrollmentRef.id,
        recipient,
        sessionStartAtMs,
      });
  if (!skipReason) return true;
  tx.set(deliveryRef, {
    status: 'skipped',
    skippedAt: FieldValue.serverTimestamp(),
    skipReason,
    claimExpiresAt: null,
  }, { merge: true });
  return false;
});

export const sendClassReminders15Min = onSchedule(
  {
    schedule: 'every 1 minutes',
    timeZone: 'Asia/Kolkata',
    region: REGION,
    timeoutSeconds: 120,
    memory: '512MiB',
    maxInstances: 1,
  },
  async () => {
    const db = admin.firestore();
    const nowMs = Date.now();
    const lowerBound = Timestamp.fromMillis(nowMs + REMINDER_WINDOW_MIN_MS);
    const upperBound = Timestamp.fromMillis(nowMs + REMINDER_WINDOW_MAX_MS);
    const sessionsSnapshot = await db.collection('classSessions')
      .where('startAt', '>=', lowerBound)
      .where('startAt', '<=', upperBound)
      .get();

    for (const sessionSnapshot of sessionsSnapshot.docs) {
      const session = sessionSnapshot.data() || {};
      if (!isEligibleClassReminderSession(session, nowMs)) continue;
      const enrollmentId = asOptionalString(session.enrollmentId);
      const sessionKidId =
        asOptionalString(session.kidId) ||
        asOptionalString(session.studentId) ||
        toStringList(session.kidIds)[0] ||
        null;
      const sessionCourseId = asOptionalString(session.courseId);
      const sessionStartAtMs = getTimestampMillis(session.startAt);
      if (!enrollmentId || !sessionKidId || !sessionCourseId || !sessionStartAtMs) {
        continue;
      }

      const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
      const enrollmentSnapshot = await enrollmentRef.get();
      if (!enrollmentSnapshot.exists) continue;
      const enrollment = enrollmentSnapshot.data() || {};
      const recipients = resolveReminderRecipients(session, enrollment);
      const baselineRecipient = recipients[0];
      if (
        !baselineRecipient ||
        reminderDeliverySkipReason({
          session,
          enrollment,
          enrollmentId,
          recipient: baselineRecipient,
          sessionStartAtMs,
        })
      ) {
        continue;
      }
      const [kidSnapshot, courseSnapshot] = await Promise.all([
        db.collection('kids').doc(sessionKidId).get(),
        db.collection('courses').doc(sessionCourseId).get(),
      ]);
      const kid = kidSnapshot.exists ? kidSnapshot.data() || {} : {};
      const course = courseSnapshot.exists ? courseSnapshot.data() || {} : {};
      const childLabel = kidSnapshot.exists
        ? asOptionalString(kid.name) ||
          asOptionalString(kid.displayName) ||
          asOptionalString(kid.firstName)
        : null;
      const courseLabel = courseSnapshot.exists
        ? asOptionalString(course.name) ||
          asOptionalString(course.title) ||
          asOptionalString(course.courseName)
        : null;
      for (const recipient of recipients) {
        const deliveryRef = await claimReminderDelivery(
          db,
          sessionSnapshot.ref,
          enrollmentRef,
          recipient,
          sessionStartAtMs,
        );
        if (!deliveryRef) continue;

        const stateSnapshot = await db.collection('userNotificationState')
          .doc(recipient.userId)
          .get();
        const aggregateBadge = Number(stateSnapshot.data()?.unreadMessages);
        const badge = Number.isFinite(aggregateBadge)
          ? Math.max(0, Math.floor(aggregateBadge))
          : undefined;
        const stillEligible = await revalidateClaimedReminderDelivery(
          db,
          deliveryRef,
          sessionSnapshot.ref,
          enrollmentRef,
          recipient,
          sessionStartAtMs,
        );
        if (!stillEligible) continue;
        const startLabel = formatClassStartTime(sessionStartAtMs);
        const body = buildClassReminderBody({
          role: recipient.role,
          startLabel,
          childLabel,
          courseLabel,
        });

        try {
          const summary = await deliverPushToUser(db, recipient.userId, {
            title: 'Class starts in 15 minutes',
            body,
            badge,
            threadId: sessionSnapshot.id,
            data: {
              type: 'class_reminder',
              sessionId: sessionSnapshot.id,
              route: recipient.route,
            },
          });
          await deliveryRef.set({
            status: summary.successCount > 0 ? 'sent' : 'failed',
            sentAt: summary.successCount > 0
              ? FieldValue.serverTimestamp()
              : null,
            failedAt: summary.successCount > 0
              ? null
              : FieldValue.serverTimestamp(),
            failureReason: summary.successCount > 0
              ? null
              : summary.tokenCount === 0
                ? 'no_active_tokens'
                : 'push_delivery_failed',
          }, { merge: true });
        } catch (error) {
          await deliveryRef.set({
            status: 'failed',
            failedAt: FieldValue.serverTimestamp(),
            failureReason: safeFailureReason(error),
          }, { merge: true });
        }
      }
    }
  },
);
