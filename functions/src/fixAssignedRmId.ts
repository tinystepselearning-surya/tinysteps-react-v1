import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, applicationDefault } from "firebase-admin/app";

initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function fixAssignedRmId() {
  try {
    console.log("Starting to fix assignedRmId for students and teachers...");

    // Fetch all students with missing or incorrect assignedRmId
    const studentsSnapshot = await db
      .collection("students")
      .where("status", "==", "active")
      .get();

    const studentUpdates: Promise<FirebaseFirestore.WriteResult>[] = [];

    studentsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.assignedRmId && data.learningPartnerId) {
        studentUpdates.push(
          db.collection("students").doc(doc.id).update({
            assignedRmId: data.learningPartnerId,
          })
        );
      }
    });

    // Fetch all teachers with missing or incorrect assignedRmId
    const teachersSnapshot = await db
      .collection("teachers")
      .where("status", "==", "active")
      .get();

    const teacherUpdates: Promise<FirebaseFirestore.WriteResult>[] = [];

    teachersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.assignedRmId && data.learningPartnerId) {
        teacherUpdates.push(
          db.collection("teachers").doc(doc.id).update({
            assignedRmId: data.learningPartnerId,
          })
        );
      }
    });

    // Execute all updates
    await Promise.all([...studentUpdates, ...teacherUpdates]);

    console.log("Successfully fixed assignedRmId for students and teachers.");
  } catch (error) {
    console.error("Error fixing assignedRmId:", error);
  }
}

fixAssignedRmId();