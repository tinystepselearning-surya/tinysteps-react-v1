/**
 * Admin User Setup Script
 * 
 * This script helps create the first admin user in the system.
 * Run this ONCE in the browser console after deploying the app.
 * 
 * Prerequisites:
 * 1. Firebase project configured
 * 2. Firestore rules deployed
 * 3. You're on the app page (localhost:5173 or tinystepslearning.com)
 */

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export async function createFirstAdmin() {
  const ADMIN_EMAIL = "admin@tinysteps.com";
  const ADMIN_PASSWORD = "AdminPass2024!"; // CHANGE THIS!
  const ADMIN_NAME = "Super Admin";

  console.log("🚀 Creating first admin user...");
  console.log("📧 Email:", ADMIN_EMAIL);
  console.log("⚠️  IMPORTANT: Change the password after first login!");

  try {
    // Step 1: Create Firebase Auth user
    console.log("\n1️⃣ Creating authentication user...");
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      ADMIN_EMAIL,
      ADMIN_PASSWORD
    );
    const user = userCredential.user;
    console.log("✅ Auth user created with UID:", user.uid);

    // Step 2: Create Firestore user document
    console.log("\n2️⃣ Creating Firestore document...");
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: ADMIN_EMAIL,
      displayName: ADMIN_NAME,
      role: "admin",
      createdAt: new Date(),
      status: "active",
    });
    console.log("✅ Firestore document created");

    // Success!
    console.log("\n✅ SUCCESS! Admin user created");
    console.log("\n📋 Admin Credentials:");
    console.log("   Email:", ADMIN_EMAIL);
    console.log("   Password:", ADMIN_PASSWORD);
    console.log("\n🔗 Login URL:");
    console.log("   Development: http://localhost:5173/surya");
    console.log("   Production: https://tinystepslearning.com/surya");
    console.log("\n⚠️  NEXT STEPS:");
    console.log("   1. Save these credentials securely");
    console.log("   2. Login to the admin portal");
    console.log("   3. Change the password immediately");
    console.log("   4. Delete this script or change the password");

    return {
      success: true,
      uid: user.uid,
      email: ADMIN_EMAIL,
    };
  } catch (error: any) {
    console.error("\n❌ ERROR:", error.message);
    
    if (error.code === "auth/email-already-in-use") {
      console.log("\n💡 This email is already registered.");
      console.log("   Either:");
      console.log("   1. Login with existing credentials");
      console.log("   2. Delete the user from Firebase Console");
      console.log("   3. Use a different email");
    } else if (error.code === "auth/weak-password") {
      console.log("\n💡 Password is too weak.");
      console.log("   Use a stronger password (min 6 characters)");
    } else if (error.code === "permission-denied") {
      console.log("\n💡 Firestore permission denied.");
      console.log("   Make sure you've deployed security rules:");
      console.log("   firebase deploy --only firestore:rules");
    }

    return {
      success: false,
      error: error.message,
    };
  }
}

// Browser-friendly version
// Copy and paste this in browser console:
/*

async function createFirstAdmin() {
  const ADMIN_EMAIL = "admin@tinysteps.com";
  const ADMIN_PASSWORD = "AdminPass2024!"; // CHANGE THIS!
  const ADMIN_NAME = "Super Admin";

  console.log("🚀 Creating first admin user...");

  try {
    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    const { doc, setDoc } = await import('firebase/firestore');
    const { auth, db } = await import('./firebase');

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      ADMIN_EMAIL,
      ADMIN_PASSWORD
    );
    const user = userCredential.user;
    console.log("✅ Auth user created with UID:", user.uid);

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: ADMIN_EMAIL,
      displayName: ADMIN_NAME,
      role: "admin",
      createdAt: new Date(),
      status: "active",
    });
    console.log("✅ Firestore document created");
    console.log("\n✅ SUCCESS! Admin user created");
    console.log("📧 Email:", ADMIN_EMAIL);
    console.log("🔑 Password:", ADMIN_PASSWORD);
    console.log("🔗 Login: http://localhost:5173/surya");

    return { success: true, uid: user.uid };
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    return { success: false, error: error.message };
  }
}

// Run it
createFirstAdmin();

*/
