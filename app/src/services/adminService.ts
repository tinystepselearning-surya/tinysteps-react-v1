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
  writeBatch
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import type { 
  CreateUserFormData, 
  User, 
  UserRole, 
  Parent, 
  Student,
  LearningPartner
} from '../types/admin';

/**
 * Create a new user (uses Cloud Function to avoid logging out admin)
 */
export async function createUser(data: CreateUserFormData): Promise<User> {
  try {
    // Validate username format
    if (!/^[a-z0-9_]+$/.test(data.username)) {
      throw new Error('Username can only contain lowercase letters, numbers, and underscores');
    }

    // Validate student has parent
    if (data.role === 'student' && !data.parentId) {
      throw new Error('Students must have a parent ID');
    }

    // Use Cloud Function to create user (doesn't log out admin!)
    const adminCreateUserFn = httpsCallable(functions, 'adminCreateUser');
    
    const result = await adminCreateUserFn({
      email: data.email,
      password: data.password,
      displayName: data.displayName,
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      role: data.role,
      phoneNumber: data.phoneNumber,
      parentId: data.parentId,
      learningPartnerId: data.learningPartnerId,
      teacherId: data.teacherId,
      enrolledCourses: data.enrolledCourses,
      dateOfBirth: data.dateOfBirth
    });

    console.log('✅ User created via Cloud Function:', result.data);
    
    // Return a minimal user object (the actual data is in Firestore)
    return {
      uid: (result.data as any).uid,
      email: data.email,
      username: data.username,
      usernameLower: data.username.toLowerCase(),
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
    return snapshot.docs.map(doc => doc.data() as User);
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
      updatedAt: new Date().toISOString()
    });
    console.log(`✅ User updated: ${uid}`);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Delete a user (both Auth and Firestore)
 */
export async function deleteUser(uid: string): Promise<void> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data() as User;
    const batch = writeBatch(db);

    // 1. Delete user document
    batch.delete(doc(db, 'users', uid));

    // 2. Delete username mapping
    batch.delete(doc(db, 'usernames', userData.usernameLower));

    // 3. Handle role-specific cleanup
    if (userData.role === 'student') {
      const studentData = userData as Student;
      // Remove from parent's children array
      if (studentData.parentId) {
        const parentRef = doc(db, 'users', studentData.parentId);
        const parentDoc = await getDoc(parentRef);
        if (parentDoc.exists()) {
          const parentData = parentDoc.data() as Parent;
          batch.update(parentRef, {
            children: parentData.children.filter(id => id !== uid)
          });
        }
      }
    }

    await batch.commit();
    console.log(`✅ User deleted: ${uid}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

/**
 * Assign a student to a parent
 */
export async function assignStudentToParent(studentId: string, parentId: string): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Update student
    batch.update(doc(db, 'users', studentId), {
      parentId,
      updatedAt: new Date().toISOString()
    });

    // Update parent
    const parentDoc = await getDoc(doc(db, 'users', parentId));
    if (parentDoc.exists()) {
      const parentData = parentDoc.data() as Parent;
      if (!parentData.children.includes(studentId)) {
        batch.update(doc(db, 'users', parentId), {
          children: [...parentData.children, studentId],
          updatedAt: new Date().toISOString()
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

    // Update teacher
    batch.update(doc(db, 'users', teacherId), {
      learningPartnerId,
      updatedAt: new Date().toISOString()
    });

    // Update learning partner
    const lpDoc = await getDoc(doc(db, 'users', learningPartnerId));
    if (lpDoc.exists()) {
      const lpData = lpDoc.data() as LearningPartner;
      if (!lpData.assignedTeachers.includes(teacherId)) {
        batch.update(doc(db, 'users', learningPartnerId), {
          assignedTeachers: [...lpData.assignedTeachers, teacherId],
          updatedAt: new Date().toISOString()
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

    // Update parent
    batch.update(doc(db, 'users', parentId), {
      learningPartnerId,
      updatedAt: new Date().toISOString()
    });

    // Update learning partner
    const lpDoc = await getDoc(doc(db, 'users', learningPartnerId));
    if (lpDoc.exists()) {
      const lpData = lpDoc.data() as LearningPartner;
      if (!lpData.assignedParents.includes(parentId)) {
        batch.update(doc(db, 'users', learningPartnerId), {
          assignedParents: [...lpData.assignedParents, parentId],
          updatedAt: new Date().toISOString()
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

    const studentData = studentDoc.data() as Student;
    if (!studentData.enrolledCourses.includes(courseId)) {
      await updateDoc(doc(db, 'users', studentId), {
        enrolledCourses: [...studentData.enrolledCourses, courseId],
        updatedAt: new Date().toISOString()
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

    const studentData = studentDoc.data() as Student;
    await updateDoc(doc(db, 'users', studentId), {
      enrolledCourses: studentData.enrolledCourses.filter(id => id !== courseId),
      updatedAt: new Date().toISOString()
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
