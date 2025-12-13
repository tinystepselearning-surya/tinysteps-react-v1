// src/lib/firebaseConfig.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  getAnalytics,
  Analytics,
  logEvent as fbLogEvent,
} from 'firebase/analytics';
import { getFunctions } from 'firebase/functions';

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

// ---- Emulator connections disabled for frontend builds ----
// Emulator helpers intentionally removed to prevent accidental local connections
// If you need them in development, re-enable by adding environment-based guards.

export { app, db, auth, analytics, functions };
