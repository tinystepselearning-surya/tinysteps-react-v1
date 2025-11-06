import { db } from "../firebase";
import { 
  collection, 
  doc,
  getDocs, 
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from "firebase/firestore";
import type { Session } from "../types/student";
import type { SessionFormData, CompleteSessionData } from "../types/teacher";

/**
 * Get sessions for a specific teacher
 */
export async function getTeacherSessions(
  teacherId: string,
  status?: Session["status"],
  limitCount = 50
): Promise<Session[]> {
  try {
    const sessionsRef = collection(db, "sessions");
    
    const constraints = [
      where("teacherId", "==", teacherId),
      orderBy("scheduledAt", "desc"),
      limit(limitCount)
    ];

    if (status) {
      constraints.splice(1, 0, where("status", "==", status));
    }

    const q = query(sessionsRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Session[];
  } catch (error) {
    console.error("Error fetching teacher sessions:", error);
    throw error;
  }
}

/**
 * Get today's sessions for a teacher
 */
export async function getTodaySessions(teacherId: string): Promise<Session[]> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessionsRef = collection(db, "sessions");
    const q = query(
      sessionsRef,
      where("teacherId", "==", teacherId),
      where("scheduledAt", ">=", today),
      where("scheduledAt", "<", tomorrow),
      orderBy("scheduledAt", "asc")
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Session[];
  } catch (error) {
    console.error("Error fetching today's sessions:", error);
    throw error;
  }
}

/**
 * Get upcoming sessions for a teacher
 */
export async function getUpcomingTeacherSessions(
  teacherId: string,
  limitCount = 10
): Promise<Session[]> {
  try {
    const now = new Date();
    const sessionsRef = collection(db, "sessions");
    
    const q = query(
      sessionsRef,
      where("teacherId", "==", teacherId),
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
 * Create a new session
 */
export async function createSession(
  teacherId: string,
  userId: string,
  data: SessionFormData
): Promise<string> {
  try {
    const now = Timestamp.now();
    const sessionData = {
      studentId: data.studentId,
      teacherId,
      scheduledAt: Timestamp.fromDate(data.scheduledAt),
      duration: data.duration,
      status: "scheduled" as const,
      zoomLink: data.zoomLink || "",
      notes: data.notes || "",
      topicsCovered: data.topicsCovered || [],
      createdBy: userId,
      createdAt: now,
      updatedBy: userId,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, "sessions"), sessionData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating session:", error);
    throw error;
  }
}

/**
 * Mark session as completed
 */
export async function completeSession(
  sessionId: string,
  userId: string,
  data: CompleteSessionData
): Promise<void> {
  try {
    const sessionRef = doc(db, "sessions", sessionId);
    
    await updateDoc(sessionRef, {
      status: "completed",
      completedAt: Timestamp.fromDate(data.completedAt),
      notes: data.outcomes,
      topicsCovered: data.topicsCovered,
      studentPerformance: data.studentPerformance || null,
      homeworkAssigned: data.homeworkAssigned || null,
      updatedBy: userId,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error completing session:", error);
    throw error;
  }
}

/**
 * Cancel a session
 */
export async function cancelSession(
  sessionId: string,
  userId: string,
  reason?: string
): Promise<void> {
  try {
    const sessionRef = doc(db, "sessions", sessionId);
    
    await updateDoc(sessionRef, {
      status: "cancelled",
      cancellationReason: reason || "",
      updatedBy: userId,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error cancelling session:", error);
    throw error;
  }
}

/**
 * Get session count by status for a teacher
 */
export async function getSessionStats(teacherId: string) {
  try {
    const sessions = await getTeacherSessions(teacherId, undefined, 1000);
    
    const stats = {
      total: sessions.length,
      scheduled: sessions.filter(s => s.status === "scheduled").length,
      completed: sessions.filter(s => s.status === "completed").length,
      cancelled: sessions.filter(s => s.status === "cancelled").length,
      noShow: sessions.filter(s => s.status === "no-show").length,
    };

    return stats;
  } catch (error) {
    console.error("Error getting session stats:", error);
    return {
      total: 0,
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
    };
  }
}
