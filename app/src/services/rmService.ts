import { db } from "../firebase";
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from "firebase/firestore";
import type { RM, RMStats, Alert, TeacherWorkload } from "../types/rm";
import type { Student } from "../types/student";
import type { Teacher } from "../types/teacher";

/**
 * Fetch RM profile by userId
 */
export async function getRM(userId: string): Promise<RM | null> {
  try {
    const rmDoc = await getDoc(doc(db, "rms", userId));

    if (!rmDoc.exists()) {
      return null;
    }

    const data = rmDoc.data();
    return {
      id: rmDoc.id,
      userId: rmDoc.id, // The document ID is the userId
      ...data,
    } as RM;
  } catch (error) {
    console.error("Error fetching RM:", error);
    throw error;
  }
}

/**
 * Fetch all students assigned to this RM
 */
export async function getRMStudents(rmId: string): Promise<Student[]> {
  try {
    const studentsQuery = query(
      collection(db, "students"),
      where("assignedRmId", "==", rmId),
      where("status", "==", "active"),
      orderBy("displayName", "asc")
    );

    const snapshot = await getDocs(studentsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Student[];
  } catch (error) {
    console.error("Error fetching RM students:", error);
    throw error;
  }
}

/**
 * Fetch all teachers managed by this RM
 */
export async function getRMTeachers(rmId: string): Promise<Teacher[]> {
  try {
    const teachersQuery = query(
      collection(db, "teachers"),
      where("assignedRmId", "==", rmId),
      orderBy("displayName", "asc")
    );

    const snapshot = await getDocs(teachersQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Teacher[];
  } catch (error) {
    console.error("Error fetching RM teachers:", error);
    throw error;
  }
}

/**
 * Fetch RM statistics
 */
export async function getRMStats(rmId: string): Promise<RMStats | null> {
  try {
    const statsDoc = await getDocs(
      query(collection(db, "rms", rmId, "stats"), limit(1))
    );
    
    if (statsDoc.empty) {
      return null;
    }

    return statsDoc.docs[0].data() as RMStats;
  } catch (error) {
    console.error("Error fetching RM stats:", error);
    throw error;
  }
}

/**
 * Fetch alerts for RM
 */
export async function getRMAlerts(rmId: string, limitCount: number = 10): Promise<Alert[]> {
  try {
    const alertsQuery = query(
      collection(db, "rms", rmId, "alerts"),
      where("isRead", "==", false),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(alertsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Alert[];
  } catch (error) {
    console.error("Error fetching RM alerts:", error);
    throw error;
  }
}

/**
 * Get unassigned students (students without a teacher)
 */
export async function getUnassignedStudents(rmId: string): Promise<Student[]> {
  try {
    const studentsQuery = query(
      collection(db, "students"),
      where("assignedRmId", "==", rmId),
      where("status", "==", "active"),
      where("assignedTeacherId", "==", null),
      orderBy("enrollmentDate", "desc")
    );

    const snapshot = await getDocs(studentsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Student[];
  } catch (error) {
    console.error("Error fetching unassigned students:", error);
    throw error;
  }
}

/**
 * Calculate teacher workload statistics
 */
export async function getTeacherWorkload(rmId: string): Promise<TeacherWorkload[]> {
  try {
    const teachers = await getRMTeachers(rmId);
    const workloads: TeacherWorkload[] = [];

    for (const teacher of teachers) {
      // Count active students
      const studentsQuery = query(
        collection(db, "students"),
        where("assignedTeacherId", "==", teacher.id),
        where("status", "==", "active")
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const activeStudents = studentsSnapshot.size;

      // Count sessions
      const scheduledQuery = query(
        collection(db, "sessions"),
        where("teacherId", "==", teacher.id),
        where("status", "==", "scheduled")
      );
      const completedQuery = query(
        collection(db, "sessions"),
        where("teacherId", "==", teacher.id),
        where("status", "==", "completed")
      );

      const [scheduledSnapshot, completedSnapshot] = await Promise.all([
        getDocs(scheduledQuery),
        getDocs(completedQuery),
      ]);

      const scheduledSessions = scheduledSnapshot.size;
      const completedSessions = completedSnapshot.size;
      const totalSessions = scheduledSessions + completedSessions;
      const completionRate = totalSessions > 0 
        ? Math.round((completedSessions / totalSessions) * 100) 
        : 0;

      workloads.push({
        teacherId: teacher.id,
        teacherName: teacher.displayName,
        activeStudents,
        maxStudents: teacher.maxStudentsPerWeek || 20,
        scheduledSessions,
        completedSessions,
        completionRate,
      });
    }

    return workloads;
  } catch (error) {
    console.error("Error calculating teacher workload:", error);
    throw error;
  }
}

/**
 * Count students by status for an RM
 */
export async function getRMStudentCount(rmId: string): Promise<number> {
  try {
    const studentsQuery = query(
      collection(db, "students"),
      where("assignedRmId", "==", rmId),
      where("status", "==", "active")
    );

    const snapshot = await getDocs(studentsQuery);
    return snapshot.size;
  } catch (error) {
    console.error("Error counting RM students:", error);
    throw error;
  }
}

/**
 * Count teachers by status for an RM
 */
export async function getRMTeacherCount(rmId: string): Promise<number> {
  try {
    const teachersQuery = query(
      collection(db, "teachers"),
      where("assignedRmId", "==", rmId),
      where("status", "==", "active")
    );

    const snapshot = await getDocs(teachersQuery);
    return snapshot.size;
  } catch (error) {
    console.error("Error counting RM teachers:", error);
    throw error;
  }
}
