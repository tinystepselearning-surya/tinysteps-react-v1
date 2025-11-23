// src/lib/firebaseConfig.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import {
  getAuth,
  connectAuthEmulator,
} from 'firebase/auth';
import {
  getAnalytics,
  Analytics,
  logEvent as fbLogEvent,
} from 'firebase/analytics';
import {
  getFunctions,
  connectFunctionsEmulator,
} from 'firebase/functions';

// ---- Core Firebase config (same as before) ----
const firebaseConfig = {
  apiKey: 'AIzaSyBZ5h2M3hataZjWM7480e76QAiFmEVK37Y',
  authDomain: 'tinysteps-react-v1.firebaseapp.com',
  projectId: 'tinysteps-react-v1',
  storageBucket: 'tinysteps-react-v1.firebasestorage.app',
  messagingSenderId: '31484691215',
  appId: '1:31484691215:web:2e8854696bc7e27b63347a',
  measurementId: 'G-5RMQVF1HGD',
};

// ---- Initialize app (avoid duplicate init) ----
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ---- Core services ----
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app, 'asia-south1');

// ---- Analytics (browser only, safe) ----
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn(
      'Firebase Analytics not initialized:',
      (error as Error).message,
    );
    analytics = null;
  }
}

// ---- Optional: custom analytics helper ----
export function logCustomEvent(
  eventName: string,
  data?: Record<string, unknown>,
) {
  if (!analytics) return;
  try {
    fbLogEvent(analytics, eventName, data || {});
  } catch {
    // ignore analytics errors
  }
}

// ---- Emulator toggles (DEV-only) ----
const isDev = Boolean(import.meta.env?.DEV);
const emulatorHost =
  String(import.meta.env?.VITE_FIREBASE_EMULATOR_HOST || '127.0.0.1');
const authPort = Number(
  import.meta.env?.VITE_FIREBASE_AUTH_EMULATOR_PORT || '9099',
);
const firestorePort = Number(
  import.meta.env?.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT || '8085',
);
const functionsPort = Number(
  import.meta.env?.VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT || '5001',
);

const shouldUseFirestoreEmulator =
  isDev && import.meta.env?.VITE_USE_FIRESTORE_EMULATOR === 'true';
const shouldUseAuthEmulator =
  isDev && import.meta.env?.VITE_USE_AUTH_EMULATOR === 'true';
const shouldUseFunctionsEmulator =
  isDev && import.meta.env?.VITE_USE_FUNCTIONS_EMULATOR === 'true';

// 🔴 If you DON’T want emulators right now, set those env vars to 'false' or remove them.
if (shouldUseFirestoreEmulator) {
  try {
    connectFirestoreEmulator(db, emulatorHost, firestorePort);
  } catch (error) {
    console.warn('Firestore emulator connection failed', error);
  }
}

if (shouldUseAuthEmulator) {
  try {
    connectAuthEmulator(auth, `http://${emulatorHost}:${authPort}`);
  } catch (error) {
    console.warn('Auth emulator connection failed', error);
  }
}

if (shouldUseFunctionsEmulator) {
  try {
    connectFunctionsEmulator(functions, emulatorHost, functionsPort);
  } catch (error) {
    console.warn('Functions emulator connection failed', error);
  }
}

export { app, db, auth, analytics, functions };
