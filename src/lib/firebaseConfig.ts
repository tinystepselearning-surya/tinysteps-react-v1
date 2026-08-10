// src/lib/firebaseConfig.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import {
  browserLocalPersistence,
  indexedDBLocalPersistence,
  getAuth,
  connectAuthEmulator,
  initializeAuth,
  setPersistence,
  type Auth,
} from 'firebase/auth';
import { getAnalytics, type Analytics, logEvent as fbLogEvent } from 'firebase/analytics';
import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions';
import { logFirebaseAuthKeyPresence } from './nativeAuthDiagnostics';

const env = import.meta.env;

// Small helper to fail fast if env is missing
const must = (key: string, value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing/invalid env var: ${key}`);
  }
  return value;
};

// Safe string helper (prevents boolean slipping in from env typing)
const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined;

const firebaseConfig: FirebaseOptions = {
  apiKey: must('VITE_FIREBASE_API_KEY', env.VITE_FIREBASE_API_KEY),
  authDomain: must('VITE_FIREBASE_AUTH_DOMAIN', env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: must('VITE_FIREBASE_PROJECT_ID', env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: must('VITE_FIREBASE_STORAGE_BUCKET', env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: must('VITE_FIREBASE_MESSAGING_SENDER_ID', env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: must('VITE_FIREBASE_APP_ID', env.VITE_FIREBASE_APP_ID),
  measurementId: asString(env.VITE_FIREBASE_MEASUREMENT_ID), // ✅ string | undefined only
};

// Avoid duplicate initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const isNativeCapacitorRuntime = () => {
  if (typeof window === 'undefined') return false;

  const cap = (window as any).Capacitor;
  if (cap && typeof cap.isNativePlatform === 'function') {
    try {
      return Boolean(cap.isNativePlatform());
    } catch {
      // Ignore bridge/runtime errors and fall back to protocol checks.
    }
  }

  const protocol = window.location?.protocol;
  return protocol === 'capacitor:' || protocol === 'ionic:';
};

const shouldLogAuthInit = () => import.meta.env.DEV || isNativeCapacitorRuntime();

const logAuthInit = (event: string, data?: Record<string, unknown>) => {
  if (!shouldLogAuthInit()) return;
  if (data) {
    console.info(`[firebase] ${event}`, data);
    return;
  }
  console.info(`[firebase] ${event}`);
};

const createAuth = (): Auth => {
  if (!isNativeCapacitorRuntime()) {
    logAuthInit('firebase-auth:init:web');
    return getAuth(app);
  }

  try {
    const nativeAuth = initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
      ],
    });
    logAuthInit('firebase-auth:init:native-durable', {
      persistence: ['indexeddb', 'local-storage'],
    });
    return nativeAuth;
  } catch (err) {
    logAuthInit('firebase-auth:init:fallback-existing', {
      code: typeof (err as any)?.code === 'string' ? (err as any).code : undefined,
    });
    return getAuth(app);
  }
};

// Core services
const db = getFirestore(app);
const auth = createAuth();
logFirebaseAuthKeyPresence('after-auth-initialization');
export type NativeAuthPersistenceKind =
  | 'indexeddb'
  | 'local-storage'
  | 'web-default';

let nativeAuthPersistencePromise: Promise<NativeAuthPersistenceKind> | null = null;

export const ensureNativeAuthPersistence = (): Promise<NativeAuthPersistenceKind> => {
  if (!isNativeCapacitorRuntime()) return Promise.resolve('web-default');
  if (nativeAuthPersistencePromise) return nativeAuthPersistencePromise;

  console.info('[auth-persistence] configure:start');
  nativeAuthPersistencePromise = (async () => {
    try {
      await setPersistence(auth, indexedDBLocalPersistence);
      console.info('[auth-persistence] configure:success', {
        persistence: 'indexeddb',
      });
      return 'indexeddb' as const;
    } catch (indexedDbError) {
      console.warn('[auth-persistence] indexeddb:unavailable', {
        code:
          typeof (indexedDbError as { code?: unknown })?.code === 'string'
            ? (indexedDbError as { code: string }).code
            : undefined,
      });
      await setPersistence(auth, browserLocalPersistence);
      console.info('[auth-persistence] configure:success', {
        persistence: 'local-storage',
      });
      return 'local-storage' as const;
    }
  })().catch((error) => {
    nativeAuthPersistencePromise = null;
    throw error;
  });

  return nativeAuthPersistencePromise;
};

// Use env region (fallback to asia-south1) — guard against boolean
const functionsRegion = asString(env.VITE_FUNCTIONS_REGION) ?? 'asia-south1';
const functions = getFunctions(app, functionsRegion);

const envFlag = (value: unknown): boolean => String(value ?? '').trim().toLowerCase() === 'true';
const emulatorState = globalThis as typeof globalThis & {
  __tinyStepsFirebaseEmulators?: { auth: boolean; firestore: boolean; functionRegions: Set<string> };
};
const connectedEmulators = emulatorState.__tinyStepsFirebaseEmulators ?? {
  auth: false,
  firestore: false,
  functionRegions: new Set<string>(),
};
emulatorState.__tinyStepsFirebaseEmulators = connectedEmulators;

if (envFlag(env.VITE_USE_AUTH_EMULATOR) && !connectedEmulators.auth) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectedEmulators.auth = true;
}
if (envFlag(env.VITE_USE_FIRESTORE_EMULATOR) && !connectedEmulators.firestore) {
  connectFirestoreEmulator(db, '127.0.0.1', 8085);
  connectedEmulators.firestore = true;
}
if (envFlag(env.VITE_USE_FUNCTIONS_EMULATOR) && !connectedEmulators.functionRegions.has(functionsRegion)) {
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  connectedEmulators.functionRegions.add(functionsRegion);
}

export const getRegionalFunctions = (region: string): Functions => {
  const client = getFunctions(app, region);
  if (envFlag(env.VITE_USE_FUNCTIONS_EMULATOR) && !connectedEmulators.functionRegions.has(region)) {
    connectFunctionsEmulator(client, '127.0.0.1', 5001);
    connectedEmulators.functionRegions.add(region);
  }
  return client;
};

// Analytics (browser only)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch {
    analytics = null;
  }
}

export function logCustomEvent(eventName: string, data?: Record<string, unknown>) {
  if (!analytics) return;
  try {
    fbLogEvent(analytics, eventName, data || {});
  } catch {
    // ignore
  }
}

export { app, db, auth, analytics, functions };
