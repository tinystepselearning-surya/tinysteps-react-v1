import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

import { normalizeRole } from './roles';
import {
  loadCurrentAuthAccessPrincipal,
  principalHasGlobalRole,
} from '../schoolOS/identity/authAccessAuthorization';
import {
  identityLogToken,
} from '../schoolOS/identity/authUserActivation';

type AuthLike = {
  uid?: string;
  token?: Record<string, unknown>;
} | null | undefined;

function tokenClaimsAdmin(
  auth: AuthLike,
): boolean {
  return (
    normalizeRole(auth?.token?.role) ===
      'admin' ||
    auth?.token?.admin === true
  );
}

/**
 * Returns true only when the authenticated Firebase UID resolves to a current
 * canonical-derived authAccessReadModels/{uid} record whose Person/AuthIdentity
 * lifecycle is active and whose active global RoleAssignment includes Admin.
 *
 * Firebase custom claims remain an authentication cache only. They are not
 * authoritative for Tiny Steps business authorization.
 *
 * There is intentionally no fallback to users/{uid}. R5B independently
 * reconciled every Firebase-backed canonical identity before this cutover.
 */
export async function isCurrentAdmin(
  auth: AuthLike,
): Promise<boolean> {
  const uid = auth?.uid;
  if (!uid || typeof uid !== 'string') {
    return false;
  }

  const uidToken =
    identityLogToken('uid', uid);

  try {
    const principal =
      await loadCurrentAuthAccessPrincipal({
        db: admin.firestore(),
        firebaseUid: uid,
      });

    if (!principal.accessActive) {
      logger.warn(
        'isCurrentAdmin: inactive canonical access rejected',
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
        },
      );
      return false;
    }

    const allowed =
      principalHasGlobalRole(
        principal,
        'admin',
      );

    if (
      !allowed &&
      tokenClaimsAdmin(auth)
    ) {
      logger.warn(
        'isCurrentAdmin: stale Admin claim rejected',
        {
          uidToken,
          personIdToken:
            identityLogToken(
              'person',
              principal.personId,
            ),
          canonicalRoles:
            principal.globalRoles,
        },
      );
    }

    return allowed;
  } catch (err) {
    logger.error(
      'isCurrentAdmin: canonical access lookup failed',
      {
        uidToken,
        errorName:
          err instanceof Error
            ? err.name
            : 'UnknownError',
        errorCode:
          err instanceof Error
            ? err.message
            : 'unknown_error',
      },
    );
    return false;
  }
}

/**
 * Single source of truth for callable Admin authorization.
 *
 * Authorization is canonical-derived through authAccessReadModels/{uid}.
 * Legacy users/{uid} is not consulted.
 */
export async function ensureAdmin(
  auth: AuthLike,
): Promise<void> {
  if (!auth?.uid) {
    logger.warn('ensureAdmin: missing auth');
    throw new HttpsError(
      'unauthenticated',
      'Authentication required',
    );
  }

  if (await isCurrentAdmin(auth)) {
    return;
  }

  throw new HttpsError(
    'permission-denied',
    'Admin access required',
  );
}
