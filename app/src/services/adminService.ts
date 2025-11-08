/**
 * Admin Service Functions
 * Handles all admin operations for user management
 */

import { 
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  writeBatch,
  orderBy,
  limit,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, auth } from '../firebase';
import type { 
  CreateUserFormData, 
  User, 
  UserRole, 
  Parent, 
  Student,
  LearningPartner,
  SystemStats,
  AuditLog,
  SystemSettings
} from '../types/admin';

/**
 * Create a new user (uses Cloud Function to avoid logging out admin)
 */
export async function createUser(data: CreateUserFormData): Promise<User> {
  try {
    // Normalize username (lowercase, remove spaces and special chars, keep only alphanumeric and underscores)
    const normalizedUsername = data.username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    // Validate username format - must be 3-20 chars, start with letter, only lowercase letters, numbers, underscores
    if (!/^[a-z][a-z0-9_]{2,19}$/.test(normalizedUsername)) {
      throw new Error('Username must be 3-20 characters, start with a letter, and contain only lowercase letters, numbers, and underscores');
    }

    // Check for reserved usernames
    const reservedUsernames = ['admin', 'root', 'system', 'support', 'help', 'info', 'contact', 'test', 'demo'];
    if (reservedUsernames.includes(normalizedUsername)) {
      throw new Error('This username is reserved and cannot be used');
    }

    // Validate student has parent
    if (data.role === 'student' && !data.parentId) {
      throw new Error('Students must have a parent ID');
    }

    // Use Cloud Function to create user (doesn't log out admin!)
    const adminCreateUserFn = httpsCallable(functions, 'adminCreateUser');
    
    const createData: any = {
      email: data.email,
      password: data.password,
      displayName: data.displayName,
      firstName: data.firstName,
      lastName: data.lastName,
      username: normalizedUsername,
      role: data.role,
      parentId: data.parentId,
      learningPartnerId: data.learningPartnerId,
      teacherId: data.teacherId,
      enrolledCourses: data.enrolledCourses,
      dateOfBirth: data.dateOfBirth
    };

    // Only include phoneNumber if it's provided and not empty
    if (data.phoneNumber && data.phoneNumber.trim() !== '') {
      createData.phoneNumber = data.phoneNumber;
    }

    const result = await adminCreateUserFn(createData);

    console.log('✅ User created via Cloud Function:', result.data);
    
    // Return a minimal user object (the actual data is in Firestore)
    return {
      uid: (result.data as any).uid,
      email: data.email,
      username: normalizedUsername,
      usernameLower: normalizedUsername.toLowerCase(),
      displayName: data.displayName,
      role: data.role,
      status: 'active',
      createdAt: new Date().toISOString()
    } as User;

  } catch (error: any) {
    console.error('Error creating user via Cloud Function:', error);
    
    // Extract readable error message
    if (error.code === 'functions/already-exists') {
      throw new Error(error.message || 'User already exists');
    }
    if (error.code === 'functions/invalid-argument') {
      throw new Error(error.message || 'Invalid user data');
    }
    if (error.code === 'functions/permission-denied') {
      throw new Error('You do not have permission to create users');
    }
    if (error.code === 'functions/unauthenticated') {
      throw new Error('You must be logged in to create users');
    }
    
    throw new Error(error.message || 'Failed to create user');
  }
}

/*
 * DEPRECATED: Old createUser function that logs out admin
 * This method is no longer used - we now use Cloud Function adminCreateUser
 * Kept for reference only - DO NOT USE
 *
async function createUserOldMethod(data: CreateUserFormData): Promise<User> {
  ... (old implementation removed to fix build)
}
*/

/**
 * Get all users or filter by role

/**
 * Get all users or filter by role
 */
export async function getUsers(role?: UserRole): Promise<User[]> {
  try {
    const usersRef = collection(db, 'users');
    let q = query(usersRef);

    if (role) {
      q = query(usersRef, where('role', '==', role));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    } as User));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

/**
 * Get a single user by UID
 */
export async function getUserById(uid: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? (userDoc.data() as User) : null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

/**
 * Update user data
 */
export async function updateUser(uid: string, updates: Partial<User>): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    
    // Get current admin user
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Must be authenticated to update users');
    }
    
    // Filter out undefined values to prevent Firestore errors
    const cleanUpdates: Record<string, any> = {};
    Object.keys(updates).forEach(key => {
      const value = (updates as any)[key];
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    });
    
    await updateDoc(userRef, {
      ...cleanUpdates,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser.uid
    });
    console.log(`✅ User updated: ${uid}`);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Delete a user (both Auth and Firestore)
 * Uses Cloud Function to delete with Admin SDK
 */
export async function deleteUser(uid: string): Promise<void> {
  try {
    // Validate uid
    if (!uid) {
      throw new Error('User ID is required');
    }

    console.log('Deleting user with UID:', uid);
    
    const adminDeleteUserFn = httpsCallable(functions, 'adminDeleteUser');
    
    const result = await adminDeleteUserFn({ uid });
    
    console.log(`✅ User deleted:`, (result.data as any).displayName);
  } catch (error: any) {
    console.error('Error deleting user via Cloud Function:', error);
    
    // Extract readable error message
    if (error.code === 'functions/not-found') {
      throw new Error('User not found');
    }
    if (error.code === 'functions/invalid-argument') {
      throw new Error(error.message || 'Invalid user data or cannot delete own account');
    }
    if (error.code === 'functions/permission-denied') {
      throw new Error('You do not have permission to delete users');
    }
    if (error.code === 'functions/unauthenticated') {
      throw new Error('You must be logged in to delete users');
    }
    
    throw new Error(error.message || 'Failed to delete user');
  }
}

/**
 * Assign a student to a parent
 */
export async function assignStudentToParent(studentId: string, parentId: string): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Get current admin user
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Must be authenticated to assign students');
    }

    // Update student
    batch.update(doc(db, 'users', studentId), {
      parentId,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser.uid
    });

    // Update parent
    const parentDoc = await getDoc(doc(db, 'users', parentId));
    if (parentDoc.exists()) {
      const parentData = parentDoc.data() as Parent;
      if (!parentData.children.includes(studentId)) {
        batch.update(doc(db, 'users', parentId), {
          children: [...parentData.children, studentId],
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid
        });
      }
    }

    await batch.commit();
    console.log(`✅ Student ${studentId} assigned to parent ${parentId}`);
  } catch (error) {
    console.error('Error assigning student to parent:', error);
    throw error;
  }
}

/**
 * Assign Learning Partner to Teacher
 */
export async function assignLearningPartnerToTeacher(
  learningPartnerId: string,
  teacherId: string
): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Get current admin user
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Must be authenticated to assign learning partners');
    }

    // Update teacher
    batch.update(doc(db, 'users', teacherId), {
      learningPartnerId,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser.uid
    });

    // Update learning partner
    const lpDoc = await getDoc(doc(db, 'users', learningPartnerId));
    if (lpDoc.exists()) {
      const lpData = lpDoc.data() as LearningPartner;
      if (!lpData.assignedTeachers.includes(teacherId)) {
        batch.update(doc(db, 'users', learningPartnerId), {
          assignedTeachers: [...lpData.assignedTeachers, teacherId],
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid
        });
      }
    }

    await batch.commit();
    console.log(`✅ Learning Partner ${learningPartnerId} assigned to teacher ${teacherId}`);
  } catch (error) {
    console.error('Error assigning LP to teacher:', error);
    throw error;
  }
}

/**
 * Assign Learning Partner to Parent
 */
export async function assignLearningPartnerToParent(
  learningPartnerId: string,
  parentId: string
): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Get current admin user
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Must be authenticated to assign learning partners');
    }

    // Update parent
    batch.update(doc(db, 'users', parentId), {
      learningPartnerId,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser.uid
    });

    // Update learning partner
    const lpDoc = await getDoc(doc(db, 'users', learningPartnerId));
    if (lpDoc.exists()) {
      const lpData = lpDoc.data() as LearningPartner;
      if (!lpData.assignedParents.includes(parentId)) {
        batch.update(doc(db, 'users', learningPartnerId), {
          assignedParents: [...lpData.assignedParents, parentId],
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid
        });
      }
    }

    await batch.commit();
    console.log(`✅ Learning Partner ${learningPartnerId} assigned to parent ${parentId}`);
  } catch (error) {
    console.error('Error assigning LP to parent:', error);
    throw error;
  }
}

/**
 * Assign course to student
 */
export async function assignCourseToStudent(studentId: string, courseId: string): Promise<void> {
  try {
    const studentDoc = await getDoc(doc(db, 'users', studentId));
    if (!studentDoc.exists()) {
      throw new Error('Student not found');
    }

    // Get current admin user
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Must be authenticated to assign courses');
    }

    const studentData = studentDoc.data() as Student;
    if (!studentData.enrolledCourses.includes(courseId)) {
      await updateDoc(doc(db, 'users', studentId), {
        enrolledCourses: [...studentData.enrolledCourses, courseId],
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      });
      console.log(`✅ Course ${courseId} assigned to student ${studentId}`);
    }
  } catch (error) {
    console.error('Error assigning course:', error);
    throw error;
  }
}

/**
 * Remove course from student
 */
export async function removeCourseFromStudent(studentId: string, courseId: string): Promise<void> {
  try {
    const studentDoc = await getDoc(doc(db, 'users', studentId));
    if (!studentDoc.exists()) {
      throw new Error('Student not found');
    }

    // Get current admin user
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Must be authenticated to remove courses');
    }

    const studentData = studentDoc.data() as Student;
    await updateDoc(doc(db, 'users', studentId), {
      enrolledCourses: studentData.enrolledCourses.filter(id => id !== courseId),
      updatedAt: serverTimestamp(),
      updatedBy: currentUser.uid
    });
    console.log(`✅ Course ${courseId} removed from student ${studentId}`);
  } catch (error) {
    console.error('Error removing course:', error);
    throw error;
  }
}

/**
 * Reset user password (admin function)
 * Note: This requires Firebase Admin SDK on backend for production
 * For now, we'll update via Firebase Auth REST API or admin panel
 */
export async function resetUserPassword(email: string, _newPassword: string): Promise<void> {
  try {
    // Note: This is a simplified version. In production, you should use Firebase Admin SDK
    // on a Cloud Function to reset passwords for security reasons.
    
    // For development: Admin would need to use Firebase Console or implement a Cloud Function
    // This function serves as a placeholder for the admin UI
    
    console.log(`Password reset initiated for ${email}`);
    
    // In a real implementation, you would call a Cloud Function:
    // const resetPasswordFunction = httpsCallable(functions, 'adminResetPassword');
    // await resetPasswordFunction({ email, _newPassword });
    
    throw new Error('Password reset must be implemented via Cloud Function for security. Use Firebase Console for now.');
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Get system-wide statistics
 */
export async function getSystemStats(): Promise<SystemStats> {
  try {
    // Try to get cached stats first
    const statsDoc = await getDoc(doc(db, 'system_stats', 'current'));
    
    if (statsDoc.exists()) {
      return statsDoc.data() as SystemStats;
    }

    // If no cached stats, calculate them
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => doc.data() as User);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats: SystemStats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      totalParents: users.filter(u => u.role === 'parent').length,
      totalStudents: users.filter(u => u.role === 'student').length,
      totalTeachers: users.filter(u => u.role === 'teacher').length,
      totalLearningPartners: users.filter(u => u.role === 'learning-partner').length,
      totalAdmins: users.filter(u => u.role === 'admin').length,
      newUsersToday: users.filter(u => new Date(u.createdAt) >= today).length,
      newUsersThisWeek: users.filter(u => new Date(u.createdAt) >= weekAgo).length,
      newUsersThisMonth: users.filter(u => new Date(u.createdAt) >= monthAgo).length,
      totalSessions: 0,
      activeSessions: 0,
      completedSessions: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      lastUpdated: new Date().toISOString()
    };

    return stats;
  } catch (error) {
    console.error('Error fetching system stats:', error);
    throw error;
  }
}

/**
 * Get audit logs with optional filtering
 */
export async function getAuditLogs(limitCount: number = 50): Promise<AuditLog[]> {
  try {
    const logsRef = collection(db, 'audit_logs');
    const q = query(
      logsRef,
      where('timestamp', '!=', null),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AuditLog[];
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    // Return empty array if collection doesn't exist yet
    return [];
  }
}

/**
 * Create audit log entry
 */
export async function createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
  try {
    // Persist audit log to /audit_logs collection
    const logsRef = collection(db, 'audit_logs');
    await addDoc(logsRef, {
      action: log.action,
      userId: log.userId,
      userName: log.userName,
      userRole: log.userRole,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details,
      metadata: log.metadata || null,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp()
    });
    console.log('Audit log persisted');
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw - audit logs are not critical
  }
}

/**
 * Get system settings
 */
export async function getSystemSettings(): Promise<SystemSettings | null> {
  try {
    const settingsPath = 'system_settings/current';
    console.debug('[SystemSettings] path =', settingsPath);
    const settingsDoc = await getDoc(doc(db, 'system_settings', 'current'));
    
    if (settingsDoc.exists()) {
      return settingsDoc.data() as SystemSettings;
    }

    // Return default settings if none exist
    return {
      id: 'current',
      maintenanceMode: false,
      allowNewSignups: true,
      requireEmailVerification: false,
      maxStudentsPerTeacher: 20,
      maxTeachersPerRM: 10,
      sessionDurationMinutes: 30,
      featureFlags: {
        enableGames: true,
        enableVideoLessons: true,
        enableLiveClasses: true,
        enableNotifications: true
      },
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    };
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return null;
  }
}

/**
 * Update system settings
 */
export async function updateSystemSettings(
  updates: Partial<SystemSettings>,
  updatedBy: string
): Promise<void> {
  try {
    const settingsRef = doc(db, 'system_settings', 'current');
    
    await updateDoc(settingsRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy
    });
    
    console.log('✅ System settings updated');
  } catch (error) {
    console.error('Error updating system settings:', error);
    throw error;
  }
}

/**
 * Get user activity summary
 */
export async function getUserActivitySummary(): Promise<{
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
}> {
  try {
    // In production, this would query a sessions or activity collection
    // For now, return mock data
    return {
      activeToday: 0,
      activeThisWeek: 0,
      activeThisMonth: 0
    };
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return {
      activeToday: 0,
      activeThisWeek: 0,
      activeThisMonth: 0
    };
  }
}
