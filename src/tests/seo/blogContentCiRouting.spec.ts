import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('local-first engineering workflow', () => {
  it('keeps GitHub Actions deployment-only', () => {
    const deploy = read('.github/workflows/deploy.yml');

    expect(deploy).toContain('push:');
    expect(deploy).toContain('branches: [main]');
    expect(deploy).toContain('workflow_dispatch:');
    expect(deploy).not.toContain('pull_request:');
    expect(deploy).not.toContain('Run affected unit tests');
    expect(deploy).not.toContain('Run critical regression pack');
    expect(deploy).not.toContain('Run full unit tests');
    expect(deploy).not.toContain('npm run lint');
    expect(deploy).not.toContain('npm run typecheck');
    expect(deploy).toContain('Build production Hosting artifact');
    expect(deploy).toContain('npm run build:deploy');
    expect(deploy).toContain('Deploy Cloud Functions in bounded batches');
    expect(deploy).toContain('Verify live deployment integrity and build identity');

    // Production Firebase mutation protection remains non-cancellable.
    expect(deploy).toContain('group: firebase-deployment-tinysteps-react-v1');
    expect(deploy).toContain('cancel-in-progress: false');
  });

  it('keeps ongoing engineering validation on the local Mac', () => {
    const pkg = JSON.parse(read('package.json'));
    const preflight = read('scripts/preflight.mjs');

    expect(pkg.scripts.preflight).toBe('node scripts/preflight.mjs');
    expect(pkg.scripts['preflight:plan']).toBe('node scripts/preflight.mjs --plan');
    expect(pkg.scripts['preflight:full']).toBe('node scripts/preflight.mjs --full');
    expect(pkg.scripts['test:full']).toBe('vitest run');

    expect(preflight).toContain('Affected unit tests');
    expect(preflight).toContain('Critical regression pack');
    expect(preflight).toContain('Functions unit tests');
    expect(preflight).toContain('Enrollment integrity emulator');
    expect(preflight).toContain('Firestore rules emulator tests');
    expect(preflight).toContain('R8 phonics/resource tests');
    expect(preflight).toContain('Local production build + audits');
  });

  it('separates deployment artifact generation from local quality audits', () => {
    const pkg = JSON.parse(read('package.json'));

    expect(pkg.scripts['build:deploy']).toContain('generate:rss');
    expect(pkg.scripts['build:deploy']).toContain('gen:sitemaps');
    expect(pkg.scripts['build:deploy']).toContain('vite build');
    expect(pkg.scripts['build:deploy']).toContain('write-build-info.mjs');
    expect(pkg.scripts['build:deploy']).toContain('prerender.mjs');
    expect(pkg.scripts['build:deploy']).not.toContain('seo:smoke');
    expect(pkg.scripts['build:deploy']).not.toContain('seo:rendered-check');
    expect(pkg.scripts['build:deploy']).not.toContain('content:offer-consistency');
  });
});
