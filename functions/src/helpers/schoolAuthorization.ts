import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { HttpsError } from 'firebase-functions/v2/https';

import { normalizeSchoolStatus } from './schools';
import {
  loadCurrentAuthAccessPrincipal,
  principalHasGlobalRole,
  principalHasSchoolAdminAccess,
  type CurrentAuthAccessPrincipal,
} from '../schoolOS/identity/authAccessAuthorization';
import {
  identityLogToken,
} from '../schoolOS/identity/authUserActivation';

export type SchoolManagerKind =
  | 'admin'
  | 'learningPartner';

export type SchoolReaderKind =
  | SchoolManagerKind
  | 'schoolAdmin';

export interface AuthorizedSchoolManager {
  uid: string;
  personId: string;
  kind: SchoolManagerKind;
  school: admin.firestore.DocumentData;
  schoolRef:
    admin.firestore.DocumentReference;
}

export interface AuthorizedSchoolReader {
  uid: string;
  personId: string;
  kind: SchoolReaderKind;
  school: admin.firestore.DocumentData;
  schoolRef:
    admin.firestore.DocumentReference;
}

type AuthLike =
  | { uid?: string }
  | null
  | undefined;

async function requireCurrentPrincipal(
  auth: AuthLike,
): Promise<{
  uid: string;
  principal: CurrentAuthAccessPrincipal;
}> {
  const uid = auth?.uid;
  if (
    !uid ||
    typeof uid !== 'string'
  ) {
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

    if (!principal.accessActive) {
      logger.warn(
        'school authorization: inactive canonical access rejected',
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
      throw new HttpsError(
        'permission-denied',
        'This account is not active',
      );
    }

    return {
      uid,
      principal,
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.error(
      'school authorization: canonical access lookup failed',
      {
        uidToken,
        errorName:
          error instanceof Error
            ? error.name
            : 'UnknownError',
        errorCode:
          error instanceof Error
            ? error.message
            : 'unknown_error',
      },
    );

    throw new HttpsError(
      'permission-denied',
      'Current canonical access was not found',
    );
  }
}

async function getSchoolOrThrow(
  schoolId: string,
): Promise<{
  school: admin.firestore.DocumentData;
  schoolRef:
    admin.firestore.DocumentReference;
}> {
  if (
    !schoolId ||
    typeof schoolId !== 'string' ||
    !schoolId.trim()
  ) {
    throw new HttpsError(
      'invalid-argument',
      'schoolId is required',
    );
  }

  const schoolRef = admin
    .firestore()
    .collection('schools')
    .doc(schoolId.trim());
  const schoolSnap =
    await schoolRef.get();

  if (!schoolSnap.exists) {
    throw new HttpsError(
      'not-found',
      'School not found',
    );
  }

  return {
    school:
      schoolSnap.data() || {},
    schoolRef,
  };
}

export async function ensureCurrentActiveAdmin(
  auth: AuthLike,
): Promise<{
  uid: string;
  personId: string;
}> {
  const current =
    await requireCurrentPrincipal(auth);

  if (
    !principalHasGlobalRole(
      current.principal,
      'admin',
    )
  ) {
    logger.warn(
      'school-domain admin authorization denied',
      {
        uidToken:
          identityLogToken(
            'uid',
            current.uid,
          ),
        personIdToken:
          identityLogToken(
            'person',
            current.principal.personId,
          ),
        canonicalRoles:
          current.principal.globalRoles,
      },
    );

    throw new HttpsError(
      'permission-denied',
      'Admin access required',
    );
  }

  return {
    uid: current.uid,
    personId:
      current.principal.personId,
  };
}

export async function ensureSchoolReader(
  auth: AuthLike,
  schoolIdInput: string,
): Promise<AuthorizedSchoolReader> {
  const schoolId =
    schoolIdInput.trim();
  const current =
    await requireCurrentPrincipal(auth);
  const {
    school,
    schoolRef,
  } = await getSchoolOrThrow(schoolId);
  const status =
    normalizeSchoolStatus(
      school.status,
    ) || 'active';

  if (
    principalHasGlobalRole(
      current.principal,
      'admin',
    )
  ) {
    return {
      uid: current.uid,
      personId:
        current.principal.personId,
      kind: 'admin',
      school,
      schoolRef,
    };
  }

  if (
    principalHasGlobalRole(
      current.principal,
      'learningPartner',
    ) &&
    typeof school.learningPartnerId ===
      'string' &&
    school.learningPartnerId ===
      current.uid
  ) {
    return {
      uid: current.uid,
      personId:
        current.principal.personId,
      kind: 'learningPartner',
      school,
      schoolRef,
    };
  }

  if (
    status !== 'archived' &&
    principalHasSchoolAdminAccess(
      current.principal,
      schoolId,
    )
  ) {
    return {
      uid: current.uid,
      personId:
        current.principal.personId,
      kind: 'schoolAdmin',
      school,
      schoolRef,
    };
  }

  throw new HttpsError(
    'permission-denied',
    'You are not authorized to read this school',
  );
}

export async function ensureSchoolManager(
  auth: AuthLike,
  schoolIdInput: string,
  options: {
    allowArchived?: boolean;
  } = {},
): Promise<AuthorizedSchoolManager> {
  const schoolId =
    schoolIdInput.trim();
  const current =
    await requireCurrentPrincipal(auth);
  const {
    school,
    schoolRef,
  } = await getSchoolOrThrow(schoolId);
  const status =
    normalizeSchoolStatus(
      school.status,
    ) || 'active';

  if (
    !options.allowArchived &&
    status === 'archived'
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Archived schools cannot be modified',
    );
  }

  if (
    principalHasGlobalRole(
      current.principal,
      'admin',
    )
  ) {
    return {
      uid: current.uid,
      personId:
        current.principal.personId,
      kind: 'admin',
      school,
      schoolRef,
    };
  }

  if (
    principalHasGlobalRole(
      current.principal,
      'learningPartner',
    ) &&
    typeof school.learningPartnerId ===
      'string' &&
    school.learningPartnerId ===
      current.uid
  ) {
    return {
      uid: current.uid,
      personId:
        current.principal.personId,
      kind: 'learningPartner',
      school,
      schoolRef,
    };
  }

  throw new HttpsError(
    'permission-denied',
    'You are not authorized to manage this school',
  );
}

export async function ensureSchoolReadableByManager(
  auth: AuthLike,
  schoolId: string,
): Promise<AuthorizedSchoolManager> {
  return ensureSchoolManager(
    auth,
    schoolId,
    { allowArchived: true },
  );
}
