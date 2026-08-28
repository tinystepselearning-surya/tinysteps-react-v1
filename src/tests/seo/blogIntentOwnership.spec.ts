import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('blog intent ownership', () => {
  it('keeps final B2 ownership, redirects, GSC evidence and noindex support rules valid', () => {
    const output = execFileSync(process.execPath, ['scripts/audit-blog-intent-ownership.mjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });

    expect(output).toContain('[blog-b2] 18 final intent clusters');
    expect(output).toContain('[blog-b2] 0 unresolved ownership decisions');
    expect(output).toContain('[blog-b2] 1 planned merge(s) for B3 implementation');
    expect(output).toContain('[blog-b2] 2 evergreen + supporting-noindex relationship(s) validated');
    expect(output).toContain(
      '[blog-b2] PASS: final intent ownership, redirect lineage, GSC evidence and support-page policy are internally consistent.',
    );
  });
});
