import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole, CreateUserFormData } from '../../../types/admin';
import * as firestoreAdmin from '../../../services/firestoreAdmin';
import * as adminService from '../../../services/adminService';

interface AdminContextValue {
  users: User[];
  loading: boolean;
  error?: string | null;
  createUser: (role: UserRole, data: CreateUserFormData) => Promise<any>;
  updateUser: (uid: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (uid: string) => Promise<void>;
  assignStudentToTeacher: (studentId: string, teacherId: string) => Promise<void>;
  assignParentToPartner: (parentId: string, partnerId: string) => Promise<void>;
  assignTeacherToPartner: (teacherId: string, partnerId: string) => Promise<void>;
  assignCourseToStudent: (studentId: string, courseId: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = firestoreAdmin.subscribeToUsers((nextUsers) => {
      setUsers(nextUsers as User[]);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const createUser = async (role: UserRole, data: CreateUserFormData) => {
    try {
      return await firestoreAdmin.createUserWithRole(role, data);
    } catch (err: any) {
      setError(err?.message || 'Failed to create user');
      throw err;
    }
  };

  const updateUser = async (uid: string, updates: Partial<User>) => {
    try {
      return await adminService.updateUser(uid, updates);
    } catch (err: any) {
      setError(err?.message || 'Failed to update user');
      throw err;
    }
  };

  const deleteUser = async (uid: string) => {
    try {
      return await firestoreAdmin.deleteUser(uid);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete user');
      throw err;
    }
  };

  const assignStudentToTeacher = async (studentId: string, teacherId: string) => {
    try {
      return await firestoreAdmin.assignStudentToTeacher(studentId, teacherId);
    } catch (err: any) {
      setError(err?.message || 'Failed to assign student to teacher');
      throw err;
    }
  };

  const assignParentToPartner = async (parentId: string, partnerId: string) => {
    try {
      return await firestoreAdmin.assignParentToPartner(parentId, partnerId);
    } catch (err: any) {
      setError(err?.message || 'Failed to assign parent to partner');
      throw err;
    }
  };

  const assignTeacherToPartner = async (teacherId: string, partnerId: string) => {
    try {
      return await firestoreAdmin.assignTeacherToPartner(teacherId, partnerId);
    } catch (err: any) {
      setError(err?.message || 'Failed to assign teacher to partner');
      throw err;
    }
  };

  const assignCourseToStudent = async (studentId: string, courseId: string) => {
    try {
      return await firestoreAdmin.assignCourseToStudent(studentId, courseId);
    } catch (err: any) {
      setError(err?.message || 'Failed to assign course');
      throw err;
    }
  };

  const value: AdminContextValue = {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    assignStudentToTeacher,
    assignParentToPartner,
    assignTeacherToPartner,
    assignCourseToStudent
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}

export default AdminProvider;
