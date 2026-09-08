import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const R8_CHANGE_PATH = /^(?:src\/content\/phonicsKnowledge\/[^/]+\.(?:js|d\.ts)|src\/tests\/seo\/resourcesR8[^/]+\.(?:js|ts)|scripts\/(?:audit-resources-r8-phonics-knowledge|phonics-knowledge-[a-z-]+)\.mjs|docs\/seo\/resources-architecture\/R8_PHONICS_KNOWLEDGE_DATASET\.md|\.github\/workflows\/resources-r8-phonics-knowledge\.yml)$/;
export function validateR8ChangedPaths(paths) {
  return paths.filter((p) => !R8_CHANGE_PATH.test(p)).map((p) => ({ code: 'public-surface-delta', id: p, detail: 'Brick 8 may change only its data, validation, tests, documentation and dedicated workflow.' }));
}
export function getR8ChangedPaths(root, base) {
  // Include working-tree changes and untracked files for local checks; CI has a clean checkout.
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  return [...new Set([...git('diff', '--name-only', base), ...git('ls-files', '--others', '--exclude-standard')])];
}
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
export function auditKnowledgePublicSurfaces(root, concepts, { dist = false } = {}) {
  const errors = [];
  const slugs = concepts.map((c) => c.futureSlugCandidate).filter(Boolean);
  const paths = ['src/lib/publicRouteManifest.js', 'src/app/routes.tsx', 'scripts/generate-sitemaps.js', 'scripts/prerender.mjs', 'public/llms.txt', 'firebase.json'];
  for (const p of paths) {
    if (!fs.existsSync(path.join(root, p))) { errors.push({ code: 'missing-safety-source', id: p }); continue; }
    const text = fs.readFileSync(path.join(root, p), 'utf8');
    for (const slug of slugs) if (text.includes(slug)) errors.push({ code: 'candidate-publication', id: p, detail: slug });
  }
  // An indirect import could create dynamic routes without writing literal candidate slugs.
  for (const file of walk(path.join(root, 'src'))) {
    const relative = path.relative(root, file).replaceAll('\\', '/');
    if (relative.startsWith('src/content/phonicsKnowledge/') || relative.startsWith('src/tests/') || /\.(spec|test)\./.test(relative) || !/\.[cm]?[jt]sx?$/.test(file)) continue;
    const source = fs.readFileSync(file, 'utf8');
    if (/\b(?:from\s*|import\s*\(?|require\s*\()\s*['"][^'"]*phonicsKnowledge/.test(source) || /import\.meta\.glob\([^)]*phonicsKnowledge/.test(source)) errors.push({ code: 'runtime-publication-import', id: relative });
  }
  const outputRoots = [path.join(root, 'public')];
  if (dist) {
    if (!fs.existsSync(path.join(root, 'dist/index.html'))) errors.push({ code: 'missing-build', id: 'dist/index.html' });
    outputRoots.push(path.join(root, 'dist'));
  }
  for (const dir of outputRoots) for (const file of walk(dir)) {
    if (!/\.html$|sitemap[^/]*\.xml$|llms[^/]*\.txt$/.test(file)) continue;
    const relative = path.relative(root, file);
    const source = fs.readFileSync(file, 'utf8');
    for (const slug of slugs) if (relative.split(path.sep).includes(slug) || source.includes(`/${slug}`)) errors.push({ code: 'candidate-output', id: relative, detail: slug });
  }
  return errors;
}
