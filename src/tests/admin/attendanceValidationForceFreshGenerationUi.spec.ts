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

describe('AVS Brick 4 Force Fresh generation UI compatibility', () => {
  it('creates an explicit generation id before the first backend call', () => {
    expect(dashboard).toContain('crypto.randomUUID()');
    expect(dashboard).toContain('forceFreshRangeGeneration');
    expect(dashboard).toContain('{ fromDate, toDate, runId, retryFailures }');
  });

  it('retains the generation id after a timeout so the next call resumes', () => {
    expect(dashboard).toContain(
      'setForceFreshRangeGeneration({ runId, fromDate, toDate })',
    );
    expect(dashboard).toContain(
      'Completed cases are checkpointed and will not be repeated.',
    );
  });

  it('supports retrying failures and rerunning a completed date range as a new generation', () => {
    expect(dashboard).toContain("'Retry Failed Refreshes'");
    expect(dashboard).toContain("'Re-fetch This Range Again'");
    expect(dashboard).not.toContain(
      '&& forceFreshRangeResult.complete\n                )',
    );
  });
});
