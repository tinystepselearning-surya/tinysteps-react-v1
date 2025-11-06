import { db } from "../firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import type { Student, Session, AttendanceRecord, ProgressRecord } from "../types/student";

/**
 * Get student document by ID
 */
export async function getStudent(studentId: string): Promise<Student | null> {
  try {
    const studentDoc = await getDoc(doc(db, "students", studentId));
    if (!studentDoc.exists()) {
      return null;
    }
    return {
      id: studentDoc.id,
      ...studentDoc.data(),
    } as Student;
  } catch (error) {
    console.error("Error fetching student:", error);
    throw error;
  }
}

/**
 * Get next scheduled session for a student
 */
export async function getNextSession(studentId: string): Promise<Session | null> {
  try {
    const sessionsRef = collection(db, "sessions");
    const now = new Date();
    
    const q = query(
      sessionsRef,
      where("studentId", "==", studentId),
      where("status", "==", "scheduled"),
      where("scheduledAt", ">=", now),
      orderBy("scheduledAt", "asc"),
      limit(1)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const sessionDoc = snapshot.docs[0];
    return {
      id: sessionDoc.id,
      ...sessionDoc.data(),
    } as Session;
  } catch (error) {
    console.error("Error fetching next session:", error);
    throw error;
  }
}

/**
 * Get upcoming sessions for a student (next 5)
 */
export async function getUpcomingSessions(studentId: string, limitCount = 5): Promise<Session[]> {
  try {
    const sessionsRef = collection(db, "sessions");
    const now = new Date();
    
    const q = query(
      sessionsRef,
      where("studentId", "==", studentId),
      where("status", "==", "scheduled"),
      where("scheduledAt", ">=", now),
      orderBy("scheduledAt", "asc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Session[];
  } catch (error) {
    console.error("Error fetching upcoming sessions:", error);
    throw error;
  }
}

/**
 * Get attendance records for a student (last 30 days)
 */
export async function getRecentAttendance(studentId: string, days = 30): Promise<AttendanceRecord[]> {
  try {
    const attendanceRef = collection(db, "students", studentId, "attendance");
    
    // Calculate date 30 days ago
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const q = query(
      attendanceRef,
      where("date", ">=", startDateStr),
      orderBy("date", "desc")
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      studentId,
      ...doc.data(),
    })) as AttendanceRecord[];
  } catch (error) {
    console.error("Error fetching attendance:", error);
    throw error;
  }
}

/**
 * Get progress records for a student
 */
export async function getStudentProgress(studentId: string): Promise<ProgressRecord[]> {
  try {
    const progressRef = collection(db, "students", studentId, "progress");
    const snapshot = await getDocs(progressRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      studentId,
      ...doc.data(),
    })) as ProgressRecord[];
  } catch (error) {
    console.error("Error fetching progress:", error);
    throw error;
  }
}

/**
 * Calculate attendance percentage for a student
 */
export function calculateAttendancePercentage(records: AttendanceRecord[]): number {
  if (records.length === 0) return 0;
  
  const presentCount = records.filter(r => r.status === "present").length;
  return Math.round((presentCount / records.length) * 100);
}

/**
 * Get mastery percentage by category
 */
export function getMasteryByCategory(
  progress: ProgressRecord[], 
  category: "phonics" | "grammar" | "speaking"
): number {
  const categoryRecords = progress.filter(p => p.category === category);
  
  if (categoryRecords.length === 0) return 0;
  
  const masteredCount = categoryRecords.filter(p => p.masteryLevel === "mastered").length;
  return Math.round((masteredCount / categoryRecords.length) * 100);
}
