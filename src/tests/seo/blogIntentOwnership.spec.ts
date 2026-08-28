import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('blog intent ownership', () => {
  it('keeps B2 intent, redirect-lineage and GSC protection rules valid', () => {
    const output = execFileSync(process.execPath, ['scripts/audit-blog-intent-ownership.mjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });

    expect(output).toContain('[blog-b2] 17 reviewed intent clusters');
    expect(output).toContain('[blog-b2] 7 cluster(s) protected by user-shared GSC visibility evidence');
    expect(output).toContain(
      '[blog-b2] PASS: intent ownership, redirect lineage and GSC protection rules are internally consistent.',
    );
  });
});
