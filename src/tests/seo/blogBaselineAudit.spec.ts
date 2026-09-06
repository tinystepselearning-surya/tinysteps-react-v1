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
  it('executes successfully in normal mode and reports the integrated post-B3 inventory', () => {
    const output = runAudit();

    expect(output).toContain('[blog-b0] baseline inventory');
    expect(output).toContain('"sourcePostFiles": 76');
    expect(output).toContain('"routedPostSlugs": 76');
    expect(output).toContain('"duplicateSlugs": 0');
    expect(output).toContain('"publishedPosts": 76');
    expect(output).toContain('"weeklyPosts": 12');
    expect(output).toContain('"pageNoindexPosts": 0');
    expect(output).toContain('"indexableByPageRobots": 76');
    expect(output).toContain('"expectedGeneratedSitemapPosts": 75');
    expect(output).toContain('"committedSitemapBlogUrls": 75');
    expect(output).toContain('"missingExpectedFromCommittedSitemap": []');
    expect(output).toContain('"unexpectedCommittedSitemapSlugs": []');
    expect(output).toContain('"retiredRedirectSources": 12');
    expect(output).toContain('[blog-b0] PASS: registry structure is internally consistent.');
  });

  it('executes successfully in strict mode on the exact same source inventory', () => {
    const output = runAudit(['--strict']);

    expect(output).toContain('"duplicateSlugs": 0');
    expect(output).toContain('[blog-b0] PASS: registry structure is internally consistent.');
  });
});
