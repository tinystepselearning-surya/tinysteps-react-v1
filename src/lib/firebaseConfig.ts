// src/lib/firebaseConfig.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, type Analytics, logEvent as fbLogEvent } from 'firebase/analytics';
import { getFunctions } from 'firebase/functions';

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

// Core services
const db = getFirestore(app);
const auth = getAuth(app);

// Use env region (fallback to asia-south1) — guard against boolean
const functionsRegion = asString(env.VITE_FUNCTIONS_REGION) ?? 'asia-south1';
const functions = getFunctions(app, functionsRegion);

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
