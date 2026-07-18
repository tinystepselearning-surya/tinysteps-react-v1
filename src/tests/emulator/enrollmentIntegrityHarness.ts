import * as admin from 'firebase-admin';
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  signInWithEmailAndPassword,
  type Auth,
} from 'firebase/auth';
import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable,
  type Functions,
} from 'firebase/functions';
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';

export const EMULATOR_PROJECT_ID = 'tinysteps-react-v1';
const FIRESTORE_HOST = '127.0.0.1:8085';
const AUTH_HOST = '127.0.0.1:9099';
const FUNCTIONS_HOST = '127.0.0.1:5001';
const REGION = 'asia-south1';

function requireExactEmulatorHost(name: string, expected: string): void {
  const actual = process.env[name];
  if (actual !== expected) {
    throw new Error(`${name}=${expected} is required for this emulator suite; received ${actual || 'unset'}.`);
  }
}

requireExactEmulatorHost('FIRESTORE_EMULATOR_HOST', FIRESTORE_HOST);
requireExactEmulatorHost('FIREBASE_AUTH_EMULATOR_HOST', AUTH_HOST);
requireExactEmulatorHost('FUNCTIONS_EMULATOR_HOST', FUNCTIONS_HOST);
if (process.env.GCLOUD_PROJECT && process.env.GCLOUD_PROJECT !== EMULATOR_PROJECT_ID) {
  throw new Error(`Unexpected GCLOUD_PROJECT: ${process.env.GCLOUD_PROJECT}`);
}

const adminApp = admin.apps.find((app) => app?.name === 'enrollment-integrity-emulator') ||
  admin.initializeApp({ projectId: EMULATOR_PROJECT_ID }, 'enrollment-integrity-emulator');

export const adminDb = adminApp.firestore();
export const adminAuth = adminApp.auth();

let clientApp: FirebaseApp | null = null;
let clientAuth: Auth | null = null;
let clientFirestore: Firestore | null = null;
let clientFunctions: Functions | null = null;

export async function clearEmulatorState(): Promise<void> {
  const firestoreResponse = await fetch(
    `http://${FIRESTORE_HOST}/emulator/v1/projects/${EMULATOR_PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' },
  );
  if (!firestoreResponse.ok) {
    throw new Error(`Failed to clear Firestore Emulator: ${firestoreResponse.status} ${await firestoreResponse.text()}`);
  }
  const authResponse = await fetch(
    `http://${AUTH_HOST}/emulator/v1/projects/${EMULATOR_PROJECT_ID}/accounts`,
    { method: 'DELETE' },
  );
  if (!authResponse.ok) {
    throw new Error(`Failed to clear Auth Emulator: ${authResponse.status} ${await authResponse.text()}`);
  }
}

export async function initializeAdminClient(): Promise<void> {
  if (clientApp) await deleteApp(clientApp);
  clientApp = initializeApp({
    apiKey: 'emulator-only-api-key',
    authDomain: '127.0.0.1',
    projectId: EMULATOR_PROJECT_ID,
    appId: 'emulator-enrollment-integrity',
  }, `enrollment-integrity-${Date.now()}`);
  clientAuth = getAuth(clientApp);
  connectAuthEmulator(clientAuth, `http://${AUTH_HOST}`, { disableWarnings: true });
  clientFirestore = getFirestore(clientApp);
  connectFirestoreEmulator(clientFirestore, '127.0.0.1', 8085);
  clientFunctions = getFunctions(clientApp, REGION);
  connectFunctionsEmulator(clientFunctions, '127.0.0.1', 5001);

  const uid = 'integrity-admin';
  const email = 'integrity-admin@example.test';
  const password = 'EmulatorOnly!123';
  await adminAuth.createUser({ uid, email, password, displayName: 'Integrity Admin' });
  await adminAuth.setCustomUserClaims(uid, { role: 'admin', admin: true });
  await adminDb.collection('users').doc(uid).set({ role: 'admin', email });
  const credential = await signInWithEmailAndPassword(clientAuth, email, password);
  await credential.user.getIdToken(true);
}

export async function disposeHarness(): Promise<void> {
  if (clientApp) await deleteApp(clientApp);
  clientApp = null;
  clientAuth = null;
  clientFirestore = null;
  clientFunctions = null;
  await adminApp.delete();
}

export async function callFunction<TInput extends Record<string, unknown>, TOutput = Record<string, unknown>>(
  name: string,
  data: TInput,
): Promise<TOutput> {
  if (!clientFunctions || !clientAuth?.currentUser) {
    throw new Error('Authenticated emulator client has not been initialized.');
  }
  const callable = httpsCallable<TInput, TOutput>(clientFunctions, name);
  const result = await callable(data);
  return result.data;
}

export async function seedCanonicalFixtures(prefix: string): Promise<{
  kidId: string;
  parentId: string;
  teacherAId: string;
  teacherBId: string;
  foundationsCourseId: string;
  earlyCourseId: string;
  phonicsCourseId: string;
  grammarCourseId: string;
}> {
  const ids = {
    kidId: `${prefix}-kid`,
    parentId: `${prefix}-parent`,
    teacherAId: `${prefix}-teacher-a`,
    teacherBId: `${prefix}-teacher-b`,
    foundationsCourseId: `${prefix}-foundations`,
    earlyCourseId: `${prefix}-early-phonics`,
    phonicsCourseId: `${prefix}-phonics`,
    grammarCourseId: `${prefix}-grammar`,
  };
  const batch = adminDb.batch();
  batch.set(adminDb.collection('users').doc(ids.parentId), { role: 'parent', name: 'Parent Fixture' });
  batch.set(adminDb.collection('users').doc(ids.teacherAId), { role: 'teacher', name: 'Teacher A' });
  batch.set(adminDb.collection('users').doc(ids.teacherBId), { role: 'teacher', name: 'Teacher B' });
  batch.set(adminDb.collection('kids').doc(ids.kidId), {
    fullName: 'Child Fixture',
    parentId: ids.parentId,
    parentIds: [ids.parentId],
    primaryParentId: ids.parentId,
    status: 'active',
  });
  [
    [ids.foundationsCourseId, 'Foundations'],
    [ids.earlyCourseId, 'Early Phonics'],
    [ids.phonicsCourseId, 'Phonics'],
    [ids.grammarCourseId, 'Grammar'],
  ].forEach(([id, title]) => {
    batch.set(adminDb.collection('courses').doc(id), {
      title,
      name: title,
      status: 'active',
      ratePerSession: 500,
    });
  });
  await batch.commit();
  return ids;
}

export async function waitForDocument(
  collectionName: string,
  documentId: string,
  predicate: (data: Record<string, unknown>) => boolean = () => true,
  timeoutMs = 20_000,
): Promise<Record<string, unknown>> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const snapshot = await adminDb.collection(collectionName).doc(documentId).get();
    const data = snapshot.data() as Record<string, unknown> | undefined;
    if (snapshot.exists && data && predicate(data)) return data;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${collectionName}/${documentId}`);
}

export function expectCallableErrorCode(error: unknown, code: string): void {
  const actual = String((error as { code?: unknown })?.code || '');
  if (actual !== `functions/${code}` && actual !== code) {
    throw new Error(`Expected callable error ${code}, received ${actual}: ${String((error as Error)?.message || error)}`);
  }
}
