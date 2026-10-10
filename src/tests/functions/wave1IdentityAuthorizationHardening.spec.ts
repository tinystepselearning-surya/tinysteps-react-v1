import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('Wave 1 current-user authorization invariant', () => {
  const adminGuard = read('functions/src/helpers/adminGuard.ts');
  const lifecycle = read('functions/src/lifecycle.ts');
  const makeup = read('functions/src/createMakeupSessionFromCredit.ts');
  const refreshPublicKb = read('functions/src/ai/refreshPublicKb.ts');
  const sendMessage = read('functions/src/messaging/sendMessage.ts');
  const createThread = read('functions/src/messaging/createOrSyncMessageThread.ts');
  const parentStudents = read('functions/src/parentStudents.ts');
  const sessionComplete = read('functions/src/onSessionComplete.ts');
  const parentWorksheets = read('functions/src/getParentWorksheetResources.ts');
  const classReminders = read('functions/src/notifications/classReminders.ts');
  const teacherProgress = read('functions/src/saveTeacherSessionProgress.ts');
  const parentAttendance = read('functions/src/bootstrapParentClassAttendanceV2.ts');
  const parentProgress = read('functions/src/parentCanonicalProjectionBootstrap.ts');
  const payWithholdings = read('functions/src/getAdminTeacherPayWithholdings.ts');
  const earningAdjustments = read('functions/src/getAdminTeacherEarningAdjustments.ts');
  const attendanceCorrection = read('functions/src/adminAttendanceCorrectionTeacherPayDecision.ts');
  const leadWorkflow = read('functions/src/adminLeadWorkflow.ts');
  const demoWorkflow = read('functions/src/demoSessionsLegacy.ts');
  const phonicsEnforcer = read('functions/src/phonicsCurriculumEnforcer.ts');
  const lessonAccess = read('functions/src/createLessonAccessSession.ts');
  const recordLevelResult = read('functions/src/games/recordLevelResult.ts');
  const rules = read('firestore.rules');
  const storageRules = read('storage.rules');

  it('requires a current users document for callable Admin authorization', () => {
    expect(adminGuard).toContain("collection('users')");
    expect(adminGuard).toContain('stale/orphan Admin claim rejected');
    expect(adminGuard).toContain('if (!snap.exists)');
    expect(adminGuard).toContain('if (!isActiveOrLegacyUser(data))');
    expect(adminGuard).not.toContain('if (isAdmin) return;');
  });

  it('removes direct token-only Admin bypasses from known callable guards', () => {
    expect(lifecycle).not.toContain(
      "if (auth.token?.role === 'admin' || auth.token?.admin === true) return;",
    );

    expect(makeup).toContain(
      "collection('users').doc(auth.uid).get()",
    );
    expect(makeup).not.toContain(
      'const tokenRole = normalizeRole(auth.token?.role)',
    );

    expect(refreshPublicKb).toContain(
      'await ensureCanonicalAdmin(request.auth);',
    );
    expect(refreshPublicKb).toContain(
      "from \"../helpers/canonicalAdminGuard\"",
    );
    expect(refreshPublicKb).not.toContain(
      "from \"../helpers/adminGuard\"",
    );
    expect(sendMessage).toContain('await ensureCanonicalAdmin(auth);');
    expect(createThread).toContain('await ensureCanonicalAdmin(auth);');
    expect(sendMessage).not.toContain('function isTokenAdmin');
    expect(createThread).not.toContain('function isTokenAdmin');

    expect(lessonAccess).toContain('collection("users").doc(auth.uid).get()');
    expect(lessonAccess).not.toContain('auth.token?.role');

    expect(recordLevelResult).toContain(
      'await ensureCanonicalAdmin(request.auth);',
    );
    expect(recordLevelResult).not.toContain('isAdminClaim');

    for (const source of [
      payWithholdings,
      earningAdjustments,
    ]) {
      expect(source).toContain('ensureCanonicalAdmin');
      expect(source).not.toContain("from './helpers/adminGuard'");
      expect(source).not.toMatch(
        /if\s*\([^\n]*token[^\n]*(?:role|admin)[^\n]*\)\s*return/,
      );
    }

    expect(attendanceCorrection).toContain('ensureCanonicalAdmin');
    expect(attendanceCorrection).not.toContain("from './helpers/adminGuard'");
    expect(phonicsEnforcer).toContain('ensureCanonicalAdmin');
    for (const source of [attendanceCorrection, phonicsEnforcer]) {
      expect(source).not.toMatch(
        /if\s*\([^\n]*token[^\n]*(?:role|admin)[^\n]*\)\s*return/,
      );
    }
  });

  it('requires current Firestore identity before parent/teacher/role actions', () => {
    expect(parentStudents).toContain('await ensureCanonicalAdmin(auth);');
    expect(parentStudents).toContain(
      "from './helpers/canonicalAdminGuard'",
    );
    expect(parentStudents).not.toContain(
      "from './helpers/adminGuard'",
    );
    expect(parentStudents).toContain('executeCanonicalLearnerCreate');
    expect(parentStudents).toContain(
      "from './schoolOS/identity/canonicalPrimaryWriter'",
    );
    expect(parentStudents).not.toMatch(/collection\((['"])users\1\)/);

    for (const source of [
      sessionComplete,
      parentWorksheets,
      classReminders,
      teacherProgress,
      parentAttendance,
      parentProgress,
    ]) {
      expect(source).toMatch(/collection\((['"])users\1\)/);
    }

    expect(parentStudents).not.toContain('Prefer custom claims (faster)');
    expect(sessionComplete).not.toContain(
      'const tokenRole = normalizeCallerRole(auth?.token?.role)',
    );
    expect(classReminders).not.toContain(
      'const roleFromToken = normalizeRole(auth.token?.role)',
    );
    expect(teacherProgress).not.toContain(
      'const tokenRole = normalizeRole(auth?.token?.role)',
    );
    expect(parentAttendance).not.toContain(
      'const tokenRole = text(request.auth?.token?.role)',
    );
    expect(parentProgress).not.toContain(
      'const tokenRole = text(request.auth?.token?.role)',
    );
  });

  it('does not fall back to token roles after a business user record is loaded', () => {
    expect(leadWorkflow).not.toContain(
      'normalizeRole(data.role || auth?.token?.role)',
    );
    expect(demoWorkflow).not.toContain(
      'normalizeRole(userData.role) || normalizeRole(auth?.token?.role)',
    );
  });

  it('requires current Firestore-backed Admin identity for privileged Storage writes', () => {
    expect(storageRules).toContain('function isCurrentAdmin()');
    expect(storageRules).toContain('firestore.exists(');
    expect(storageRules).toContain('firestore.get(');
    expect(storageRules).toContain('userIsActiveOrLegacy(request.auth.uid)');
    expect(storageRules).toContain('allow write: if isCurrentAdmin();');
    expect(storageRules).not.toContain(
      'allow write: if request.auth != null && request.auth.token.admin == true;',
    );
  });

  it('does not treat custom role claims as Firestore business authority', () => {
    expect(rules).not.toContain('function tokenRole()');
    expect(rules).not.toContain('function isAdminToken()');
    expect(rules).not.toContain('function isTeacherToken()');
    expect(rules).not.toContain('function isParentToken()');
    expect(rules).not.toContain('function isLPToken()');
    expect(rules).not.toContain('function isSchoolAdminToken()');
    expect(rules).not.toContain('function isKidToken()');

    const adminStart = rules.indexOf('function isAdmin()');
    const founderStart = rules.indexOf('function isFounder()');
    expect(adminStart).toBeGreaterThanOrEqual(0);
    expect(founderStart).toBeGreaterThan(adminStart);

    const adminBlock = rules.slice(adminStart, founderStart);
    expect(adminBlock).toContain('userIsActiveOrLegacy(request.auth.uid)');
    expect(adminBlock).toContain("userRole(request.auth.uid) == 'admin'");
    expect(adminBlock).not.toContain('request.auth.token.role');
  });

  it('requires current Firestore identity for generic portal role predicates', () => {
    for (const functionName of [
      'isFounder',
      'isSchoolAdmin',
      'isTeacher',
      'isParent',
      'isLP',
      'isKid',
    ]) {
      const start = rules.indexOf(`function ${functionName}()`);
      expect(start).toBeGreaterThanOrEqual(0);
      const end = rules.indexOf('\n    }', start);
      const block = rules.slice(start, end + 6);
      expect(block).toContain(
        'userIsActiveOrLegacy(request.auth.uid)',
      );
    }
  });

  it('uses current role predicates for class-session list authorization', () => {
    const start = rules.indexOf('match /classSessions/{sessionId}');
    const end = rules.indexOf(
      '// RESCHEDULE CREDITS COLLECTION',
      start,
    );
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const block = rules.slice(start, end);
    expect(block).toContain('isParent()');
    expect(block).toContain('isKid()');
    expect(block).not.toContain('isParentToken()');
    expect(block).not.toContain('isKidToken()');
  });
});
