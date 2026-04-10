/**
 * adminCreateUser.ts (Single-file, self-contained)
 *
 * Creates Auth user + role docs in Firestore + custom claims.
 * Only ADMIN can call.
 *
 * Roles:
 * - admin
 * - teacher
 * - parent
 * - learningPartner (alias)
 * - learning-partner (canonical)
 *
 * Canonical role stored in Firestore + claims: "learning-partner"
 * Raw role stored as provided: "learningPartner" | "learning-partner"
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK once
if (!admin.apps.length) admin.initializeApp();

// ---------- Constants ----------

const REGION = "asia-south1";

const VALID_ROLES = [
  "admin",
  "teacher",
  "parent",
  "learningPartner",
  "learning-partner",
] as const;

type RawRole = (typeof VALID_ROLES)[number];
type CanonicalRole = "admin" | "teacher" | "parent" | "learning-partner";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-\+\(\)]+$/;
const USER_ID_UNAVAILABLE_MESSAGE =
  "This user ID is already taken or not available. Please try another user ID.";
const PHONE_ALREADY_IN_USE_MESSAGE =
  "This phone number is already in use. Please use a different phone number.";

const MAX_CUSTOM_CLAIMS_BYTES = 1000; // Firebase custom claims limit is ~1KB
const DEFAULT_STATUS = "active" as const;
type UserStatus = "active" | "suspended" | "archived";

// ---------- Types ----------

interface AdminCreateUserRequest {
  email: string;
  displayName: string;
  password?: string;
  phone?: string;
  phoneCountryCode?: string;
  phoneLocal?: string;
  role: RawRole;

  // Teacher fields
  qualification?: string;
  specialization?: string[];
  yearsExperience?: number;
  bio?: string;

  // Parent fields
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  communicationLanguage?: string;
  sessionTime?: string;
  paymentMethods?: string[];

  // Learning Partner fields
  region?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankAccountHolderName?: string;

  // Common
  status?: UserStatus;
}

interface AdminCreateUserResponse {
  success: true;
  uid: string;
  email: string;
  displayName: string;
  role: CanonicalRole;
  rawRole: RawRole;
  resetLinkSent: boolean;
  resetLink?: string | null;
  emailVerificationLink?: string | null;
  message: string;
  timestamp: string;
  nextSteps: string[];
}

interface AdminCreateUserErrorResponse {
  success: false;
  code: string;
  error: string;
}

// ---------- Helpers ----------

function normalizeRole(role: RawRole): CanonicalRole {
  if (role === "admin" || role === "teacher" || role === "parent") return role;
  // Both map to canonical "learning-partner"
  if (role === "learningPartner" || role === "learning-partner")
    return "learning-partner";
  throw new HttpsError("invalid-argument", `Unsupported role: ${role}`);
}

function normalizeEmailForUniqueness(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhoneForUniqueness(phone?: string | null): string | null {
  if (typeof phone !== "string") return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "");
  return digits || null;
}

function normalizeCountryCode(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const digits = value.trim().replace(/\D/g, "");
  return digits ? `+${digits}` : null;
}

function normalizePhoneLocal(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const digits = value.trim().replace(/\D/g, "");
  return digits || null;
}

async function assertFirestoreUniqueness(params: {
  db: admin.firestore.Firestore;
  email: string;
  phone?: string | null;
}) {
  const { db, email, phone } = params;

  const existingEmailSnap = await db
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();
  if (!existingEmailSnap.empty) {
    throw new HttpsError("already-exists", USER_ID_UNAVAILABLE_MESSAGE);
  }

  const phoneKey = normalizePhoneForUniqueness(phone);
  if (!phoneKey) return;

  // We intentionally scan the lightweight `phone` field to compare normalized values,
  // so legacy formats like "+91 98765 43210" and "919876543210" are treated as duplicates.
  const usersSnap = await db.collection("users").select("phone").get();
  for (const userDoc of usersSnap.docs) {
    const existingPhone = userDoc.data()?.phone;
    const existingPhoneKey = normalizePhoneForUniqueness(
      typeof existingPhone === "string" ? existingPhone : null
    );
    if (existingPhoneKey && existingPhoneKey === phoneKey) {
      throw new HttpsError("already-exists", PHONE_ALREADY_IN_USE_MESSAGE);
    }
  }
}

function sanitizeForLogging(input: any) {
  const obj = { ...(input || {}) };
  const redact = ["password", "bankAccountNumber", "bankIfscCode"];
  for (const k of redact) if (k in obj) obj[k] = "[REDACTED]";
  return obj;
}

function validateClaimsSize(claims: Record<string, any>) {
  const bytes = Buffer.byteLength(JSON.stringify(claims), "utf8");
  if (bytes > MAX_CUSTOM_CLAIMS_BYTES) {
    throw new HttpsError(
      "invalid-argument",
      `Custom claims too large (${bytes} bytes). Max ${MAX_CUSTOM_CLAIMS_BYTES}.`
    );
  }
}

function validateInput(data: AdminCreateUserRequest) {
  if (!data || typeof data !== "object") {
    throw new HttpsError("invalid-argument", "Request data is required");
  }

  if (!data.email || typeof data.email !== "string" || !EMAIL_REGEX.test(data.email.trim().toLowerCase())) {
    throw new HttpsError("invalid-argument", "Valid email is required");
  }

  if (!data.displayName || typeof data.displayName !== "string") {
    throw new HttpsError("invalid-argument", "displayName is required");
  }
  const dn = data.displayName.trim();
  if (dn.length < 2 || dn.length > 100) {
    throw new HttpsError("invalid-argument", "displayName must be 2–100 chars");
  }

  if (!data.role || !VALID_ROLES.includes(data.role)) {
    throw new HttpsError(
      "invalid-argument",
      `role must be one of: ${VALID_ROLES.join(", ")}`
    );
  }

  if (data.phone != null) {
    if (typeof data.phone !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "Invalid phone. Use digits/spaces/+/-/()"
      );
    }
    const trimmedPhone = data.phone.trim();
    if (trimmedPhone) {
      if (!PHONE_REGEX.test(trimmedPhone) || !normalizePhoneForUniqueness(trimmedPhone)) {
        throw new HttpsError(
          "invalid-argument",
          "Invalid phone. Use digits/spaces/+/-/()"
        );
      }
    }
  }

  const countryCode = normalizeCountryCode(data.phoneCountryCode || null);
  const phoneLocal = normalizePhoneLocal(data.phoneLocal || null);
  if ((countryCode && !phoneLocal) || (!countryCode && phoneLocal)) {
    throw new HttpsError("invalid-argument", "Provide both phoneCountryCode and phoneLocal");
  }
  if (countryCode && !/^\+\d{1,4}$/.test(countryCode)) {
    throw new HttpsError("invalid-argument", "Invalid phoneCountryCode");
  }
  if (phoneLocal && !/^\d{6,15}$/.test(phoneLocal)) {
    throw new HttpsError("invalid-argument", "Invalid phoneLocal");
  }

  if (data.password && data.password.length < 6) {
    throw new HttpsError("invalid-argument", "Password must be at least 6 chars");
  }

  if (data.pincode && !/^\d{6}$/.test(data.pincode)) {
    throw new HttpsError("invalid-argument", "pincode must be 6 digits");
  }

  if (data.yearsExperience != null) {
    if (typeof data.yearsExperience !== "number" || data.yearsExperience < 0 || data.yearsExperience > 100) {
      throw new HttpsError("invalid-argument", "yearsExperience must be 0–100");
    }
  }

  if (data.specialization && (!Array.isArray(data.specialization) || data.specialization.length > 20)) {
    throw new HttpsError("invalid-argument", "specialization must be an array (max 20)");
  }

  if (data.qualification && data.qualification.length > 500) {
    throw new HttpsError("invalid-argument", "qualification must be <= 500 chars");
  }

  if (data.bankAccountNumber && !/^\d{9,18}$/.test(data.bankAccountNumber)) {
    throw new HttpsError("invalid-argument", "Invalid bankAccountNumber format");
  }

  if (data.bankIfscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.bankIfscCode)) {
    throw new HttpsError("invalid-argument", "Invalid IFSC code format");
  }

  if (data.status && !["active", "suspended", "archived"].includes(data.status)) {
    throw new HttpsError("invalid-argument", "status must be active|suspended|archived");
  }
}

/**
 * Admin-only guard:
 * - checks callable auth token claims first
 * - fallback to /users/{uid}.role === 'admin' or roles includes 'admin'
 */
async function ensureAdmin(auth: any) {
  if (!auth?.uid) throw new HttpsError("unauthenticated", "Authentication required");

  const tokenIsAdmin = auth.token?.role === "admin" || auth.token?.admin === true;
  if (tokenIsAdmin) return;

  const callerUid = auth.uid;
  const doc = await admin.firestore().collection("users").doc(callerUid).get();
  if (!doc.exists) throw new HttpsError("permission-denied", "Admin access required");

  const data = doc.data() || {};
  const docIsAdmin =
    data.role === "admin" || (Array.isArray(data.roles) && data.roles.includes("admin"));

  if (!docIsAdmin) throw new HttpsError("permission-denied", "Admin access required");
}

// ---------- Core ----------

export const adminCreateUser = onCall(
  {
    region: REGION,
    memory: "256MiB",
    timeoutSeconds: 60,
    maxInstances: 10,
    // enforceAppCheck: true, // enable once App Check is configured
  },
  async (request): Promise<AdminCreateUserResponse | AdminCreateUserErrorResponse> => {
    const now = new Date().toISOString();
    let createdUid: string | null = null;

    try {
      await ensureAdmin(request.auth);

      const data = (request.data || {}) as AdminCreateUserRequest;
      validateInput(data);

      const email = normalizeEmailForUniqueness(data.email);
      const displayName = data.displayName.trim();
      const phoneCountryCode = normalizeCountryCode(data.phoneCountryCode || null) || "";
      const phoneLocal = normalizePhoneLocal(data.phoneLocal || null) || "";
      const phoneFromParts = phoneCountryCode && phoneLocal ? `${phoneCountryCode}${phoneLocal}` : "";
      const phone = phoneFromParts || (typeof data.phone === "string" ? data.phone.trim() : "");
      const rawRole = data.role;
      const role = normalizeRole(rawRole);
      const status: UserStatus = data.status || DEFAULT_STATUS;
      const db = admin.firestore();

      logger.info("adminCreateUser: request", sanitizeForLogging({
        callerUid: request.auth?.uid,
        email,
        displayName,
        rawRole,
        role,
      }));

      await assertFirestoreUniqueness({
        db,
        email,
        phone,
      });

      // 1) Ensure email not already in Auth
      try {
        await admin.auth().getUserByEmail(email);
        throw new HttpsError(
          "already-exists",
          USER_ID_UNAVAILABLE_MESSAGE
        );
      } catch (e: any) {
        if (e?.code !== "auth/user-not-found") {
          if (e instanceof HttpsError) throw e;
          if (e?.code === "auth/email-already-exists") {
            throw new HttpsError("already-exists", USER_ID_UNAVAILABLE_MESSAGE);
          }
          throw new HttpsError("internal", "Failed checking existing user");
        }
      }

      // 2) Create Auth user
      const createReq: admin.auth.CreateRequest = {
        email,
        displayName,
        emailVerified: false,
        disabled: false,
      };
      if (data.password) createReq.password = data.password;

      const user = await admin.auth().createUser(createReq);
      createdUid = user.uid;

      // 3) Firestore docs (batch)
      const batch = db.batch();
      const ts = admin.firestore.FieldValue.serverTimestamp();

      const baseUserDoc: any = {
        userId: user.uid,
        email,
        displayName,
        name: displayName,
        phone: phone || null,
        phoneCountryCode: phoneCountryCode || null,
        phoneLocal: phoneLocal || null,
        role,              // canonical
        rawRole,           // requested
        roles: [role],     // for easy rules / checks
        status,
        provider: "admin:create",
        permissions: [],
        createdAt: ts,
        updatedAt: ts,
        createdBy: request.auth!.uid,
        updatedBy: request.auth!.uid,
      };

      // users/{uid}
      batch.set(db.collection("users").doc(user.uid), baseUserDoc, { merge: true });

      // role collections
      if (role === "teacher") {
        batch.set(db.collection("teachers").doc(user.uid), {
          userId: user.uid,
          email,
          displayName,
          phone: phone || null,
          phoneCountryCode: phoneCountryCode || null,
          phoneLocal: phoneLocal || null,
          status,
          qualification: data.qualification || null,
          specialization: data.specialization || [],
          yearsExperience: data.yearsExperience ?? 0,
          bio: data.bio || null,
          assignedLPs: [],
          createdAt: ts,
          updatedAt: ts,
          createdBy: request.auth!.uid,
          updatedBy: request.auth!.uid,
        }, { merge: true });
      }

      if (role === "parent") {
        batch.set(db.collection("parents").doc(user.uid), {
          userId: user.uid,
          email,
          displayName,
          phone: phone || null,
          phoneCountryCode: phoneCountryCode || null,
          phoneLocal: phoneLocal || null,
          status,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          pincode: data.pincode || null,
          assignedLPs: [],
          preferences: {
            communicationLanguage: data.communicationLanguage || "English",
            sessionTime: data.sessionTime || null,
          },
          paymentMethods: data.paymentMethods || [],
          createdAt: ts,
          updatedAt: ts,
          createdBy: request.auth!.uid,
          updatedBy: request.auth!.uid,
        }, { merge: true });

        // Upsert RBAC doc in users/{uid}
        batch.set(db.collection("users").doc(user.uid), {
          role: "parent",
          email,
          displayName,
          status: "active",
          createdAt: ts,
          updatedAt: ts,
          updatedBy: request.auth!.uid,
        }, { merge: true });

        // NOTE: students are NOT Auth users.
        // They will be created later under: /parents/{parentId}/students/{studentId}
      }

      if (role === "learning-partner") {
        batch.set(db.collection("learningPartners").doc(user.uid), {
          userId: user.uid,
          email,
          displayName,
          phone: phone || null,
          phoneCountryCode: phoneCountryCode || null,
          phoneLocal: phoneLocal || null,
          status,
          region: data.region || null,
          qualification: data.qualification || null,
          specialization: data.specialization || [],
          yearsExperience: data.yearsExperience ?? 0,
          assignedParents: [],
          assignedTeachers: [],
          creditsBalance: 0,
          bankDetails: {
            accountNumber: data.bankAccountNumber || null,
            ifscCode: data.bankIfscCode || null,
            accountHolderName: data.bankAccountHolderName || null,
          },
          createdAt: ts,
          updatedAt: ts,
          createdBy: request.auth!.uid,
          updatedBy: request.auth!.uid,
        }, { merge: true });
      }

      if (role === "admin") {
        batch.set(db.collection("admins").doc(user.uid), {
          userId: user.uid,
          email,
          displayName,
          phone: phone || null,
          phoneCountryCode: phoneCountryCode || null,
          phoneLocal: phoneLocal || null,
          status,
          createdAt: ts,
          updatedAt: ts,
          createdBy: request.auth!.uid,
          updatedBy: request.auth!.uid,
        }, { merge: true });
      }

      try {
        await batch.commit();
      } catch (e) {
        logger.error("adminCreateUser: firestore batch failed; rolling back auth user", {
          uid: user.uid,
          error: String(e),
        });
        try {
          await admin.auth().deleteUser(user.uid);
        } catch (rollbackErr) {
          logger.error("adminCreateUser: rollback deleteUser failed", {
            uid: user.uid,
            error: String(rollbackErr),
          });
        }
        throw new HttpsError("internal", "Failed to create user documents");
      }

      // 4) Custom claims (merge, don’t overwrite)
      try {
        const authUser = await admin.auth().getUser(user.uid);
        const existingClaims = authUser.customClaims || {};

        const claims: Record<string, any> = {
          ...existingClaims,
          role,          // canonical
          rawRole,
          [role]: true,  // flag
        };

        if (rawRole !== role) claims[rawRole] = true;

        validateClaimsSize(claims);
        await admin.auth().setCustomUserClaims(user.uid, claims);
      } catch (e) {
        logger.error("adminCreateUser: failed to set custom claims (can be fixed later)", {
          uid: user.uid,
          error: String(e),
        });
      }

      // 5) Reset link (only if password not provided)
      let resetLinkSent = false;
      let resetLink: string | null = null;

      if (!data.password) {
        try {
          resetLink = await admin.auth().generatePasswordResetLink(email);
          resetLinkSent = true;
        } catch (e) {
          logger.warn("adminCreateUser: failed to generate reset link", {
            uid: user.uid,
            error: String(e),
          });
        }
      }

      // 6) Email verification link (optional)
      let emailVerificationLink: string | null = null;
      try {
        emailVerificationLink = await admin.auth().generateEmailVerificationLink(email);
      } catch (e) {
        logger.warn("adminCreateUser: failed to generate email verification link", {
          uid: user.uid,
          error: String(e),
        });
      }

      const nextSteps =
        data.password
          ? [
              "Share the login credentials with the user securely.",
              "User can sign in immediately.",
              "Ask user to verify email (optional).",
              "If claims not seen immediately, user must re-login or refresh token.",
            ]
          : [
              "Share the password reset link securely (or email it via your own system).",
              "User sets password via reset link, then signs in.",
              "If claims not seen immediately, user must re-login or refresh token.",
            ];

      return {
        success: true,
        uid: user.uid,
        email,
        displayName,
        role,
        rawRole,
        resetLinkSent,
        resetLink,
        emailVerificationLink,
        message: `User "${displayName}" created as ${role}`,
        timestamp: now,
        nextSteps,
      };
    } catch (err: any) {
      if (createdUid) {
        logger.warn("adminCreateUser: failed after auth creation", {
          createdUid,
          error: err?.message || String(err),
        });
      }

      if (err instanceof HttpsError) {
        return { success: false, code: err.code, error: err.message };
      }

      logger.error("adminCreateUser: unexpected error", {
        error: err?.message || String(err),
        stack: err?.stack,
      });

      return { success: false, code: "internal", error: "An unexpected error occurred" };
    }
  }
);

// ---------- Backfill ----------

export const backfillTeacherDocs = onCall(
  {
    region: REGION,
    memory: "256MiB",
    timeoutSeconds: 120,
    maxInstances: 5,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const db = admin.firestore();
    const ts = admin.firestore.FieldValue.serverTimestamp();

    const seen = new Set<string>();
    let scanned = 0;
    let created = 0;
    let skipped = 0;

    const roleSnap = await db.collection("users").where("role", "==", "teacher").get();
    const rolesSnap = await db.collection("users").where("roles", "array-contains", "teacher").get();

    const allDocs = [...roleSnap.docs, ...rolesSnap.docs];
    for (const doc of allDocs) {
      const uid = doc.id;
      if (seen.has(uid)) continue;
      seen.add(uid);
      scanned += 1;

      const data = doc.data() || {};
      const teacherRef = db.collection("teachers").doc(uid);
      const teacherSnap = await teacherRef.get();

      if (teacherSnap.exists) {
        skipped += 1;
        continue;
      }

      const displayName = (data.displayName || data.name || "").toString();
      const email = (data.email || "").toString();
      const phone = data.phone || null;
      const status: UserStatus = (data.status as UserStatus) || DEFAULT_STATUS;

      await teacherRef.set(
        {
          userId: uid,
          displayName,
          email,
          phone,
          status,
          createdAt: ts,
          updatedAt: ts,
          createdBy: request.auth?.uid || null,
          updatedBy: request.auth?.uid || null,
        },
        { merge: true }
      );
      created += 1;
    }

    logger.info("backfillTeacherDocs complete", { scanned, created, skipped });
    return { scanned, created, skipped };
  }
);
