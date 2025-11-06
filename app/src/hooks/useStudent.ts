import { useState, useEffect } from "react";
import { 
  getStudent, 
  getNextSession,
  getRecentAttendance,
  calculateAttendancePercentage
} from "../services/studentService";
import type { Student, Session, AttendanceRecord } from "../types/student";

interface UseStudentResult {
  student: Student | null;
  nextSession: Session | null;
  attendance: AttendanceRecord[];
  attendancePercentage: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useStudent(studentId: string | null): UseStudentResult {
  const [student, setStudent] = useState<Student | null>(null);
  const [nextSession, setNextSession] = useState<Session | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStudent = async () => {
    if (!studentId) {
      setStudent(null);
      setNextSession(null);
      setAttendance([]);
      setAttendancePercentage(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      const [studentData, session, attendanceData] = await Promise.all([
        getStudent(studentId),
        getNextSession(studentId),
        getRecentAttendance(studentId, 30),
      ]);

      setStudent(studentData);
      setNextSession(session);
      setAttendance(attendanceData);
      setAttendancePercentage(calculateAttendancePercentage(attendanceData));
    } catch (err) {
      console.error("Error in useStudent:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch student data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [studentId]);

  return {
    student,
    nextSession,
    attendance,
    attendancePercentage,
    loading,
    error,
    refetch: fetchStudent,
  };
}
