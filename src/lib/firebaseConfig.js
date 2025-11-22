var _a, _b, _c, _d, _e, _f, _g, _h;
// Import the Firebase modules that you need in your app
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
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
let analytics = null;
if (typeof window !== 'undefined') {
    try {
        analytics = getAnalytics(app);
    }
    catch (error) {
        // Analytics is optional; ignore initialization errors (SSR/tests)
        analytics = null;
        console.warn('Firebase Analytics not initialized:', error.message);
    }
}
// Initialize Firebase Functions with specific region
const functions = getFunctions(app, 'asia-south1');
const isDev = Boolean((_a = import.meta.env) === null || _a === void 0 ? void 0 : _a.DEV);
const emulatorHost = String(((_b = import.meta.env) === null || _b === void 0 ? void 0 : _b.VITE_FIREBASE_EMULATOR_HOST) || '127.0.0.1');
const authPort = Number(((_c = import.meta.env) === null || _c === void 0 ? void 0 : _c.VITE_FIREBASE_AUTH_EMULATOR_PORT) || '9099');
const firestorePort = Number(((_d = import.meta.env) === null || _d === void 0 ? void 0 : _d.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT) || '8085');
const functionsPort = Number(((_e = import.meta.env) === null || _e === void 0 ? void 0 : _e.VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT) || '5001');
const shouldUseFirestoreEmulator = isDev && ((_f = import.meta.env) === null || _f === void 0 ? void 0 : _f.VITE_USE_FIRESTORE_EMULATOR) === 'true';
const shouldUseAuthEmulator = isDev && ((_g = import.meta.env) === null || _g === void 0 ? void 0 : _g.VITE_USE_AUTH_EMULATOR) === 'true';
const shouldUseFunctionsEmulator = isDev && ((_h = import.meta.env) === null || _h === void 0 ? void 0 : _h.VITE_USE_FUNCTIONS_EMULATOR) === 'true';
if (shouldUseFirestoreEmulator) {
    try {
        connectFirestoreEmulator(db, emulatorHost, firestorePort);
    }
    catch (error) {
        console.warn('Firestore emulator connection failed', error);
    }
}
if (shouldUseAuthEmulator) {
    try {
        connectAuthEmulator(auth, `http://${emulatorHost}:${authPort}`);
    }
    catch (error) {
        console.warn('Auth emulator connection failed', error);
    }
}
if (shouldUseFunctionsEmulator) {
    try {
        connectFunctionsEmulator(functions, emulatorHost, functionsPort);
    }
    catch (error) {
        console.warn('Functions emulator connection failed', error);
    }
}
export { app, db, auth, analytics, functions };
