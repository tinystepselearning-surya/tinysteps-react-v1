import { useState, useEffect } from "react";
import { getSystemStats, getUserActivitySummary } from "../services/adminService";
import type { SystemStats } from "../types/admin";

interface UseSystemStatsResult {
  stats: SystemStats | null;
  activity: {
    activeToday: number;
    activeThisWeek: number;
    activeThisMonth: number;
  };
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSystemStats(): UseSystemStatsResult {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activity, setActivity] = useState({
    activeToday: 0,
    activeThisWeek: 0,
    activeThisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, activityData] = await Promise.all([
        getSystemStats(),
        getUserActivitySummary()
      ]);

      setStats(statsData);
      setActivity(activityData);
    } catch (err) {
      console.error("Error in useSystemStats:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch system stats"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    activity,
    loading,
    error,
    refetch: fetchStats,
  };
}
