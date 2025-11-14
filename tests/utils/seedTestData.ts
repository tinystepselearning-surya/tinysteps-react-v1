import { RulesTestEnvironment } from '@firebase/rules-unit-testing';

/**
 * Seed minimal test data into the emulator with security rules disabled.
 * Keeps test setup consistent across security-related tests.
 */
export async function seedTestData(testEnv: RulesTestEnvironment) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();

    // Users
    await adminDb.collection('users').doc('admin-uid').set({ name: 'Admin', role: 'admin' });
    await adminDb.collection('users').doc('other-uid').set({ name: 'Other', role: 'parent' });
    await adminDb.collection('users').doc('teacher-uid').set({ name: 'Teacher', role: 'teacher' });
    await adminDb.collection('users').doc('other-teacher-uid').set({ name: 'OtherTeacher', role: 'teacher' });

    // Kids
    await adminDb.collection('kids').doc('kid-uid').set({ name: 'Kid', parentId: 'parent-uid', teacherId: 'teacher-uid', lpId: 'lp-uid' });
    await adminDb.collection('kids').doc('assigned-kid-uid').set({ name: 'AssignedKid', parentId: 'parent-uid', teacherId: 'teacher-uid' });
    await adminDb.collection('kids').doc('unassigned-kid-uid').set({ name: 'UnassignedKid', parentId: 'other-parent-uid', teacherId: 'other-teacher-uid' });
  });
}

export default seedTestData;
