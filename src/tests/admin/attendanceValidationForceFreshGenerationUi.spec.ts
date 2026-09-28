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

describe('AVS range re-fetch UI deprecation', () => {
  it('has no broad range re-fetch button', () => {
    expect(dashboard).not.toContain('onClick={() => void forceFreshSelectedRange()}');
    expect(dashboard).toContain('onRefetch={async (item) =>');
  });
});
