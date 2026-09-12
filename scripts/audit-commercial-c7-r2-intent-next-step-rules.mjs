import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { REVIEWED_SEO_RECOVERY_BLOBS, isReviewedSeoRecoveryFile } from './commercial-c7-reviewed-seo-repair.mjs';

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
  'src/lib/commercialC7KnowledgeOwnerMapping.ts',
  'src/lib/commercialC7IntentNextStepRules.ts',
  'src/tests/seo/commercialC7KnowledgeConversionAudit.spec.ts',
  'src/tests/seo/commercialC7KnowledgeOwnerMapping.spec.ts',
  'src/tests/seo/commercialC7IntentNextStepRules.spec.ts',
  'scripts/audit-commercial-c7-r0-knowledge-conversion.mjs',
  'scripts/audit-commercial-c7-r1-knowledge-owner-mapping.mjs',
  'scripts/audit-commercial-c7-r2-intent-next-step-rules.mjs',
  'docs/seo/commercial-growth/C7_R2_INTENT_NEXT_STEP_RULES_2026-09-11.md',
  '.github/workflows/commercial-c7-knowledge-conversion.yml',
];
for (const relativePath of requiredFiles) {
  check(fs.existsSync(path.join(root, relativePath)), `required-file:${relativePath}`, 'missing');
}

const model = read('src/lib/commercialC7IntentNextStepRules.ts');
const r1 = read('src/lib/commercialC7KnowledgeOwnerMapping.ts');
const c2 = read('src/lib/commercialC2KeywordOwnership.ts');
const c6 = read('src/lib/commercialC6ValidationFreeze.ts');

check(model.includes("COMMERCIAL_C7_R2_STATUS = 'intent-next-step-rules-validated'"), 'r2-status', 'R2 status marker missing');
check(model.includes("'SOFT_DISCOVERY'"), 'soft-rule', 'soft discovery rule missing');
check(model.includes("'OWNER_HANDOFF'"), 'owner-rule', 'owner handoff rule missing');
check(model.includes("'RESEARCH_HANDOFF'"), 'research-rule', 'research handoff rule missing');
check(model.includes("'OWNER_THEN_ASSESSMENT'"), 'owner-assessment-rule', 'owner-then-assessment rule missing');
check(model.includes("'ASSESSMENT_FIRST'"), 'assessment-first-rule', 'assessment-first rule missing');
check(model.includes('maxCommercialPromptsPerKnowledgeSurface: 2'), 'prompt-cap', 'R2 prompt cap missing');
check(model.includes('practiceMayRouteDirectlyToAssessment: false'), 'practice-protection', 'practice must not route directly to assessment');
check(model.includes('homeRoutineMayRouteDirectlyToAssessment: false'), 'routine-protection', 'home routine must not route directly to assessment');
check(model.includes('comparisonOwnerMustNotBeBypassed: true'), 'comparison-protection', 'comparison owner bypass protection missing');
check(model.includes('programmeOwnerPrecedesSecondaryAssessment: true'), 'owner-order', 'programme owner must precede secondary assessment');
check(model.includes('implementationDeferredToR3: true'), 'implementation-deferred', 'R2 must defer live implementation to R3');
check(model.includes('liveKnowledgeCopyChangesAllowed: false'), 'architecture-only', 'R2 must not authorise live knowledge changes');
check(model.includes("singleConversionOwner: '/book-demo'"), 'single-conversion-owner', '/book-demo protection missing');
check(r1.includes("COMMERCIAL_C7_R1_STATUS = 'knowledge-owner-mapping-validated'"), 'r1-baseline', 'R1 baseline missing');
check(c2.includes("COMMERCIAL_C2_STATUS = 'ownership-complete'"), 'c2-frozen', 'C2 ownership baseline missing');
check(c6.includes("COMMERCIAL_C6_STATUS = 'frozen'"), 'c6-frozen', 'C6 frozen baseline missing');

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
      // Permit only byte-for-byte reviewed retirement repairs; future edits still fail.
      if (Object.hasOwn(REVIEWED_SEO_RECOVERY_BLOBS, file) && isReviewedSeoRecoveryFile(file, read(file))) return false;
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
    check(forbiddenLiveChanges.length === 0, 'architecture-only-diff', `Cumulative C7 changed protected live/ownership files outside the R3 allowlist: ${forbiddenLiveChanges.join(', ')}`);
  } catch (error) {
    addFailure('architecture-only-diff', error instanceof Error ? error.message : String(error));
  }
}

if (failures.length) {
  console.error('C7-R2 intent next-step rules audit failed.');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`C7-R2 intent next-step rules audit passed (${checks.length} checks).`);
console.log('Rules: soft discovery -> owner/research handoff -> optional secondary assessment -> assessment first only when owner fit is unresolved.');
console.log('Policy: R2 remains architecture-only; cumulative later-brick live changes are limited to the explicit C7-R3 shared-renderer allowlist.');
