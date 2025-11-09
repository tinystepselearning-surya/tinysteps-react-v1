// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent as fbLogEvent } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBZ5h2M3hataZjWM7480e76QAiFmEVK37Y",
  authDomain: "tinysteps-react-v1.firebaseapp.com",
  projectId: "tinysteps-react-v1",
  storageBucket: "tinysteps-react-v1.firebasestorage.app",
  messagingSenderId: "31484691215",
  appId: "1:31484691215:web:2e8854696bc7e27b63347a",
  measurementId: "G-5RMQVF1HGD",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics: ReturnType<typeof getAnalytics> | null = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  // Analytics may fail to initialize in non-browser environments
  analytics = null as any;
}

export function logCustomEvent(eventName: string, data?: any) {
  if (!analytics) return;
  try {
    fbLogEvent(analytics, eventName, data || {});
  } catch (e) {
    // ignore analytics errors
  }
}

export { app, analytics };