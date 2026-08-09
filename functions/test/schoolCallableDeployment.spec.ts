import { describe, expect, it } from 'vitest';

import * as schoolFunctions from '../src/index';
import { adminCreateSchool } from '../src/schools';
import { schoolGetProgrammeSnapshot } from '../src/schoolRead';
import { verifyFunctionDeploymentMetadata } from '../../scripts/verify-function-deployment-metadata.mjs';

describe('School callable deployment contract', () => {
  it('exports every School browser callable in asia-south1 with public transport invocation', () => {
    const verification = verifyFunctionDeploymentMetadata(schoolFunctions);

    expect(verification.failures).toEqual([]);
    expect(verification.passed).toBe(true);
  });

  it('still rejects unauthenticated admin and programme requests at the application layer', async () => {
    await expect(
      (adminCreateSchool as any).run({ data: {}, auth: null }),
    ).rejects.toMatchObject({ code: 'unauthenticated' });

    await expect(
      (schoolGetProgrammeSnapshot as any).run({
        data: { schoolId: 'school-a' },
        auth: null,
      }),
    ).rejects.toMatchObject({ code: 'unauthenticated' });
  });
});
