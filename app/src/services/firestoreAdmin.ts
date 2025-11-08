import { db } from '../firebase';
import {
  doc,
  getDoc,
  writeBatch,
  onSnapshot,
  collection,
  query,
  where,
  QuerySnapshot
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import * as adminService from './adminService';
import type { UserRole, CreateUserFormData } from '../types/admin';

/**
 * Wrapper service providing the explicit function names requested by the spec.
 * Some functions delegate to existing adminService (Cloud Function backed).
 */
export async function createUserWithRole(role: UserRole, data: CreateUserFormData) {
  // ensure role on payload
  const payload = { ...data, role };
  return adminService.createUser(payload);
}

export async function deleteUser(uid: string) {
  return adminService.deleteUser(uid);
}

export async function assignCourseToStudent(studentId: string, courseId: string) {
  return adminService.assignCourseToStudent(studentId, courseId);
}

/**
 * Assign a student to a teacher. This updates the student record with the assigned teacher.
 */
export async function assignStudentToTeacher(studentId: string, teacherId: string): Promise<void> {
  const studentRef = doc(db, 'students', studentId);

  const studentSnap = await getDoc(studentRef);

  if (!studentSnap.exists()) throw new Error('Student not found');

  // update student -> set assignedTeacherId
  const batch = writeBatch(db);
  batch.update(studentRef, {
    assignedTeacherId: teacherId,
    updatedAt: new Date().toISOString()
  });
  await batch.commit();
}

/**
 * Alias for assignLearningPartnerToParent in adminService but named as requested
 */
export async function assignParentToPartner(parentId: string, partnerId: string): Promise<void> {
  // adminService expects (learningPartnerId, parentId)
  return adminService.assignLearningPartnerToParent(partnerId, parentId);
}

/**
 * Alias for assignLearningPartnerToTeacher in adminService but named as requested
 */
export async function assignTeacherToPartner(teacherId: string, partnerId: string): Promise<void> {
  // adminService expects (learningPartnerId, teacherId)
  return adminService.assignLearningPartnerToTeacher(partnerId, teacherId);
}

/**
 * Subscribe to realtime user changes. Returns unsubscribe function.
 * Listener provides an array of users (raw Firestore data with uid added).
 */
export function subscribeToUsers(callback: (users: any[]) => void, role?: UserRole) {
  const usersRef = collection(db, 'users');
  let q: any = usersRef;
  if (role) {
    q = query(usersRef, where('role', '==', role));
  }

  const unsub = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const users = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
    callback(users as any[]);
  }, (err: any) => {
    console.error('Realtime users listener error', err);
  });

  return unsub;
}

export default {
  createUserWithRole,
  deleteUser,
  assignCourseToStudent,
  assignStudentToTeacher,
  assignParentToPartner,
  assignTeacherToPartner,
  subscribeToUsers
};
