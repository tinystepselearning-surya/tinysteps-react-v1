import { db } from "../firebase";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import type { Teacher } from "../types/teacher";
import type { Student } from "../types/student";

/**
 * Add an attendance record for a student
 */
export async function addAttendanceRecord(studentId: string, date: string, status: "present" | "absent" | "excused", minutesAttended?: number) {
  try {
    const attendanceRef = collection(db, "students", studentId, "attendance");
    const res = await addDoc(attendanceRef, {
      date,
      status,
      minutesAttended: minutesAttended || 0,
      createdBy: "teacher",
      createdAt: serverTimestamp(),
      updatedBy: "teacher",
      updatedAt: serverTimestamp(),
    });
    return res.id;
  } catch (err) {
    console.error("Error adding attendance record:", err);
    throw err;
  }
}

/**
 * Update or create a curriculum topic document under students/{sid}/curriculum/{topicId}
 */
export async function updateCurriculumTopic(studentId: string, topicId: string, payload: { status?: string; teacherNote?: string; completedDate?: string }) {
  try {
    const topicRef = doc(db, "students", studentId, "curriculum", topicId);
    await setDoc(topicRef, {
      ...payload,
      updatedAt: serverTimestamp(),
      updatedBy: "teacher",
    }, { merge: true });
    return true;
  } catch (err) {
    console.error("Error updating curriculum topic:", err);
    throw err;
  }
}

/**
 * Seed sample attendance and curriculum entries for a student (for teacher testing)
 */
export async function seedSampleData(studentId: string) {
  try {
    // sample attendance for last 5 days
    const today = new Date();
    for (let i = 1; i <= 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      await addAttendanceRecord(studentId, dateKey, i % 5 === 0 ? "absent" : "present", 45);
    }

    // sample curriculum topics - minimal set
    const sampleTopics = [
      { id: "phonics-a2z", title: "Jolly Phonics order", status: "in_progress" },
      { id: "phonics-short-vowels", title: "Short vowel sounds", status: "not_started" },
      { id: "grammar-nouns", title: "Nouns", status: "in_progress" },
    ];
    for (const t of sampleTopics) {
      await updateCurriculumTopic(studentId, t.id, { status: t.status, teacherNote: `Seeded: ${t.title}` });
    }

    return true;
  } catch (err) {
    console.error("Error seeding sample data:", err);
    throw err;
  }
}

/**
 * Get teacher document by userId
 */
export async function getTeacher(userId: string): Promise<Teacher | null> {
  try {
    const teacherDoc = await getDoc(doc(db, "teachers", userId));
    if (!teacherDoc.exists()) {
      return null;
    }
    return {
      id: teacherDoc.id,
      ...teacherDoc.data(),
    } as Teacher;
  } catch (error) {
    console.error("Error fetching teacher:", error);
    throw error;
  }
}

/**
 * Get all students assigned to a teacher
 */
export async function getTeacherStudents(teacherId: string): Promise<Student[]> {
  try {
    const studentsRef = collection(db, "students");
    const q = query(
      studentsRef,
      where("assignedTeacherId", "==", teacherId),
      where("status", "==", "active"),
      orderBy("displayName", "asc")
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Student[];
  } catch (error) {
    console.error("Error fetching teacher students:", error);
    throw error;
  }
}

/**
 * Get teacher's earnings for a specific month
 */
export async function getTeacherEarnings(teacherId: string, month: string) {
  try {
    const earningsDoc = await getDoc(
      doc(db, "teachers", teacherId, "earnings", month)
    );
    
    if (!earningsDoc.exists()) {
      return null;
    }

    return {
      id: earningsDoc.id,
      ...earningsDoc.data(),
    };
  } catch (error) {
    console.error("Error fetching teacher earnings:", error);
    throw error;
  }
}

/**
 * Get count of teacher's active students
 */
export async function getTeacherStudentCount(teacherId: string): Promise<number> {
  try {
    const students = await getTeacherStudents(teacherId);
    return students.length;
  } catch (error) {
    console.error("Error counting teacher students:", error);
    return 0;
  }
}
