import { useState, useEffect } from "react";
import { getRMStudents, getUnassignedStudents } from "../services/rmService";
import type { Student } from "../types/student";

interface UseRMStudentsResult {
  students: Student[];
  unassignedStudents: Student[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useRMStudents(rmId: string | null): UseRMStudentsResult {
  const [students, setStudents] = useState<Student[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStudents = async () => {
    if (!rmId) {
      setStudents([]);
      setUnassignedStudents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const [allStudents, unassigned] = await Promise.all([
        getRMStudents(rmId),
        getUnassignedStudents(rmId),
      ]);

      setStudents(allStudents);
      setUnassignedStudents(unassigned);
    } catch (err) {
      console.error("Error in useRMStudents:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch students"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [rmId]);

  return {
    students,
    unassignedStudents,
    loading,
    error,
    refetch: fetchStudents,
  };
}
