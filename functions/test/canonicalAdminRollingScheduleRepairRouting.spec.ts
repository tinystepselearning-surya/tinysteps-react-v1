import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const repair = read('functions/src/scheduling/rollingScheduleRepair.ts');
const index = read('functions/src/index.ts');

describe('Wave 1 R5C2C27 rolling schedule repair canonical Admin authorization', () => {
  it('requires canonical Admin access with no legacy fallback', () => {
    expect(repair).toContain("from '../helpers/canonicalAdminGuard'");
    expect(repair).toContain('await ensureCanonicalAdmin(request.auth);');
    expect(repair).not.toContain("from '../helpers/adminGuard'");
    expect(repair).not.toContain('await ensureAdmin(request.auth);');
  });

  it('preserves the existing dry-run-first, bounded, create-only repair contract', () => {
    expect(repair).toContain("const apply = input.apply === true");
    expect(repair).toContain('expectedMissingCount');
    expect(repair).toContain('ROLLING_SCHEDULE_REPAIR_CONFIRMATION');
    expect(repair).toContain('MAX_ROLLING_SCHEDULE_REPAIR_ENROLLMENTS = 250');
    expect(repair).toContain("tx.create(db.collection('classSessions').doc(occurrence.sessionId), payload)");
    expect(repair).not.toContain('.delete(');
    expect(repair).not.toContain("collection('classSessions').where");
  });

  it('retains exactly the existing deployed repair entry point', () => {
    expect(repair).toContain('export const adminRepairRollingScheduleMaterialization = onCall(');
    expect(index).toContain(
      'export { adminRepairRollingScheduleMaterialization } from "./scheduling/rollingScheduleRepair";',
    );
  });
});
