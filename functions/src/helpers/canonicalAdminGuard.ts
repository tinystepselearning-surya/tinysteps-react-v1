import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

import {
  loadCurrentAuthAccessPrincipal,
  principalHasGlobalRole,
  type CurrentAuthAccessPrincipal,
} from '../schoolOS/identity/authAccessAuthorization';
import {
  identityLogToken,
} from '../schoolOS/identity/authUserActivation';

type AuthLike = {
  uid?: string;
  token?: Record<string, unknown>;
} | null | undefined;

export function isCanonicalAdminPrincipal(
  principal: CurrentAuthAccessPrincipal,
): boolean {
  return principalHasGlobalRole(
    principal,
    'admin',
  );
}

/**
 * R5C2 staged Admin authorization guard.
 *
 * This helper is intentionally separate from helpers/adminGuard.ts so callers
 * can migrate in bounded deployment batches instead of causing the shared
 * legacy guard's full production fan-out.
 *
 * Canonical authority:
 *   authAccessReadModels/{request.auth.uid}
 *
 * There is intentionally no fallback to users/{uid} or Firebase custom claims.
 */
export async function ensureCanonicalAdmin(
  auth: AuthLike,
): Promise<void> {
  const uid =
    typeof auth?.uid === 'string'
      ? auth.uid.trim()
      : '';

  if (!uid) {
    throw new HttpsError(
      'unauthenticated',
      'Authentication required',
    );
  }

  const uidToken =
    identityLogToken('uid', uid);

  try {
    const principal =
      await loadCurrentAuthAccessPrincipal({
        db: admin.firestore(),
        firebaseUid: uid,
      });

    if (
      isCanonicalAdminPrincipal(
        principal,
      )
    ) {
      return;
    }

    logger.warn(
      'ensureCanonicalAdmin: canonical access denied',
      {
        uidToken,
        personIdToken:
          identityLogToken(
            'person',
            principal.personId,
          ),
        personStatus:
          principal.personStatus,
        authStatus:
          principal.authStatus,
        accessActive:
          principal.accessActive,
        canonicalRoles:
          principal.globalRoles,
      },
    );
  } catch (error) {
    logger.error(
      'ensureCanonicalAdmin: canonical access lookup failed',
      {
        uidToken,
        errorCode:
          error instanceof Error
            ? error.message
            : 'unknown_error',
      },
    );
  }

  throw new HttpsError(
    'permission-denied',
    'Admin access required',
  );
}
