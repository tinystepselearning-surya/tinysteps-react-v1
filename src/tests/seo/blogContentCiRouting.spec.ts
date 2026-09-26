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
] as const;

describe('blog content CI routing hardening', () => {
  it('uses a narrow content-only PR lane without weakening main-branch validation', () => {
    const deploy = read('.github/workflows/deploy.yml');

    expect(deploy).toContain('content_only_validation');
    expect(deploy).toContain('Run content-only blog and ownership tests');
    expect(deploy).toContain('Audit canonical ownership for content-only PR');
    expect(deploy).toContain('Audit phonics knowledge collisions for content-only PR');
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

    expect(r5).not.toContain("src/content/blog/posts/**");

    expect(r8).not.toContain("src/content/**");
    expect(r8).toContain("src/content/phonicsKnowledge/**");
    expect(r8).toContain("src/content/phonicsCurriculum/**");

    expect(r14).not.toContain("src/content/blog/**");

    expect(r15).not.toContain("src/content/blog/**");
    expect(r15).toContain('phonological-awareness-vs-phonemic-awareness-vs-phonics.ts');
    expect(r15).toContain('how-vocabulary-supports-reading-comprehension.ts');
    expect(r15).toContain('how-children-recognise-words-automatically-after-phonics.ts');
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
