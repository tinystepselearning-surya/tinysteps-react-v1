import { describe, expect, it } from 'vitest';

import {
  buildAuthIdentityId,
} from '../src/schoolOS/identity/idStrategy';
import {
  authUserProjectionAuthIdentityId,
  authUserProjectionMarker,
  canonicalAuthUserProjectionMatchesAuthority,
} from '../src/schoolOS/identity/authUserProjectionBridge';

function projection(params?: {
  command?: string;
  writeId?: string;
  personId?: string;
  uid?: string;
}) {
  const command =
    params?.command || 'auth_user_create';
  const writeId =
    params?.writeId || 'write-1';
  const personId =
    params?.personId || 'person-1';
  const uid = params?.uid || 'uid-1';

  return {
    uid,
    userId: uid,
    canonicalPersonId: personId,
    _wave1CanonicalProjection: {
      schemaVersion: 1,
      authority: 'canonical-primary',
      command,
      writeId,
      canonicalPersonId: personId,
      provider: 'firebase',
      providerSubject: uid,
    },
  };
}

function person(params?: {
  command?: string;
  writeId?: string;
  personId?: string;
}) {
  const command =
    params?.command || 'auth_user_create';
  const writeId =
    params?.writeId || 'write-1';
  const personId =
    params?.personId || 'person-1';

  return {
    personId,
    kind: 'adult',
    status: 'active',
    canonicalAuthority: {
      schemaVersion: 1,
      authority: 'canonical-primary',
      command,
      writeId,
    },
  };
}

function authIdentity(params?: {
  personId?: string;
  uid?: string;
}) {
  const personId =
    params?.personId || 'person-1';
  const uid = params?.uid || 'uid-1';
  const authIdentityId =
    buildAuthIdentityId('firebase', uid);

  return {
    authIdentityId,
    personId,
    provider: 'firebase',
    providerSubject: uid,
    status: 'active',
  };
}

describe('Wave 1 R4 Brick 5D auth-user projection corroboration bridge', () => {
  it('corroborates a decoupled auth_user_create projection through Person and AuthIdentity', () => {
    expect(
      canonicalAuthUserProjectionMatchesAuthority({
        firebaseUid: 'uid-1',
        afterData: projection(),
        personData: person(),
        authIdentityData: authIdentity(),
      }),
    ).toBe(true);
  });

  it('corroborates the supported update, archive and teacher-profile commands', () => {
    for (const command of [
      'auth_user_update',
      'auth_user_archive',
      'teacher_profile_update',
    ]) {
      expect(
        canonicalAuthUserProjectionMatchesAuthority({
          firebaseUid: 'uid-1',
          afterData: projection({
            command,
            writeId: `${command}-write`,
          }),
          personData: person({
            command,
            writeId: `${command}-write`,
          }),
          authIdentityData: authIdentity(),
        }),
      ).toBe(true);
    }
  });

  it('also corroborates a legacy-adopted same-value user when the canonical bridge agrees', () => {
    const uid = 'legacy-user';

    expect(
      canonicalAuthUserProjectionMatchesAuthority({
        firebaseUid: uid,
        afterData: projection({
          command: 'auth_user_update',
          writeId: 'legacy-write',
          personId: uid,
          uid,
        }),
        personData: person({
          command: 'auth_user_update',
          writeId: 'legacy-write',
          personId: uid,
        }),
        authIdentityData: authIdentity({
          personId: uid,
          uid,
        }),
      }),
    ).toBe(true);
  });

  it('rejects a projection whose provider subject does not match the source UID', () => {
    const data = projection();
    (
      data._wave1CanonicalProjection as
        Record<string, unknown>
    ).providerSubject = 'another-uid';

    expect(
      canonicalAuthUserProjectionMatchesAuthority({
        firebaseUid: 'uid-1',
        afterData: data,
        personData: person(),
        authIdentityData: authIdentity(),
      }),
    ).toBe(false);
  });

  it('rejects a forged or stale writeId that is not corroborated by Person authority', () => {
    expect(
      canonicalAuthUserProjectionMatchesAuthority({
        firebaseUid: 'uid-1',
        afterData: projection({
          writeId: 'projection-write',
        }),
        personData: person({
          writeId: 'different-write',
        }),
        authIdentityData: authIdentity(),
      }),
    ).toBe(false);
  });

  it('rejects an AuthIdentity that maps the Firebase UID to another Person', () => {
    expect(
      canonicalAuthUserProjectionMatchesAuthority({
        firebaseUid: 'uid-1',
        afterData: projection(),
        personData: person(),
        authIdentityData: authIdentity({
          personId: 'wrong-person',
        }),
      }),
    ).toBe(false);
  });

  it('rejects malformed and unsupported projection commands', () => {
    expect(
      authUserProjectionMarker({
        _wave1CanonicalProjection: {
          schemaVersion: 1,
          authority: 'canonical-primary',
          command: 'unsupported_command',
          writeId: 'write-1',
          canonicalPersonId: 'person-1',
          provider: 'firebase',
          providerSubject: 'uid-1',
        },
      }),
    ).toBeNull();

    expect(
      canonicalAuthUserProjectionMatchesAuthority({
        firebaseUid: 'uid-1',
        afterData: {
          uid: 'uid-1',
        },
        personData: person(),
        authIdentityData: authIdentity(),
      }),
    ).toBe(false);
  });

  it('returns the deterministic AuthIdentity ID only when the marker UID agrees with the source UID', () => {
    expect(
      authUserProjectionAuthIdentityId({
        firebaseUid: 'uid-1',
        afterData: projection(),
      }),
    ).toBe(
      buildAuthIdentityId(
        'firebase',
        'uid-1',
      ),
    );

    expect(
      authUserProjectionAuthIdentityId({
        firebaseUid: 'different-uid',
        afterData: projection(),
      }),
    ).toBeNull();
  });

  it('rejects a top-level canonicalPersonId that contradicts the projection marker', () => {
    const data = projection();
    data.canonicalPersonId =
      'different-person';

    expect(
      canonicalAuthUserProjectionMatchesAuthority({
        firebaseUid: 'uid-1',
        afterData: data,
        personData: person(),
        authIdentityData: authIdentity(),
      }),
    ).toBe(false);
  });
});
