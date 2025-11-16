import { RulesTestEnvironment } from '@firebase/rules-unit-testing';

/**
 * Seed minimal test data into the emulator with security rules disabled.
 * Keeps test setup consistent across security-related tests.
 */
export async function seedTestData(testEnv: RulesTestEnvironment) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();

    // Users
    await adminDb.collection('users').doc('admin-uid').set({ uid: 'admin-uid', name: 'Admin', role: 'admin' });
    await adminDb.collection('users').doc('parent-uid').set({ uid: 'parent-uid', name: 'Parent', role: 'parent' });
    await adminDb.collection('users').doc('teacher-uid').set({ uid: 'teacher-uid', name: 'Teacher', role: 'teacher' });

    // Kids
    await adminDb.collection('kids').doc('kid-uid').set({ name: 'PlaceholderKid', parentId: 'parent-uid', teacherId: 'teacher-uid', assignedLPs: [] });

    // Enrollments
    await adminDb.collection('enrollments').doc('teacher-uid').set({ teacherId: 'teacher-uid', studentId: 'kid-uid', parentId: 'parent-uid', lpId: null });
  });
}

export default seedTestData;
