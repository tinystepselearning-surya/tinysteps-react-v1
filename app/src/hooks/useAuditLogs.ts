import { useState, useEffect } from "react";
import { getAuditLogs } from "../services/adminService";
import type { AuditLog } from "../types/admin";

interface UseAuditLogsResult {
  logs: AuditLog[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useAuditLogs(limitCount: number = 50): UseAuditLogsResult {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getAuditLogs(limitCount);
      setLogs(data);
    } catch (err) {
      console.error("Error in useAuditLogs:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch audit logs"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [limitCount]);

  return {
    logs,
    loading,
    error,
    refetch: fetchLogs,
  };
}
