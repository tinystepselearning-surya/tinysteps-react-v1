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
const appCheckSiteKey = import.meta.env.VITE_APPCHECK_KEY;

export const app = initializeApp(firebaseConfig);

function ensureRecaptchaScript() {
  if (!appCheckSiteKey) return;
  const src = `https://www.google.com/recaptcha/api.js?render=${appCheckSiteKey}`;
  const existing = document.querySelector(`script[src="${src}"]`);
  if (!existing) {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    document.head.appendChild(script);
  }
}

if (typeof window !== "undefined") {
  if (appCheckSiteKey) {
    ensureRecaptchaScript();
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } else {
    console.warn("VITE_APPCHECK_KEY is not set. App Check will not initialize.");
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "asia-south1");
