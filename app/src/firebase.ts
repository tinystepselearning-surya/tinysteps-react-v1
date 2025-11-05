import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBZ5h2M3hataZjWM7480e76QAiFmEVK37Y",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tinysteps-react-v1.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tinysteps-react-v1",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:31484691215:web:2e8854696bc7e27b63347a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tinysteps-react-v1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "31484691215",
};

export const app = initializeApp(firebaseConfig);

// DEV ONLY: allow localhost through App Check
if (import.meta.env.DEV) {
  // @ts-ignore
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

if (typeof window !== "undefined") {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(
      import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY || "debug"
    ),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "asia-south1");

/**
 * Force-refresh admin claims after login.
 * Call this before admin pages do Firestore calls to ensure custom claims are loaded.
 */
export async function ensureAdminReady() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn("ensureAdminReady: No user logged in");
    return;
  }
  
  // Refresh token to get latest custom claims
  await currentUser.getIdToken(true);
  
  // Inspect claims
  const tokenResult = await currentUser.getIdTokenResult();
  console.log("User claims:", tokenResult.claims);
  
  if (tokenResult.claims.role !== "admin") {
    console.warn("User does not have admin role:", tokenResult.claims.role);
  }
  
  return tokenResult.claims;
}
