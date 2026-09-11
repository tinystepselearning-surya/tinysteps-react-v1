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
  'src/lib/commercialC7ContextualHandoffImplementation.ts',
  'src/content/blog/shared/commercialHandoffs.ts',
  'src/tests/seo/commercialC7ContextualHandoffs.spec.ts',
  'scripts/audit-commercial-c7-r3-contextual-handoffs.mjs',
  'docs/seo/commercial-growth/C7_R3_CONTEXTUAL_COMMERCIAL_HANDOFFS_2026-09-11.md',
  '.github/workflows/commercial-c7-knowledge-conversion.yml',
];
for (const relativePath of requiredFiles) {
  check(fs.existsSync(path.join(root, relativePath)), `required-file:${relativePath}`, 'missing');
}

const model = read('src/lib/commercialC7ContextualHandoffImplementation.ts');
const blogHandoffs = read('src/content/blog/shared/commercialHandoffs.ts');
const blogIndexPipeline = read('src/content/blog/index.ts');
const blogLibrary = read('src/pages/blog/BlogIndexPage.tsx');
const parentsHub = read('src/pages/parents/ParentsHubPage.tsx');
const phonicsKnowledge = read('src/pages/PhonicsKnowledgePage.tsx');
const childReading = read('src/pages/public/ChildNotReadingProperlyPage.tsx');
const slowReader = read('src/pages/public/SlowReaderChildHelpPage.tsx');
const shyChild = read('src/pages/public/ShyChildSpeakingConfidencePage.tsx');
const c2 = read('src/lib/commercialC2KeywordOwnership.ts');
const c4 = read('src/lib/commercialC4CtrOptimization.ts');
const c6 = read('src/lib/commercialC6ValidationFreeze.ts');

check(model.includes("COMMERCIAL_C7_R3_STATUS = 'contextual-commercial-handoffs-implemented'"), 'r3-status', 'R3 status marker missing');
check(model.includes('COMMERCIAL_C7_R2_NEXT_STEP_RULES'), 'r2-source', 'R3 must be generated from R2 rules');
check(model.includes('maxCommercialPromptsPerKnowledgeSurface: 2'), 'prompt-cap', 'R3 prompt cap missing');
check(model.includes('directBlogBodyEditsAllowed: false'), 'no-direct-blog-edits', 'R3 must use the shared blog pipeline');
check(model.includes('everyNonSoftRuleMustBeRenderedOrProtected: true'), 'placement-coverage', 'R3 must account for every non-soft rule');
check(model.includes('usesSharedR3Renderer'), 'shared-renderer-coverage', 'R3 shared-renderer coverage guard missing');
check(model.includes('protectedExistingPathSet'), 'protected-placement-coverage', 'R3 protected-placement coverage guard missing');
check(model.includes('c4MetadataMutationAllowed: false'), 'c4-protection', 'C4 metadata protection missing');
check(model.includes("singleConversionOwner: '/book-demo'"), 'single-conversion-owner', '/book-demo protection missing');

check(blogIndexPipeline.includes('applyCommercialC7ContextualHandoffs'), 'blog-pipeline', 'Blog post pipeline is not using the C7-R3 transformer');
check(!blogIndexPipeline.includes('applyBlogAuthorityLinking(titledPost)'), 'legacy-blog-pipeline-bypassed', 'Blog post pipeline still applies the old fixed authority plan directly');
check(blogHandoffs.includes('getCommercialC7R3Handoff'), 'blog-r3-model', 'Shared blog handoff transformer does not read R3');
check(blogHandoffs.includes("if (!rule) return applyBlogAuthorityLinking(post)"), 'legacy-fallback', 'Unmapped legacy posts must retain prior authority linking');
check(blogHandoffs.includes("if (!handoff)"), 'soft-discovery-branch', 'Soft discovery branch missing');
check(blogHandoffs.includes("genericLegacyRoutes = new Set(['/courses'])"), 'generic-courses-removed', 'R3 must drop generic /courses when a precise owner is known');
check(blogHandoffs.includes("commercialOwnerSet.add('/book-demo')"), 'commercial-owner-set', 'Blog transformer must treat assessment as commercial');

check(phonicsKnowledge.includes('getCommercialC7R3Handoff'), 'phonics-r3-model', 'Focused phonics renderer does not read R3');
check(phonicsKnowledge.includes('data-c7-contextual-handoff={c7Handoff.ruleClass}'), 'phonics-r3-render', 'Focused phonics contextual handoff marker missing');
check(phonicsKnowledge.includes('to={c7Handoff.primary.to}'), 'phonics-primary-first', 'Focused phonics primary owner link missing');
check(phonicsKnowledge.includes('c7Handoff.secondary ?'), 'phonics-secondary-conditional', 'Focused phonics secondary assessment must remain conditional');

check(blogLibrary.includes('PARENT_GOAL_ROUTES.map'), 'blog-library-discovery', 'Blog library lost its intent-specific discovery routes');
check(parentsHub.includes('to="/book-demo"'), 'parents-assessment', 'Parents Hub lost assessment');
check(parentsHub.includes("to: '/reading-classes-for-kids'"), 'parents-reading-route', 'Parents Hub lost reading programme routing');
check(parentsHub.includes("to: '/grammar'"), 'parents-grammar-route', 'Parents Hub lost grammar routing');
check(parentsHub.includes("to: '/writing-classes-for-kids'"), 'parents-writing-route', 'Parents Hub lost writing routing');

check(childReading.includes('to="/phonics"'), 'child-reading-phonics-owner', 'Child-not-reading page lost phonics owner');
check(childReading.includes('to="/book-demo"'), 'child-reading-assessment', 'Child-not-reading page lost assessment');
check(slowReader.includes('to="/reading-fluency-program"'), 'slow-reader-specialist-owner', 'Slow-reader page lost the fluency owner');
check(slowReader.includes('to="/book-demo"'), 'slow-reader-assessment', 'Slow-reader page lost assessment');
check(shyChild.includes('to="/confidence-building-program-kids"'), 'shy-confidence-owner', 'Shy-child page lost the confidence owner');
check(shyChild.includes('to="/book-demo"'), 'shy-assessment', 'Shy-child page lost assessment');

check(c2.includes("COMMERCIAL_C2_STATUS = 'ownership-complete'"), 'c2-frozen', 'C2 ownership baseline missing');
check(c4.includes("COMMERCIAL_C4_STATUS = 'experiment-governance-armed'"), 'c4-active', 'C4 observation baseline missing');
check(c6.includes("COMMERCIAL_C6_STATUS = 'frozen'"), 'c6-frozen', 'C6 frozen baseline missing');

const baseRef = process.env.GITHUB_BASE_REF;
if (baseRef) {
  try {
    const changed = execFileSync('git', ['diff', '--name-only', `origin/${baseRef}...HEAD`], { cwd: root, encoding: 'utf8' })
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean);

    const allowedLiveFiles = new Set([
      'src/content/blog/index.ts',
      'src/content/blog/shared/commercialHandoffs.ts',
      'src/pages/PhonicsKnowledgePage.tsx',
    ]);
    const forbiddenLiveChanges = changed.filter((file) => {
      if (allowedLiveFiles.has(file)) return false;
      if (file.startsWith('src/content/blog/posts/')) return true;
      if (file.startsWith('src/pages/')) return true;
      if (file === 'src/content/blog/shared/authorityLinking.ts') return true;
      if (file === 'src/lib/commercialC2KeywordOwnership.ts') return true;
      if (file === 'src/lib/commercialC4CtrOptimization.ts') return true;
      if (file === 'src/lib/commercialC5ConversionFlow.ts') return true;
      if (file === 'src/lib/commercialC6ValidationFreeze.ts') return true;
      return false;
    });
    check(forbiddenLiveChanges.length === 0, 'r3-live-diff-boundary', `R3 changed protected live/ownership files: ${forbiddenLiveChanges.join(', ')}`);
  } catch (error) {
    addFailure('r3-live-diff-boundary', error instanceof Error ? error.message : String(error));
  }
}

if (failures.length) {
  console.error('C7-R3 contextual handoff audit failed.');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`C7-R3 contextual handoff audit passed (${checks.length} checks).`);
console.log('Implementation: shared blog transformer + focused phonics shared renderer; navigation/decision hubs and correct standalone routes are explicitly protected.');
console.log('Protection: C2/C4/C5/C6 unchanged; /book-demo remains the single conversion owner.');
