import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('manual demo lead received-date contract', () => {
  it('keeps an explicit Request Received Date in the admin Create Demo flow', () => {
    const adminUi = read('src/pages/admin/LegacyDemoSessionsManagement.tsx');
    const service = read('src/services/demoSessionsService.ts');

    expect(adminUi).toContain('Request Received Date *');
    expect(adminUi).toContain('id="demo-request-received-date"');
    expect(adminUi).toContain("requestReceivedDate: form.requestReceivedDate");
    expect(service).toContain('requestReceivedDate: input.requestReceivedDate');
  });

  it('uses the manually entered receipt date only to initialize a lead that has no receivedAt yet', () => {
    const backend = read('functions/src/demoSessionsLegacy.ts');

    expect(backend).toContain('if (!existingLead.receivedAt)');
    expect(backend).toContain('requestDateTimestamp(requestReceivedDate)');
    expect(backend).toContain("leadPayload.sourceDetail = 'manual_demo_request'");
  });
});
