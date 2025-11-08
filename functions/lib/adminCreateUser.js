"use strict";
/**
 * Admin Create User Cloud Function
 * Allows admins to create users without being logged out
 * Uses Firebase Admin SDK to create users server-side
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCreateUser = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
exports.adminCreateUser = (0, https_1.onCall)({
    region: 'asia-south1',
    cors: true
}, async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Verify user has admin role
    if (request.auth.token.role !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Only admins can create users');
    }
    const data = request.data;
    // Validate required fields
    if (!data.email || !data.password || !data.firstName || !data.lastName || !data.username || !data.role) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields: email, password, firstName, lastName, username, role');
    }
    // Validate password length
    if (data.password.length < 6) {
        throw new https_1.HttpsError('invalid-argument', 'Password must be at least 6 characters');
    }
    // Validate student has parent
    if (data.role === 'student' && !data.parentId) {
        throw new https_1.HttpsError('invalid-argument', 'Students must have a parent assigned');
    }
    try {
        const db = (0, firestore_1.getFirestore)();
        const auth = (0, auth_1.getAuth)();
        // Check if username already exists
        const usernameDoc = await db.collection('usernames').doc(data.username.toLowerCase()).get();
        if (usernameDoc.exists) {
            throw new https_1.HttpsError('already-exists', `Username "${data.username}" is already taken`);
        }
        // Create Firebase Auth user (Admin SDK doesn't sign them in!)
        const createUserData = {
            email: data.email,
            password: data.password,
            displayName: data.displayName
        };
        // Only include phoneNumber if it's provided and not empty
        if (data.phoneNumber && data.phoneNumber.trim() !== '') {
            createUserData.phoneNumber = data.phoneNumber;
        }
        const userRecord = await auth.createUser(createUserData);
        const uid = userRecord.uid;
        // Set custom claims for role-based access
        await auth.setCustomUserClaims(uid, { role: data.role });
        // Prepare base user data
        const baseUserData = {
            uid,
            email: data.email,
            username: data.username,
            usernameLower: data.username.toLowerCase(),
            displayName: data.displayName,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
            status: 'active',
            createdAt: new Date().toISOString(),
            createdBy: request.auth.uid,
            phoneNumber: data.phoneNumber || ''
        };
        // Create role-specific data
        let userData;
        switch (data.role) {
            case 'student':
                userData = {
                    ...baseUserData,
                    parentId: data.parentId,
                    enrolledCourses: data.enrolledCourses || [],
                    learningPartnerId: data.learningPartnerId,
                    teacherId: data.teacherId
                };
                // Add DOB and calculate age if provided
                if (data.dateOfBirth) {
                    userData.dateOfBirth = data.dateOfBirth;
                    const today = new Date();
                    const birthDate = new Date(data.dateOfBirth);
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                    }
                    userData.age = age;
                }
                break;
            case 'parent':
                userData = {
                    ...baseUserData,
                    children: [],
                    learningPartnerId: data.learningPartnerId
                };
                break;
            case 'teacher':
                userData = {
                    ...baseUserData,
                    students: [],
                    learningPartnerId: data.learningPartnerId,
                    subjects: []
                };
                break;
            case 'learning-partner':
                userData = {
                    ...baseUserData,
                    assignedTeachers: [],
                    assignedParents: []
                };
                break;
            case 'admin':
                userData = {
                    ...baseUserData,
                    isSuperAdmin: false
                };
                break;
            default:
                throw new https_1.HttpsError('invalid-argument', `Invalid role: ${data.role}`);
        }
        // Use batch write for atomic operations
        const batch = db.batch();
        // 1. Create user document
        const userRef = db.collection('users').doc(uid);
        batch.set(userRef, userData);
        // 2. Create username mapping
        const usernameRef = db.collection('usernames').doc(data.username.toLowerCase());
        batch.set(usernameRef, {
            uid,
            createdAt: new Date().toISOString()
        });
        // 3. If parent, create parent document in parents collection
        if (data.role === 'parent') {
            const parentRef = db.collection('parents').doc(uid);
            batch.set(parentRef, {
                uid,
                email: data.email,
                displayName: data.displayName,
                firstName: data.firstName,
                lastName: data.lastName,
                phoneNumber: data.phoneNumber || '',
                learningPartnerId: data.learningPartnerId || null,
                status: 'active',
                createdAt: new Date().toISOString(),
                createdBy: request.auth.uid,
                updatedAt: new Date().toISOString(),
                updatedBy: request.auth.uid
            });
        }
        // 4. If student, create student document in students collection and link to parent
        if (data.role === 'student' && data.parentId) {
            // Create student document
            const studentRef = db.collection('students').doc(uid);
            batch.set(studentRef, {
                uid,
                email: data.email || '',
                displayName: data.displayName,
                firstName: data.firstName,
                lastName: data.lastName,
                parentId: data.parentId,
                enrolledCourses: data.enrolledCourses || [],
                learningPartnerId: data.learningPartnerId || null,
                assignedTeacherId: data.teacherId || null,
                assignedRmId: data.learningPartnerId || null,
                status: 'active',
                dateOfBirth: data.dateOfBirth || null,
                age: userData.age || null,
                createdAt: new Date().toISOString(),
                createdBy: request.auth.uid,
                updatedAt: new Date().toISOString(),
                updatedBy: request.auth.uid,
                summary: {
                    totalSessionsCompleted: 0,
                    streakDays: 0,
                    weeklyMinutes: 0,
                    phonicsMastery: 0,
                    grammarMastery: 0,
                    speakingMastery: 0
                }
            });
            // Create child link in parent's children subcollection
            const childLinkRef = db.collection('parents').doc(data.parentId).collection('children').doc(uid);
            batch.set(childLinkRef, {
                studentId: uid,
                displayName: data.displayName,
                isPrimary: false,
                addedAt: new Date().toISOString(),
                addedBy: request.auth.uid
            });
            // Update parent's children array in users collection
            const parentUserRef = db.collection('users').doc(data.parentId);
            const parentDoc = await parentUserRef.get();
            if (parentDoc.exists) {
                const parentData = parentDoc.data();
                batch.update(parentUserRef, {
                    children: [...(parentData?.children || []), uid]
                });
            }
        }
        // 5. If student without parent document creation above
        if (data.role === 'student' && !data.parentId) {
            // Create basic student document without parent link
            const studentRef = db.collection('students').doc(uid);
            batch.set(studentRef, {
                uid,
                email: data.email || '',
                displayName: data.displayName,
                firstName: data.firstName,
                lastName: data.lastName,
                parentId: null,
                enrolledCourses: data.enrolledCourses || [],
                learningPartnerId: data.learningPartnerId || null,
                assignedTeacherId: data.teacherId || null,
                assignedRmId: data.learningPartnerId || null,
                status: 'active',
                dateOfBirth: data.dateOfBirth || null,
                age: userData.age || null,
                createdAt: new Date().toISOString(),
                createdBy: request.auth.uid,
                updatedAt: new Date().toISOString(),
                updatedBy: request.auth.uid,
                summary: {
                    totalSessionsCompleted: 0,
                    streakDays: 0,
                    weeklyMinutes: 0,
                    phonicsMastery: 0,
                    grammarMastery: 0,
                    speakingMastery: 0
                }
            });
        }
        // 6. If teacher, create teacher document in teachers collection
        if (data.role === 'teacher') {
            const teacherRef = db.collection('teachers').doc(uid);
            batch.set(teacherRef, {
                uid,
                email: data.email,
                displayName: data.displayName,
                firstName: data.firstName,
                lastName: data.lastName,
                phoneNumber: data.phoneNumber || '',
                learningPartnerId: data.learningPartnerId || null,
                subjects: [],
                students: [],
                status: 'active',
                createdAt: new Date().toISOString(),
                createdBy: request.auth.uid,
                updatedAt: new Date().toISOString(),
                updatedBy: request.auth.uid
            });
        }
        // 7. If learning partner, create RM document in rms collection
        if (data.role === 'learning-partner') {
            const rmRef = db.collection('rms').doc(uid);
            batch.set(rmRef, {
                uid,
                email: data.email,
                displayName: data.displayName,
                firstName: data.firstName,
                lastName: data.lastName,
                phoneNumber: data.phoneNumber || '',
                assignedTeachers: [],
                assignedParents: [],
                status: 'active',
                createdAt: new Date().toISOString(),
                createdBy: request.auth.uid,
                updatedAt: new Date().toISOString(),
                updatedBy: request.auth.uid
            });
        }
        // 8. If teacher/parent assigned to learning partner, update LP
        if (data.learningPartnerId && (data.role === 'teacher' || data.role === 'parent')) {
            const lpRef = db.collection('users').doc(data.learningPartnerId);
            const lpDoc = await lpRef.get();
            if (lpDoc.exists) {
                const lpData = lpDoc.data();
                const field = data.role === 'teacher' ? 'assignedTeachers' : 'assignedParents';
                batch.update(lpRef, {
                    [field]: [...(lpData?.[field] || []), uid]
                });
            }
        }
        // Commit all changes atomically
        await batch.commit();
        console.log(`✅ User created successfully: ${userData.displayName} (${userData.role}) by admin ${request.auth.uid}`);
        return {
            success: true,
            uid,
            displayName: userData.displayName,
            role: userData.role,
            message: 'User created successfully'
        };
    }
    catch (error) {
        console.error('Error creating user:', error);
        // If it's already an HttpsError, rethrow it
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        // Handle Firebase Auth errors
        if (error.code === 'auth/email-already-exists') {
            throw new https_1.HttpsError('already-exists', 'Email is already in use');
        }
        if (error.code === 'auth/invalid-email') {
            throw new https_1.HttpsError('invalid-argument', 'Invalid email address');
        }
        if (error.code === 'auth/weak-password') {
            throw new https_1.HttpsError('invalid-argument', 'Password is too weak');
        }
        // Generic error
        throw new https_1.HttpsError('internal', error.message || 'Failed to create user');
    }
});
