// Import the Firebase Admin SDK
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK using Application Default Credentials.
// Provide GOOGLE_APPLICATION_CREDENTIALS when running locally.
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * The `upsertUser` function is used to create or update a user document in Firestore.
 * It ensures that the user data is consistent and adheres to the required schema.
 *
 * @param {string} uid - The unique identifier for the user (Firebase Auth UID).
 * @param {Object} data - The user data to be upserted.
 * @param {string} data.name - The name of the user.
 * @param {string} data.email - The email address of the user.
 * @param {"parent" | "teacher" | "admin"} data.role - The role of the user (e.g., parent, teacher, admin).
 * @param {string[]} [data.childIds] - Optional array of child IDs associated with the user (for parents).
 *
 * The function performs the following steps:
 * 1. Validates the input data.
 * 2. Checks if the user document already exists in Firestore.
 * 3. Creates a new document or updates the existing one with the provided data.
 * 4. Logs the operation result for debugging purposes.
 *
 * Example usage:
 * ```javascript
 * await upsertUser("test-uid-123", {
 *   name: "Test Parent",
 *   email: "parent@example.com",
 *   role: "parent",
 *   childIds: ["kid-1", "kid-2"]
 * });
 * ```
 */
async function upsertUser(
  uid: string,
  data: {
    name: string;
    email: string;
    role: "parent" | "teacher" | "admin";
    childIds?: string[];
  }
) {
  // Validate input data
  if (!uid || !data) {
    throw new Error("UID and data are required");
  }
  if (!data.name || !data.email || !data.role) {
    throw new Error("Name, email, and role are required");
  }
  if (!["parent", "teacher", "admin"].includes(data.role)) {
    throw new Error("Invalid role");
  }
  if (data.childIds && !Array.isArray(data.childIds)) {
    throw new Error("childIds must be an array");
  }

  // Check if the user document already exists
  const userDoc = await db.doc(`users/${uid}`).get();
  if (userDoc.exists) {
    console.log(`User with UID ${uid} already exists.`);
    // Update the existing document
    await db.doc(`users/${uid}`).update(data);
    console.log(`User with UID ${uid} updated.`);
  } else {
    // Create a new document
    await db.doc(`users/${uid}`).set(data);
    console.log(`User with UID ${uid} created.`);
  }
}

async function testUpsertUser() {
  const testCases = [
    {
      uid: "test-uid-123",
      data: {
        name: "Test Parent",
        email: "parent@example.com",
        role: "parent" as "parent",
        childIds: ["kid-1", "kid-2"],
      },
    },
    {
      uid: "test-uid-456",
      data: {
        name: "Test Teacher",
        email: "teacher@example.com",
        role: "teacher" as "teacher",
        childIds: [],
      },
    },
    {
      uid: "test-uid-789",
      data: {
        name: "Test Admin",
        email: "admin@example.com",
        role: "admin" as "admin",
        childIds: [],
      },
    },
    {
      uid: "test-uid-invalid",
      data: {
        name: "Invalid Role",
        email: "invalid@example.com",
        role: "invalid" as any, // Invalid role for testing
        childIds: [],
      },
    },
  ];

  for (const testCase of testCases) {
    try {
      console.log(`Testing upsertUser with UID: ${testCase.uid}`);
      await upsertUser(testCase.uid, testCase.data);
      console.log(`Success: User with UID ${testCase.uid} upserted.`);
    } catch (error) {
      console.error(`Error for UID ${testCase.uid}:`, error);
    }
  }
}

// Run the test
testUpsertUser();
