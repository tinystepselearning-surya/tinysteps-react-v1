#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = 'tinysteps-react-v1';
const email = 'testparent1@tinysteps.com';
const displayName = 'testparent1';

function token(ns, value) {
  return createHash('sha256')
    .update(`${ns}\u001f${String(value || '')}`, 'utf8')
    .digest('hex')
    .slice(0, 12);
}
function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

if (!getApps().length) {
  initializeApp({ credential: applicationDefault(), projectId });
}
const db = getFirestore();
const auth = getAuth();

const [emailSnap, displaySnap, nameSnap] = await Promise.all([
  db.collection('users').where('email', '==', email).limit(5).get(),
  db.collection('users').where('displayName', '==', displayName).limit(5).get(),
  db.collection('users').where('name', '==', displayName).limit(5).get(),
]);

let authState = { found: false };
try {
  const authUser = await auth.getUserByEmail(email);
  authState = {
    found: true,
    uidToken: token('uid', authUser.uid),
    disabled: Boolean(authUser.disabled),
    displayNameMatches: text(authUser.displayName) === displayName,
  };
} catch (error) {
  if (error?.code !== 'auth/user-not-found') throw error;
}

const merged = new Map();
for (const snap of [emailSnap, displaySnap, nameSnap]) {
  for (const doc of snap.docs) {
    const data = doc.data() || {};
    merged.set(doc.id, {
      uidToken: token('uid', doc.id),
      emailToken: token('email', text(data.email).toLowerCase()),
      displayName: text(data.displayName || data.name) || null,
      status: text(data.status) || null,
      role: text(data.role || data.rawRole) || null,
      hasCanonicalPersonId: Boolean(text(data.canonicalPersonId)),
      canonicalPersonToken: text(data.canonicalPersonId)
        ? token('person', text(data.canonicalPersonId))
        : null,
      exactEmailMatch: text(data.email).toLowerCase() === email,
      exactDisplayNameMatch:
        text(data.displayName || data.name) === displayName,
    });
  }
}

console.log(JSON.stringify({
  ok: true,
  exactEmailFirestoreMatches: emailSnap.size,
  exactDisplayNameFirestoreMatches: displaySnap.size,
  exactNameFirestoreMatches: nameSnap.size,
  authExactEmail: authState,
  candidateUsers: [...merged.values()],
}, null, 2));
