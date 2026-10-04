#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const DEFAULT_PROJECT_ID = 'tinysteps-react-v1';

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseArgs(argv) {
  const out = {
    projectId:
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.FIREBASE_PROJECT_ID ||
      DEFAULT_PROJECT_ID,
    email: '',
    role: 'parent',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--project') out.projectId = text(argv[++i]);
    else if (key === '--email') out.email = text(argv[++i]).toLowerCase();
    else if (key === '--role') out.role = text(argv[++i]);
    else if (key === '--help' || key === '-h') out.help = true;
    else throw new Error(`Unknown argument: ${key}`);
  }

  if (!out.help && !out.email) {
    throw new Error('--email is required');
  }
  if (!out.projectId) {
    throw new Error('--project must not be empty');
  }
  return out;
}

function hashIdentityKey(namespace, parts) {
  const body = [namespace, ...parts].join('\u001f');
  return createHash('sha256')
    .update(body, 'utf8')
    .digest('hex')
    .slice(0, 32);
}

function buildAuthIdentityId(provider, providerSubject) {
  return `auth_${hashIdentityKey('authIdentity', [provider, providerSubject])}`;
}

function buildRoleAssignmentId(personId, role) {
  return `role_${hashIdentityKey('roleAssignment', [personId, role, 'global', ''])}`;
}

function token(namespace, value) {
  return createHash('sha256')
    .update(`${namespace}\u001f${value}`, 'utf8')
    .digest('hex')
    .slice(0, 12);
}

function fail(message, details = {}) {
  const error = new Error(message);
  error.details = details;
  throw error;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log('Usage: node scripts/verify-auth-user-canonical-canary.mjs --email <email> [--role parent] [--project tinysteps-react-v1]');
    process.exit(0);
  }

  if (!getApps().length) {
    initializeApp({
      credential: applicationDefault(),
      projectId: args.projectId,
    });
  }

  const db = getFirestore();
  const auth = getAuth();

  const usersSnap = await db
    .collection('users')
    .where('email', '==', args.email)
    .limit(3)
    .get();

  if (usersSnap.empty) {
    fail('canary_user_not_found');
  }
  if (usersSnap.size !== 1) {
    fail('canary_email_not_unique', { count: usersSnap.size });
  }

  const userDoc = usersSnap.docs[0];
  const uid = userDoc.id;
  const user = userDoc.data() || {};
  const personId = text(user.canonicalPersonId);

  if (!personId) {
    fail('canonicalPersonId_missing');
  }
  if (personId === uid) {
    fail('uid_person_not_decoupled');
  }

  const authIdentityId = buildAuthIdentityId('firebase', uid);
  const roleAssignmentId = buildRoleAssignmentId(personId, args.role);

  const [
    personSnap,
    uidPersonSnap,
    authIdentitySnap,
    roleAssignmentSnap,
    roleMirrorSnap,
  ] = await Promise.all([
    db.collection('people').doc(personId).get(),
    db.collection('people').doc(uid).get(),
    db.collection('authIdentities').doc(authIdentityId).get(),
    db.collection('roleAssignments').doc(roleAssignmentId).get(),
    db.collection(args.role === 'parent' ? 'parents' : args.role === 'teacher' ? 'teachers' : args.role === 'learningPartner' ? 'learningPartners' : 'admins')
      .doc(uid)
      .get(),
  ]);

  if (!personSnap.exists) fail('canonical_person_missing');
  if (uidPersonSnap.exists) fail('erroneous_uid_keyed_person_exists');
  if (!authIdentitySnap.exists) fail('auth_identity_missing');
  if (!roleAssignmentSnap.exists) fail('role_assignment_missing');
  if (!roleMirrorSnap.exists && args.role !== 'founder') fail('compatibility_role_mirror_missing');

  const person = personSnap.data() || {};
  const authIdentity = authIdentitySnap.data() || {};
  const roleAssignment = roleAssignmentSnap.data() || {};
  const roleMirror = roleMirrorSnap.exists ? roleMirrorSnap.data() || {} : {};

  if (text(person.personId) !== personId) {
    fail('person_id_mismatch');
  }
  if (text(authIdentity.personId) !== personId) {
    fail('auth_identity_person_mismatch');
  }
  if (text(authIdentity.provider) !== 'firebase') {
    fail('auth_identity_provider_mismatch');
  }
  if (text(authIdentity.providerSubject) !== uid) {
    fail('auth_identity_subject_mismatch');
  }
  if (text(roleAssignment.personId) !== personId) {
    fail('role_assignment_person_mismatch');
  }
  if (text(roleAssignment.role) !== args.role) {
    fail('role_assignment_role_mismatch');
  }
  if (text(user.canonicalPersonId) !== personId) {
    fail('compatibility_user_person_mismatch');
  }
  if (
    roleMirrorSnap.exists &&
    text(roleMirror.canonicalPersonId) !== personId
  ) {
    fail('compatibility_role_mirror_person_mismatch');
  }

  const authUser = await auth.getUser(uid);
  const expectedDisabled = text(user.status).toLowerCase() !== 'active';
  if (Boolean(authUser.disabled) !== expectedDisabled) {
    fail('auth_disabled_state_mismatch', {
      expectedDisabled,
      actualDisabled: authUser.disabled,
    });
  }

  const result = {
    ok: true,
    projectId: args.projectId,
    role: args.role,
    status: text(user.status) || null,
    uidPersonDecoupled: true,
    erroneousUidKeyedPersonAbsent: true,
    canonicalPersonPresent: true,
    authIdentityPresent: true,
    roleAssignmentPresent: true,
    compatibilityUserPresent: true,
    compatibilityRoleMirrorPresent: args.role === 'founder' ? null : true,
    firebaseAuthStateConsistent: true,
    tokens: {
      uid: token('uid', uid),
      personId: token('person', personId),
      email: token('email', args.email),
    },
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
    details: error?.details || null,
  }, null, 2));
  process.exit(1);
});
