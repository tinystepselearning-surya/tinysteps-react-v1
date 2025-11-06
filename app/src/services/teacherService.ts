import { db } from "../firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  query,
  where,
  orderBy
} from "firebase/firestore";
import type { Teacher } from "../types/teacher";
import type { Student } from "../types/student";

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
