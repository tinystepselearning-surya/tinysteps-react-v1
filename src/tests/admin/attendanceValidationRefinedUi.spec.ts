import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const dashboard = fs.readFileSync(
  path.resolve(
    process.cwd(),
    'src/pages/admin/AttendanceValidationDashboard.tsx',
  ),
  'utf8',
);

describe('AVS Brick 5 refined admin operator model', () => {
  it('keeps exactly two normal range actions', () => {
    expect(dashboard).toContain('Load Results');
    expect(dashboard).toContain('Run Validation');
    expect(dashboard).toContain('Continue Validation');
    expect(dashboard).not.toContain('Run Latest Check');
    expect(dashboard).not.toContain('Sync Teacher Identities');
    expect(dashboard).not.toContain('Run First-Time Baseline');
  });

  it('keeps expensive Teams re-fetch under Advanced', () => {
    expect(dashboard).toContain('Advanced');
    expect(dashboard).toContain('Re-fetch Teams Data');
    expect(dashboard).toContain('Retry Failed Re-fetches');
    expect(dashboard).toContain('Continue Re-fetch');
  });

  it('keeps the row-level re-fetch action and no realtime behavior', () => {
    expect(dashboard).toContain('Re-fetch this case');
    expect(dashboard).toContain('Nothing refreshes automatically.');
    expect(dashboard).not.toContain('onSnapshot(');
  });

  it('routes normal validation only through the unified Brick 3 backend', () => {
    expect(dashboard).toContain("'runAttendanceValidationRange'");
    expect(dashboard).not.toContain("'runAttendanceValidationLatestCheck'");
    expect(dashboard).not.toContain("'runAttendanceValidationFirstTimeBaseline'");
  });
});
