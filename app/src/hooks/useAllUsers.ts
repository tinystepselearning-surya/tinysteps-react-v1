import { useState, useEffect } from "react";
import { getUsers } from "../services/adminService";
import type { User, UserRole } from "../types/admin";

interface UseAllUsersResult {
  users: User[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  filterByRole: (role?: UserRole) => User[];
}

export function useAllUsers(): UseAllUsersResult {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Error in useAllUsers:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch users"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filterByRole = (role?: UserRole) => {
    if (!role) return users;
    return users.filter(u => u.role === role);
  };

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    filterByRole,
  };
}
