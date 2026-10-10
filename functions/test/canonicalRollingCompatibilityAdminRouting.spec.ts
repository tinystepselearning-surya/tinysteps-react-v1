import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const source = readFileSync(
  resolve(process.cwd(), 'functions/src/scheduling/rollingScheduleCompatibility.ts'),
  'utf8',
);

describe('R5C2C32 rolling compatibility canonical Admin authorization', () => {
  it('uses canonical Admin for all eight compatibility callables with no legacy fallback', () => {
    expect(source).toContain("from '../helpers/canonicalAdminGuard'");
    expect(source).not.toContain("from '../helpers/adminGuard'");
    expect(source).not.toContain('await ensureAdmin(request.auth);');
    expect(source.match(/await ensureCanonicalAdmin\(request\.auth\);/g)).toHaveLength(8);
  });

  it('preserves the rolling-aware compatibility routing contract', () => {
    expect(source).toContain('isCanonicalRollingEnrollment');
    expect(source).toContain('materializeRollingEnrollmentWindowInternal');
    expect(source).toContain('setRollingEnrollmentLifecycle');
    expect(source).toContain('reconcileRollingEnrollmentSchedule');
    expect(source).toContain('legacyCreateEnrollment');
    expect(source).toContain('legacySetEnrollmentStatus');
  });
});
