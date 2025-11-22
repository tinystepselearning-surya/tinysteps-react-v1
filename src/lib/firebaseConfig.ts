// Import the Firebase modules that you need in your app
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBZ5h2M3hataZjWM7480e76QAiFmEVK37Y',
  authDomain: 'tinysteps-react-v1.firebaseapp.com',
  projectId: 'tinysteps-react-v1',
  storageBucket: 'tinysteps-react-v1.firebasestorage.app',
  messagingSenderId: '31484691215',
  appId: '1:31484691215:web:2e8854696bc7e27b63347a',
  measurementId: 'G-5RMQVF1HGD',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize Analytics only in supported browser environments
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    // Analytics is optional; ignore initialization errors (SSR/tests)
    analytics = null;
    console.warn('Firebase Analytics not initialized:', (error as Error).message);
  }
}

// Initialize Firebase Functions with specific region
const functions = getFunctions(app, 'asia-south1');

const isDev = Boolean(import.meta.env?.DEV);
const emulatorHost = String(import.meta.env?.VITE_FIREBASE_EMULATOR_HOST || '127.0.0.1');
const authPort = Number(import.meta.env?.VITE_FIREBASE_AUTH_EMULATOR_PORT || '9099');
const firestorePort = Number(import.meta.env?.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT || '8085');
const functionsPort = Number(import.meta.env?.VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT || '5001');
const shouldUseFirestoreEmulator = isDev && import.meta.env?.VITE_USE_FIRESTORE_EMULATOR === 'true';
const shouldUseAuthEmulator = isDev && import.meta.env?.VITE_USE_AUTH_EMULATOR === 'true';
const shouldUseFunctionsEmulator = isDev && import.meta.env?.VITE_USE_FUNCTIONS_EMULATOR === 'true';

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
