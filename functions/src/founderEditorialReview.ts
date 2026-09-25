import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();

const REGION = "asia-south1";
const REVIEWER_KEY = "founder-priya" as const;
const STATE_DOC = "phonics";
const STATE_COLLECTION = "editorialReviewState";
const PUBLIC_COLLECTION = "publicEditorialReviewState";
const AUDIT_COLLECTION = "editorialReviewAudit";

type ReviewStatus = "pending" | "approved" | "changes-requested";

type ReviewDecision = {
  conceptId: string;
  status: ReviewStatus;
  reviewerKey: typeof REVIEWER_KEY;
  reviewedByUid: string;
  reviewedAt: string | null;
  reviewedRevision: string | null;
  reviewNotes: string | null;
  updatedAt: string;
};

const PAGE_REVISIONS: Readonly<Record<string, string>> = Object.freeze({
  "ck-rule": "2026-09-09-r9",
  "floss-rule": "2026-09-09-r9",
  "qu-sound": "2026-09-09-r9",
  "digraph-ch": "2026-09-09-r9",
  "digraph-sh": "2026-09-09-r9",
  "digraph-th": "2026-09-09-r9",
  "digraph-ng": "2026-09-09-r9",
  "soft-c-hard-c": "2026-09-09-r9",
  "vowel-team-ai": "2026-09-09-r9",
  "vowel-team-ee": "2026-09-09-r9",
  "vowel-team-ea": "2026-09-09-r9",
  "vowel-team-ie": "2026-09-09-r9",
  "vowel-team-oa": "2026-09-09-r9",
  "magic-e": "2026-09-09-r9",
  "rabbit-rule": "2026-09-09-r9",
  "consonant-le": "2026-09-09-r9",
  "digraph-kn": "2026-09-09-r12",
  "digraph-tch": "2026-09-09-r12",
  "soft-g-hard-g": "2026-09-09-r12",
  "r-controlled-ar": "2026-09-09-r12",
  "r-controlled-or": "2026-09-09-r12",
  "r-controlled-er-ir-ur": "2026-09-09-r12",
  "y-secret-vowel": "2026-09-09-r12",
  "diphthong-oo": "2026-09-09-r12",
  "diphthong-oi-oy": "2026-09-09-r12",
  "diphthong-au-aw": "2026-09-09-r12",
  "diphthong-ou-ow": "2026-09-09-r12",
  "j-sounds": "2026-09-09-r12",
  "shun-family": "2026-09-09-r12",
  "schwa-lazy-vowel": "2026-09-09-r12",
  "vowel-team-ui": "2026-09-09-r12",
});

async function requireFounder(authContext: any): Promise<string> {
  const uid = authContext?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Founder sign-in is required.");
  }

  const db = admin.firestore();
  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) {
    throw new HttpsError("permission-denied", "Founder access is not configured.");
  }

  const data = userSnap.data() || {};
  const role = typeof data.role === "string" ? data.role.trim().toLowerCase() : "";
  const status = typeof data.status === "string" ? data.status.trim().toLowerCase() : "active";

  if (role !== "founder" || status !== "active") {
    throw new HttpsError("permission-denied", "Founder access is required.");
  }

  return uid;
}

function normalizeNotes(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", "reviewNotes must be text.");
  }
  const notes = value.trim();
  if (notes.length > 2000) {
    throw new HttpsError("invalid-argument", "reviewNotes must be 2000 characters or fewer.");
  }
  return notes || null;
}

export const getFounderEditorialReviewState = onCall(
  { region: REGION, memory: "256MiB", timeoutSeconds: 30, maxInstances: 10 },
  async (request) => {
    await requireFounder(request.auth);

    const db = admin.firestore();
    const snap = await db.collection(STATE_COLLECTION).doc(STATE_DOC).get();
    const decisions = snap.exists && snap.data()?.decisions && typeof snap.data()?.decisions === "object"
      ? snap.data()!.decisions
      : {};

    return {
      reviewerKey: REVIEWER_KEY,
      totalPages: Object.keys(PAGE_REVISIONS).length,
      decisions,
    };
  },
);

export const setFounderEditorialReviewDecision = onCall(
  { region: REGION, memory: "256MiB", timeoutSeconds: 30, maxInstances: 10 },
  async (request) => {
    const uid = await requireFounder(request.auth);
    const payload = request.data || {};
    const conceptId = typeof payload.conceptId === "string" ? payload.conceptId.trim() : "";
    const status = payload.status as ReviewStatus;
    const reviewNotes = normalizeNotes(payload.reviewNotes);

    const publicationRevision = PAGE_REVISIONS[conceptId];
    if (!publicationRevision) {
      throw new HttpsError("invalid-argument", "Unknown or unpublished phonics review page.");
    }
    if (status !== "approved" && status !== "changes-requested") {
      throw new HttpsError("invalid-argument", "Status must be approved or changes-requested.");
    }
    if (status === "changes-requested" && !reviewNotes) {
      throw new HttpsError("invalid-argument", "Please add a short note describing the requested change.");
    }

    const now = new Date().toISOString();
    const decision: ReviewDecision = {
      conceptId,
      status,
      reviewerKey: REVIEWER_KEY,
      reviewedByUid: uid,
      reviewedAt: status === "approved" ? now : null,
      reviewedRevision: status === "approved" ? publicationRevision : null,
      reviewNotes,
      updatedAt: now,
    };

    const db = admin.firestore();
    const stateRef = db.collection(STATE_COLLECTION).doc(STATE_DOC);
    const publicRef = db.collection(PUBLIC_COLLECTION).doc(STATE_DOC);
    const auditRef = db.collection(AUDIT_COLLECTION).doc();

    await db.runTransaction(async (transaction) => {
      const [stateSnap, publicSnap] = await Promise.all([
        transaction.get(stateRef),
        transaction.get(publicRef),
      ]);

      const stateDecisions = stateSnap.exists && stateSnap.data()?.decisions && typeof stateSnap.data()?.decisions === "object"
        ? { ...stateSnap.data()!.decisions }
        : {};
      const publicApprovals = publicSnap.exists && publicSnap.data()?.approvals && typeof publicSnap.data()?.approvals === "object"
        ? { ...publicSnap.data()!.approvals }
        : {};

      stateDecisions[conceptId] = decision;

      if (status === "approved") {
        publicApprovals[conceptId] = {
          conceptId,
          reviewerKey: REVIEWER_KEY,
          reviewedAt: now,
          reviewedRevision: publicationRevision,
        };
      } else {
        delete publicApprovals[conceptId];
      }

      transaction.set(stateRef, {
        reviewerKey: REVIEWER_KEY,
        decisions: stateDecisions,
        updatedAt: now,
        schemaVersion: 1,
      }, { merge: true });

      transaction.set(publicRef, {
        approvals: publicApprovals,
        updatedAt: now,
        schemaVersion: 1,
      }, { merge: true });

      transaction.set(auditRef, {
        conceptId,
        status,
        reviewerKey: REVIEWER_KEY,
        reviewedByUid: uid,
        reviewedAt: decision.reviewedAt,
        reviewedRevision: decision.reviewedRevision,
        reviewNotes,
        createdAt: now,
      });
    });

    return { decision };
  },
);
