import { useState, useEffect } from "react";
import { getRMTeachers, getTeacherWorkload } from "../services/rmService";
import type { Teacher } from "../types/teacher";
import type { TeacherWorkload } from "../types/rm";

interface UseRMTeachersResult {
  teachers: Teacher[];
  workloads: TeacherWorkload[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useRMTeachers(rmId: string | null): UseRMTeachersResult {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [workloads, setWorkloads] = useState<TeacherWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTeachers = async () => {
    if (!rmId) {
      setTeachers([]);
      setWorkloads([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const [teacherData, workloadData] = await Promise.all([
        getRMTeachers(rmId),
        getTeacherWorkload(rmId),
      ]);

      setTeachers(teacherData);
      setWorkloads(workloadData);
    } catch (err) {
      console.error("Error in useRMTeachers:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch teachers"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [rmId]);

  return {
    teachers,
    workloads,
    loading,
    error,
    refetch: fetchTeachers,
  };
}
