import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

const workflows = [
  '.github/workflows/deploy.yml',
  '.github/workflows/seo-crawl-discovery.yml',
  '.github/workflows/seo-dead-url-guard.yml',
  '.github/workflows/resources-r5-topic-ownership.yml',
  '.github/workflows/resources-r8-phonics-knowledge.yml',
  '.github/workflows/resources-r14-reading-knowledge-architecture.yml',
  '.github/workflows/resources-r15-high-value-reading-content.yml',
  '.github/workflows/resources-r18-high-value-grammar-writing-content.yml',
  '.github/workflows/resources-r21-high-value-speaking-content.yml',
  '.github/workflows/session-c-speaking-communication-completion.yml',
  '.github/workflows/gr2-grammar-tense-architecture.yml',
  '.github/workflows/gr3-grammar-writing-progression.yml',
  '.github/workflows/gr4-grammar-parent-problems.yml',
] as const;

describe('blog content CI routing hardening', () => {
  it('uses a narrow content-only PR lane without weakening main-branch validation', () => {
    const deploy = read('.github/workflows/deploy.yml');

    expect(deploy).toContain('content_only_validation');
    expect(deploy).toContain('Run content-only blog and ownership tests');
    expect(deploy).toContain('Audit canonical ownership for content-only PR');
    expect(deploy).toContain('Audit phonics knowledge collisions for content-only PR');
    expect(deploy).toContain('Audit controlled reading, grammar and speaking content for content-only PR');
    expect(deploy).toContain('Run full unit tests');
    expect(deploy).toContain("github.event_name != 'pull_request' || needs.analyze-changes.outputs.content_only_validation != 'true'");
    expect(deploy).toContain('npm run build');
    expect(deploy).toContain('npm run seo:smoke');

    // Production Firebase mutation protection remains independent and non-cancellable.
    expect(deploy).toContain('group: firebase-deployment-tinysteps-react-v1');
    expect(deploy).toContain('cancel-in-progress: false');
  });

  it('does not launch cumulative brick workflows for routine blog-post edits', () => {
    const r5 = read('.github/workflows/resources-r5-topic-ownership.yml');
    const r8 = read('.github/workflows/resources-r8-phonics-knowledge.yml');
    const r14 = read('.github/workflows/resources-r14-reading-knowledge-architecture.yml');
    const r15 = read('.github/workflows/resources-r15-high-value-reading-content.yml');
    const r18 = read('.github/workflows/resources-r18-high-value-grammar-writing-content.yml');
    const r21 = read('.github/workflows/resources-r21-high-value-speaking-content.yml');
    const sessionC = read('.github/workflows/session-c-speaking-communication-completion.yml');
    const gr2 = read('.github/workflows/gr2-grammar-tense-architecture.yml');
    const gr3 = read('.github/workflows/gr3-grammar-writing-progression.yml');
    const gr4 = read('.github/workflows/gr4-grammar-parent-problems.yml');

    expect(r5).not.toContain("src/content/blog/posts/**");

    expect(r8).not.toContain("src/content/**");
    expect(r8).toContain("src/content/phonicsKnowledge/**");
    expect(r8).toContain("src/content/phonicsCurriculum/**");

    expect(r14).not.toContain("src/content/blog/**");
    expect(r15).not.toContain("src/content/blog/");
    expect(r18).not.toContain("src/content/blog/posts/");
    expect(r21).not.toContain("src/content/blog/posts/");
    expect(sessionC).not.toContain("src/content/blog/posts/");
    expect(gr2).not.toContain("src/content/blog/posts/");
    expect(gr3).not.toContain("src/content/blog/posts/");
    expect(gr4).not.toContain("src/content/blog/posts/");
  });

  it('cancels stale PR validation runs while preserving production deployment completion', () => {
    for (const workflow of workflows) {
      const source = read(workflow);
      expect(source, workflow).toContain(
        'group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}',
      );
      expect(source, workflow).toContain(
        "cancel-in-progress: ${{ github.event_name == 'pull_request' }}",
      );
    }
  });
});
