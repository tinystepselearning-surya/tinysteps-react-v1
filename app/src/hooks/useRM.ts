import { useState, useEffect } from "react";
import { getRM, getRMStats } from "../services/rmService";
import type { RM, RMStats } from "../types/rm";

interface UseRMResult {
  rm: RM | null;
  stats: RMStats | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useRM(userId: string | null): UseRMResult {
  const [rm, setRM] = useState<RM | null>(null);
  const [stats, setStats] = useState<RMStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRM = async () => {
    if (!userId) {
      setRM(null);
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const rmData = await getRM(userId);
      setRM(rmData);

      if (rmData?.id) {
        const statsData = await getRMStats(rmData.id);
        setStats(statsData);
      }
    } catch (err) {
      console.error("Error in useRM:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch RM data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRM();
  }, [userId]);

  return {
    rm,
    stats,
    loading,
    error,
    refetch: fetchRM,
  };
}
