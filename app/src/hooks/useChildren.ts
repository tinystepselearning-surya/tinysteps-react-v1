import { useState, useEffect } from "react";
import { getParentChildrenWithDetails } from "../services/parentService";
import type { Student } from "../types/student";

interface UseChildrenResult {
  children: Student[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useChildren(parentId: string | null): UseChildrenResult {
  const [children, setChildren] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchChildren = async () => {
    if (!parentId) {
      setChildren([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getParentChildrenWithDetails(parentId);
      setChildren(data);
    } catch (err) {
      console.error("Error in useChildren:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch children"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, [parentId]);

  return {
    children,
    loading,
    error,
    refetch: fetchChildren,
  };
}
