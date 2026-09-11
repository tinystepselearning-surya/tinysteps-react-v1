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
  'src/lib/commercialC7KnowledgeOwnerMapping.ts',
  'src/tests/seo/commercialC7KnowledgeConversionAudit.spec.ts',
  'src/tests/seo/commercialC7KnowledgeOwnerMapping.spec.ts',
  'scripts/audit-commercial-c7-r0-knowledge-conversion.mjs',
  'scripts/audit-commercial-c7-r1-knowledge-owner-mapping.mjs',
  'docs/seo/commercial-growth/C7_R0_KNOWLEDGE_CONVERSION_AUDIT_2026-09-11.md',
  'docs/seo/commercial-growth/C7_R1_KNOWLEDGE_OWNER_MAPPING_2026-09-11.md',
  '.github/workflows/commercial-c7-knowledge-conversion.yml',
];
for (const relativePath of requiredFiles) {
  check(fs.existsSync(path.join(root, relativePath)), `required-file:${relativePath}`, 'missing');
}

const model = read('src/lib/commercialC7KnowledgeOwnerMapping.ts');
const c2 = read('src/lib/commercialC2KeywordOwnership.ts');
const c6 = read('src/lib/commercialC6ValidationFreeze.ts');
const finalKnowledge = read('src/lib/speakingCommunicationCompletionCanonicalOwnership.js');

check(model.includes("COMMERCIAL_C7_R1_STATUS = 'knowledge-owner-mapping-validated'"), 'r1-status', 'R1 status marker missing');
check(model.includes('SP6_CANONICAL_TOPIC_OWNERSHIP'), 'final-knowledge-view', 'R1 must use the final frozen knowledge ownership view');
check(model.includes("'/blog/online-english-classes-for-kids-india'"), 'broad-english-guide', 'buyer-guide mapping missing');
check(model.includes("owner: '/online-english-classes-for-kids'"), 'broad-english-owner', 'buyer guide must map to frozen broad-English owner');
check(model.includes("owner: '/reading-fluency-program'"), 'fluency-owner', 'specialist fluency mapping missing');
check(model.includes("owner: '/confidence-building-program-kids'"), 'confidence-owner', 'specialist confidence mapping missing');
check(model.includes("owner: '/spoken-english-classes-for-kids-online'"), 'spoken-owner', 'spoken-English mapping missing');
check(model.includes("owner: '/writing-classes-for-kids'"), 'writing-owner', 'writing mapping missing');
check(model.includes("'HOLD_SOFT_DISCOVERY'"), 'soft-discovery', 'soft-discovery hold policy missing');
check(model.includes('liveKnowledgeCopyChangesAllowed: false'), 'architecture-only', 'R1 must not authorise live knowledge copy changes');
check(model.includes("singleConversionOwner: '/book-demo'"), 'single-conversion-owner', '/book-demo protection missing');
check(model.includes('c4MetadataMutationAllowed: false'), 'c4-protection', 'C4 metadata protection missing');
check(model.includes('c6ArchitectureMutationAllowed: false'), 'c6-protection', 'C6 freeze protection missing');
check(c2.includes("COMMERCIAL_C2_STATUS = 'ownership-complete'"), 'c2-frozen', 'C2 ownership baseline missing');
check(c6.includes("COMMERCIAL_C6_STATUS = 'frozen'"), 'c6-frozen', 'C6 frozen baseline missing');
check(finalKnowledge.includes('SP6_CANONICAL_TOPIC_OWNERSHIP'), 'sp6-final-registry', 'final SP6 ownership registry missing');

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
    check(forbiddenLiveChanges.length === 0, 'architecture-only-diff', `Cumulative C7 changed protected live/ownership files outside the R3 allowlist: ${forbiddenLiveChanges.join(', ')}`);
  } catch (error) {
    addFailure('architecture-only-diff', error instanceof Error ? error.message : String(error));
  }
}

if (failures.length) {
  console.error('C7-R1 knowledge owner mapping audit failed.');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`C7-R1 knowledge owner mapping audit passed (${checks.length} checks).`);
console.log('Architecture: final frozen knowledge view -> at most one frozen C2 commercial owner per commercially relevant surface.');
console.log('Policy: R1 remains architecture-only; cumulative later-brick live changes are limited to the explicit C7-R3 shared-renderer allowlist.');
