import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const indexSource = source('functions/src/index.ts');
const compatibilitySource = source('functions/src/scheduling/rollingScheduleCompatibility.ts');
const transitionSource = source('functions/src/scheduling/rollingScheduleCourseTransition.ts');
const workerSource = source('functions/src/scheduled/rollingScheduleEdgeReplenisher.ts');

describe('rolling schedule production hardening contracts', () => {
  it('routes legacy callable names through the rolling-aware compatibility surface', () => {
    expect(indexSource).toContain('from "./scheduling/rollingScheduleCompatibility"');
    expect(indexSource).toContain('from "./scheduling/rollingScheduleCourseTransition"');
    expect(indexSource).not.toMatch(/export \{ createSessionsFromSchedule \} from ["']\.\/createSessionsFromSchedule["']/);
    expect(indexSource).not.toMatch(/export \{ saveEnrollmentScheduleAndGenerateSessions \} from ["']\.\/createSessionsFromSchedule["']/);
    expect(indexSource).not.toMatch(/setEnrollmentStatus,[\s\S]{0,300}from ["']\.\/lifecycle["']/);
  });

  it('keeps canonical rolling enrollments out of the finite generator through old entry points', () => {
    expect(compatibilitySource).toContain('if (!isCanonicalRollingEnrollment(enrollment))');
    expect(compatibilitySource).toContain('materializeRollingEnrollmentWindowInternal');
    expect(compatibilitySource).toContain('setRollingEnrollmentLifecycle');
    expect(compatibilitySource).toContain('reconcileRollingEnrollmentSchedule');
  });

  it('never uses the finite schedule generator during the production course-transition path', () => {
    expect(transitionSource).toContain('materializeRollingEnrollmentWindowInternal');
    expect(transitionSource).toContain('buildCanonicalRollingScheduleDefinition');
    expect(transitionSource).not.toContain('createSessionsFromSchedule');
    expect(transitionSource).not.toContain('repairEnrollmentFutureSessionsFromSchedule');
    expect(transitionSource).not.toContain('legacyTransitionEnrollmentCourse');
  });

  it('transactionally fences edge creation and pointer advancement against lifecycle/revision races', () => {
    expect(workerSource).toContain('db.runTransaction(async (tx) =>');
    expect(workerSource).toContain('const enrollmentSnap = await tx.get(enrollmentRef)');
    expect(workerSource).toContain('const plan = buildRollingScheduleDueEdgePlan');
    expect(workerSource).toContain("tx.create(db.collection('classSessions').doc(occurrence.sessionId), payload)");
    expect(workerSource).toContain('tx.update(enrollmentRef, buildMaterializationPatch(plan.finalMaterialization))');
    expect(workerSource.indexOf('const enrollmentSnap = await tx.get(enrollmentRef)')).toBeLessThan(
      workerSource.indexOf("tx.create(db.collection('classSessions').doc(occurrence.sessionId), payload)"),
    );
  });

  it('retains bounded due-pointer discovery and does not scan classSessions for worker work', () => {
    expect(workerSource).toContain(".where('scheduleMaterialization.nextMaterializationDueYmd', '<=', todayYmd)");
    expect(workerSource).toContain(".orderBy('scheduleMaterialization.nextMaterializationDueYmd', 'asc')");
    expect(workerSource).toContain('.limit(MAX_ROLLING_EDGE_ENROLLMENTS_PER_RUN)');
    expect(workerSource).not.toContain("collection('classSessions').where");
    expect(workerSource).not.toContain("where('enrollmentId'");
  });
});
