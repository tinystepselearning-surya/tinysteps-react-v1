import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const failures = [];
const checks = [];
const addFailure = (id, detail) => failures.push(`${id}: ${detail}`);
const check = (condition, id, detail) => {
  checks.push(id);
  if (!condition) addFailure(id, detail);
};
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const requiredFiles = [
  'src/lib/commercialC7KnowledgeConversionAudit.ts',
  'src/tests/seo/commercialC7KnowledgeConversionAudit.spec.ts',
  'scripts/audit-commercial-c7-r0-knowledge-conversion.mjs',
  'docs/seo/commercial-growth/C7_R0_KNOWLEDGE_CONVERSION_AUDIT_2026-09-11.md',
  '.github/workflows/commercial-c7-knowledge-conversion.yml',
];

for (const relativePath of requiredFiles) {
  check(fs.existsSync(path.join(root, relativePath)), `required-file:${relativePath}`, 'missing');
}

const model = read('src/lib/commercialC7KnowledgeConversionAudit.ts');
const authority = read('src/content/blog/shared/authorityLinking.ts');
const subjectHub = read('src/pages/SubjectResourcesPage.tsx');
const phonicsKnowledgePage = read('src/pages/PhonicsKnowledgePage.tsx');
const kbFinal = read('src/lib/knowledgeBaseFinalClosure.js');
const c6Freeze = read('src/lib/commercialC6ValidationFreeze.ts');

check(model.includes("COMMERCIAL_C7_R0_STATUS = 'knowledge-conversion-audit-complete'"), 'c7-status', 'R0 status marker missing');
check(model.includes('B7_BLOG_AUTHORITY_PLANS.length !== 51'), 'blog-baseline', '51-post blog baseline guard missing');
check(model.includes('PHONICS_PUBLISHED_RESOURCE_PAGES.length !== 31'), 'phonics-publication-baseline', '31-page phonics baseline guard missing');
check(model.includes('frozenCommercialOwnerPaths.length !== 14'), 'commercial-owner-baseline', '14-owner C2 guard missing');
check(model.includes("singleConversionOwner: '/book-demo'"), 'single-conversion-owner', '/book-demo guard missing');
check(model.includes('liveKnowledgeCopyChangesAllowed: false'), 'audit-only-copy', 'R0 must not authorise knowledge copy changes');
check(model.includes('c4MetadataMutationAllowed: false'), 'c4-protection', 'C4 metadata protection missing');
check(model.includes('c6ArchitectureMutationAllowed: false'), 'c6-protection', 'C6 freeze protection missing');

check(authority.includes('export const B7_BLOG_AUTHORITY_PLANS'), 'blog-authority-registry', 'B7 authority registry missing');
check(authority.includes("slug: 'online-english-classes-for-kids-india'"), 'buyer-guide-present', 'broad-English buyer guide plan missing');
check(authority.includes("to: '/courses'"), 'buyer-guide-courses-handoff', 'expected current /courses handoff missing');
check(authority.includes("to: '/class-samples'"), 'buyer-guide-class-samples-handoff', 'expected current /class-samples handoff missing');

check(subjectHub.includes("programmeTo: '/phonics'"), 'phonics-hub-programme', 'phonics hub programme handoff missing');
check(subjectHub.includes("programmeTo: '/grammar'"), 'grammar-hub-programme', 'grammar hub programme handoff missing');
check(subjectHub.includes("programmeTo: '/speaking'"), 'speaking-hub-programme', 'speaking hub programme handoff missing');
check(subjectHub.includes('to="/book-demo"'), 'subject-hub-assessment', 'subject hubs must retain /book-demo handoff');

check(phonicsKnowledgePage.includes('concept.supportingPaths'), 'phonics-supporting-paths', 'phonics knowledge page no longer reads concept supporting paths');
check(phonicsKnowledgePage.includes('relatedPaths.map'), 'phonics-related-path-render', 'phonics knowledge page no longer renders related paths');
check(kbFinal.includes("KNOWLEDGE_BASE_FINAL_STATUS = 'frozen'"), 'knowledge-base-freeze', 'knowledge base is not frozen');
check(c6Freeze.includes("COMMERCIAL_C6_STATUS = 'frozen'"), 'c6-freeze', 'C6 is not frozen');

const baseRef = process.env.GITHUB_BASE_REF;
if (baseRef) {
  try {
    const changed = execFileSync('git', ['diff', '--name-only', `origin/${baseRef}...HEAD`], { cwd: root, encoding: 'utf8' })
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean);
    const laterBrickLiveAllowlist = new Set([
      'src/content/blog/index.ts',
      'src/content/blog/shared/commercialHandoffs.ts',
      'src/pages/PhonicsKnowledgePage.tsx',
    ]);
    const forbiddenLiveChanges = changed.filter((file) => {
      if (laterBrickLiveAllowlist.has(file)) return false;
      return (
        file.startsWith('src/pages/') ||
        file.startsWith('src/content/blog/posts/') ||
        file === 'src/content/blog/shared/authorityLinking.ts' ||
        file === 'src/lib/canonicalTopicOwnershipRegistry.js' ||
        file === 'src/lib/commercialC2KeywordOwnership.ts' ||
        file === 'src/lib/commercialC4CtrOptimization.ts' ||
        file === 'src/lib/commercialC5ConversionFlow.ts' ||
        file === 'src/lib/commercialC6ValidationFreeze.ts'
      );
    });
    check(forbiddenLiveChanges.length === 0, 'audit-only-diff', `Cumulative C7 changed protected live/ownership files outside the R3 allowlist: ${forbiddenLiveChanges.join(', ')}`);
  } catch (error) {
    addFailure('audit-only-diff', error instanceof Error ? error.message : String(error));
  }
}

if (failures.length) {
  console.error('C7-R0 knowledge conversion audit failed.');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`C7-R0 knowledge conversion audit passed (${checks.length} checks).`);
console.log('Baseline: frozen KB + 51 blog authority plans + 31 published phonics pages + 3 subject hubs + 14 commercial owners.');
console.log('Policy: R0 remains audit-only; cumulative later-brick live changes are limited to the explicit C7-R3 shared-renderer allowlist.');
