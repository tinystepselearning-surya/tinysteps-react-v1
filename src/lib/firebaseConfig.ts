// Import the Firebase modules that you need in your app
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZ5h2M3hataZjWM7480e76QAiFmEVK37Y",
  authDomain: "tinysteps-react-v1.firebaseapp.com",
  projectId: "tinysteps-react-v1",
  storageBucket: "tinysteps-react-v1.firebasestorage.app",
  messagingSenderId: "31484691215",
  appId: "1:31484691215:web:2e8854696bc7e27b63347a",
  measurementId: "G-5RMQVF1HGD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore, Auth, and Analytics
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// Initialize Firebase Functions with specific region
const functions = getFunctions(app, 'asia-south1');

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  import('firebase/firestore').then(({ connectFirestoreEmulator }) => {
    connectFirestoreEmulator(db, 'localhost', 8080);
  });
  import('firebase/auth').then(({ connectAuthEmulator }) => {
    connectAuthEmulator(auth, 'http://localhost:9099');
  });
  import('firebase/functions').then(({ connectFunctionsEmulator }) => {
    connectFunctionsEmulator(functions, 'localhost', 5001);
  });
}

export { app, db, auth, analytics, functions };