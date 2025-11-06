import { useState, useEffect } from "react";
import { getTeacherStudents } from "../services/teacherService";
import type { Student } from "../types/student";

interface UseTeacherStudentsResult {
  students: Student[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTeacherStudents(teacherId: string | null): UseTeacherStudentsResult {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStudents = async () => {
    if (!teacherId) {
      setStudents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getTeacherStudents(teacherId);
      setStudents(data);
    } catch (err) {
      console.error("Error in useTeacherStudents:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch students"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [teacherId]);

  return {
    students,
    loading,
    error,
    refetch: fetchStudents,
  };
}
