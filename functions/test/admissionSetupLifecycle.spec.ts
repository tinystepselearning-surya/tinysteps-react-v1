import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const lifecycleSource = source('functions/src/lifecycle.ts');
const statusSource = source('functions/src/helpers/status.ts');
const rollingLifecycleSource = source('functions/src/scheduling/rollingScheduleLifecycle.ts');
const transitionSource = source('functions/src/scheduling/rollingScheduleCourseTransition.ts');

describe('admission setup lifecycle hardening contracts', () => {
  it('reserves setup_pending course slots while keeping creation intent explicit', () => {
    expect(statusSource).toContain("| 'setup_pending'");
    expect(statusSource).toContain("raw === 'setup_pending'");
    expect(lifecycleSource).toContain("type EnrollmentCreationIntent = 'initial_course' | 'additional_course' | 'transition'");
    expect(lifecycleSource).toContain("creationIntent must be initial_course or additional_course");
    expect(lifecycleSource).toContain("This student already has an operational enrollment. Use Add Additional Course or Change Course.");
    expect(lifecycleSource).toContain("This student has no existing operational enrollment. Use Assign Course instead.");
    expect(lifecycleSource).toContain("status: setupPending ? 'setup_pending' : 'active'");
    expect(lifecycleSource).toContain("creationIntent === 'transition' && options.creationIntentOverride !== 'transition'");
  });

  it('allows setup financial and draft writes only while setup_pending', () => {
    expect(lifecycleSource).toContain('export const updateEnrollmentFinancialTerms');
    expect(lifecycleSource).toContain('export const saveEnrollmentSetupDraft');
    expect(lifecycleSource).toContain("normalizedStatus !== 'setup_pending'");
    expect(lifecycleSource).toContain("normalizeEnrollmentStatus(enrollment.status) !== 'setup_pending'");
    expect(lifecycleSource).toContain("Setup financial terms can only be changed while the enrollment is setup_pending");
    expect(lifecycleSource).toContain("Setup drafts can only be saved while the enrollment is setup_pending");
    expect(lifecycleSource).toContain("financialTermChanges");
  });

  it('activates setup_pending atomically with its initial rolling sessions', () => {
    expect(rollingLifecycleSource).toContain('async function activateSetupPendingEnrollmentAtomically');
    expect(rollingLifecycleSource).toContain("normalizeEnrollmentStatus(initialEnrollment.status) === 'setup_pending'");
    expect(rollingLifecycleSource).toContain('return activateSetupPendingEnrollmentAtomically({');
    expect(rollingLifecycleSource).toContain('Assign a teacher before completing admission setup');
    expect(rollingLifecycleSource).toContain('Set valid financial terms before completing admission setup');
    expect(rollingLifecycleSource).toContain('const sessionSnaps = await Promise.all(sessionRefs.map((ref) => tx.get(ref)))');
    expect(rollingLifecycleSource).toContain('prepared.forEach(({occurrence, payload}) => {');
    expect(rollingLifecycleSource).toContain("tx.create(db.collection('classSessions').doc(occurrence.sessionId), payload)");
    expect(rollingLifecycleSource).toContain("status: 'active'");
    expect(rollingLifecycleSource).toContain('setupPending: false');
    expect(rollingLifecycleSource).toContain('setupDraft: FieldValue.delete()');
    const firstWrite = rollingLifecycleSource.indexOf("tx.create(db.collection('classSessions').doc(occurrence.sessionId), payload)");
    const enrollmentActivation = rollingLifecycleSource.indexOf("status: 'active'", firstWrite);
    expect(firstWrite).toBeGreaterThan(-1);
    expect(enrollmentActivation).toBeGreaterThan(firstWrite);
    expect(rollingLifecycleSource.slice(
      rollingLifecycleSource.indexOf('async function activateSetupPendingEnrollmentAtomically'),
      rollingLifecycleSource.indexOf('export const saveRollingEnrollmentSchedule'),
    )).not.toContain('materializeRollingEnrollmentWindowInternal');
  });

  it('keeps progression and correction semantically distinct', () => {
    expect(transitionSource).toContain("type CourseTransitionType = 'progression' | 'correction'");
    expect(transitionSource).toContain("transitionTypeRaw === 'progression' || transitionTypeRaw === 'correction'");
    expect(transitionSource).toContain("transitionType === 'correction'");
    expect(transitionSource).toContain("Number(oldEnrollment.creditsRemaining ?? 0)");
    expect(transitionSource).toContain("const targetOldStatus = transitionType === 'progression' ? 'completed' : 'discontinued'");
    expect(transitionSource).toContain("correctedFromEnrollmentId: oldEnrollmentId");
    expect(transitionSource).toContain("creditCarryoverFromEnrollmentId: oldEnrollmentId");
    expect(transitionSource).toContain("creditCarryoverAmount: destinationCreditsTotal");
    expect(transitionSource).toContain("enrollment_course_progression_completed");
    expect(transitionSource).toContain("enrollment_course_correction_completed");
  });

  it('makes destination link continuity authoritative before rolling materialization', () => {
    const createIndex = transitionSource.indexOf('createEnrollmentForCourseTransitionInternal');
    const materializeIndex = transitionSource.indexOf('materializeRollingEnrollmentWindowInternal');
    expect(createIndex).toBeGreaterThan(-1);
    expect(materializeIndex).toBeGreaterThan(createIndex);
    expect(transitionSource).toContain('joinUrl: inheritedJoinUrl');
    expect(transitionSource).not.toContain('repairEnrollmentFutureSessionsFromScheduleInternal');
  });
});
