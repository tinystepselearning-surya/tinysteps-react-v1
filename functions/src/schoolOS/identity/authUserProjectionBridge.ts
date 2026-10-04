import {
  buildAuthIdentityId,
} from './idStrategy';

export const AUTH_USER_CANONICAL_PROJECTION_COMMANDS = [
  'auth_user_create',
  'auth_user_update',
  'auth_user_archive',
  'teacher_profile_update',
] as const;

export type AuthUserCanonicalProjectionCommand =
  (typeof AUTH_USER_CANONICAL_PROJECTION_COMMANDS)[number];

type LooseDoc = Record<string, unknown>;

function cleanText(value: unknown): string {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function isAllowedCommand(
  value: unknown,
): value is AuthUserCanonicalProjectionCommand {
  return (
    typeof value === 'string' &&
    (
      AUTH_USER_CANONICAL_PROJECTION_COMMANDS as
        readonly string[]
    ).includes(value)
  );
}

export interface AuthUserProjectionCorroborationInput {
  firebaseUid: string;
  afterData: LooseDoc | null;
  personData: LooseDoc | null;
  authIdentityData: LooseDoc | null;
}

export function authUserProjectionMarker(
  data: LooseDoc | null,
): {
  command: AuthUserCanonicalProjectionCommand;
  writeId: string;
  canonicalPersonId: string;
  providerSubject: string;
} | null {
  const raw =
    data?._wave1CanonicalProjection;
  if (
    !raw ||
    typeof raw !== 'object'
  ) {
    return null;
  }

  const marker =
    raw as Record<string, unknown>;
  const command = marker.command;
  const writeId =
    cleanText(marker.writeId);
  const canonicalPersonId =
    cleanText(marker.canonicalPersonId);
  const provider =
    cleanText(marker.provider);
  const providerSubject =
    cleanText(marker.providerSubject);

  if (
    marker.schemaVersion !== 1 ||
    cleanText(marker.authority) !==
      'canonical-primary' ||
    !isAllowedCommand(command) ||
    !writeId ||
    !canonicalPersonId ||
    provider !== 'firebase' ||
    !providerSubject
  ) {
    return null;
  }

  return {
    command,
    writeId,
    canonicalPersonId,
    providerSubject,
  };
}

export function authUserProjectionAuthIdentityId(
  params: {
    firebaseUid: string;
    afterData: LooseDoc | null;
  },
): string | null {
  const firebaseUid =
    cleanText(params.firebaseUid);
  const marker =
    authUserProjectionMarker(
      params.afterData,
    );
  if (
    !firebaseUid ||
    !marker ||
    marker.providerSubject !== firebaseUid
  ) {
    return null;
  }

  return buildAuthIdentityId(
    'firebase',
    firebaseUid,
  );
}

export function canonicalAuthUserProjectionMatchesAuthority(
  params:
    AuthUserProjectionCorroborationInput,
): boolean {
  const firebaseUid =
    cleanText(params.firebaseUid);
  if (!firebaseUid) return false;

  const marker =
    authUserProjectionMarker(
      params.afterData,
    );
  if (
    !marker ||
    marker.providerSubject !== firebaseUid
  ) {
    return false;
  }

  const afterUid =
    cleanText(params.afterData?.uid) ||
    cleanText(params.afterData?.userId);
  if (
    afterUid &&
    afterUid !== firebaseUid
  ) {
    return false;
  }

  const topLevelCanonicalPersonId =
    cleanText(
      params.afterData?.canonicalPersonId,
    );
  if (
    topLevelCanonicalPersonId &&
    topLevelCanonicalPersonId !==
      marker.canonicalPersonId
  ) {
    return false;
  }

  const personData =
    params.personData || {};
  if (
    cleanText(personData.personId) !==
    marker.canonicalPersonId
  ) {
    return false;
  }

  const personAuthority =
    personData.canonicalAuthority;
  if (
    !personAuthority ||
    typeof personAuthority !== 'object'
  ) {
    return false;
  }
  const authority =
    personAuthority as
      Record<string, unknown>;

  if (
    authority.schemaVersion !== 1 ||
    cleanText(authority.authority) !==
      'canonical-primary' ||
    cleanText(authority.command) !==
      marker.command ||
    cleanText(authority.writeId) !==
      marker.writeId
  ) {
    return false;
  }

  const authIdentity =
    params.authIdentityData || {};
  const expectedAuthIdentityId =
    buildAuthIdentityId(
      'firebase',
      firebaseUid,
    );
  const storedAuthIdentityId =
    cleanText(
      authIdentity.authIdentityId,
    );

  return (
    cleanText(authIdentity.provider) ===
      'firebase' &&
    cleanText(
      authIdentity.providerSubject,
    ) === firebaseUid &&
    cleanText(authIdentity.personId) ===
      marker.canonicalPersonId &&
    (
      !storedAuthIdentityId ||
      storedAuthIdentityId ===
        expectedAuthIdentityId
    )
  );
}
