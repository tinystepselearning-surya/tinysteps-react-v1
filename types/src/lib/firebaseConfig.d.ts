import { Analytics } from 'firebase/analytics';
declare const app: import("@firebase/app").FirebaseApp;
declare const db: import("@firebase/firestore").Firestore;
declare const auth: import("firebase/auth").Auth;
declare const functions: import("@firebase/functions").Functions;
declare let analytics: Analytics | null;
export declare function logCustomEvent(eventName: string, data?: Record<string, unknown>): void;
export { app, db, auth, analytics, functions };
