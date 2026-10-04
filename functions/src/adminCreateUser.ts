/**
 * Creates an Auth user, canonical user document, applicable role mirror,
 * and canonical custom claims. Only Admin can call.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { ensureAdmin } from "./helpers/adminGuard";
import {
  CANONICAL_ROLES,
  buildRoleClaims,
  getRoleMirrorCollection,
  normalizeRole,
  type CanonicalRole,
} from "./helpers/roles";

// Initialize Firebase Admin SDK once
if (!admin.apps.length) admin.initializeApp();

// ---------- Constants ----------

const REGION = "asia-south1";

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
  role: string;

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
  rawRole: CanonicalRole;
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

  const normalizedRole =
    normalizeRole(data.role);

  if (!normalizedRole) {
    throw new HttpsError(
      "invalid-argument",
      `role must be one of: ${CANONICAL_ROLES.join(", ")}`
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

// ---------- Core ----------

export { adminCreateUser } from './adminCreateUserCanonical';

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
