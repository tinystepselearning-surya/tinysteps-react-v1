import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '../../..');
const auditScript = path.join(repoRoot, 'scripts', 'audit-blog-baseline.mjs');
const fixedEnv = {
  ...process.env,
  BLOG_AUDIT_DATE: '2026-08-28',
};

function runAudit(args: string[] = []) {
  return execFileSync(process.execPath, [auditScript, ...args], {
    cwd: repoRoot,
    env: fixedEnv,
    encoding: 'utf8',
  });
}

describe('B0 blog baseline audit', () => {
  it('executes successfully in normal mode and reports the frozen inventory', () => {
    const output = runAudit();

    expect(output).toContain('[blog-b0] baseline inventory');
    expect(output).toContain('"sourcePostFiles": 77');
    expect(output).toContain('"routedPostSlugs": 77');
    expect(output).toContain('"duplicateSlugs": 0');
    expect(output).toContain('"publishedPosts": 77');
    expect(output).toContain('"weeklyPosts": 27');
    expect(output).toContain('"pageNoindexPosts": 24');
    expect(output).toContain('"indexableByPageRobots": 53');
    expect(output).toContain('"expectedGeneratedSitemapPosts": 52');
    expect(output).toContain('"retiredRedirectSources": 11');
    expect(output).toContain('[blog-b0] PASS: registry structure is internally consistent.');
  });

  it('executes successfully in strict mode on the exact same source inventory', () => {
    const output = runAudit(['--strict']);

    expect(output).toContain('"duplicateSlugs": 0');
    expect(output).toContain('[blog-b0] PASS: registry structure is internally consistent.');
  });
});
