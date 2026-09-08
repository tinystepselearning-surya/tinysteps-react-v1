import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const failures = [];
const requireText = (source, token, label) => {
  if (!source.includes(token)) failures.push(`${label}: missing ${token}`);
};
const forbidText = (source, token, label) => {
  if (source.includes(token)) failures.push(`${label}: forbidden ${token}`);
};

const measurement = read('src/lib/resourceMeasurement.ts');
const gate = read('src/lib/resourceExpansionGate.ts');
const tracker = read('src/components/common/ConversionTracker.tsx');
const docs = read('docs/seo/resources-architecture/R11_MEASUREMENT_EXPANSION_GATE.md');
const reviewTemplate = read('docs/seo/resources-architecture/R11_RESOURCE_REVIEW_TEMPLATE.md');

for (const eventName of [
  'resource_page_view',
  'resource_navigation_click',
  'resource_assist_click',
]) {
  requireText(measurement, `'${eventName}'`, 'measurement event contract');
}

for (const status of [
  'promote',
  'observe',
  'repair',
  'insufficient-evidence',
  'blocked',
]) {
  requireText(gate, `'${status}'`, 'expansion status contract');
}

requireText(gate, 'blocksOtherClusters: false', 'scoped expansion contract');
requireText(gate, "blockScope: status === 'blocked' ? evidence.scopeType : 'none'", 'scoped blocking contract');
requireText(tracker, 'trackResourcePageView', 'runtime tracker integration');
requireText(tracker, 'trackResourceNavigationClick', 'runtime tracker integration');
requireText(tracker, 'trackResourceAssistClick', 'runtime tracker integration');
requireText(tracker, 'if (isPhonicsResourcePath(destinationPath))', 'navigation de-duplication');

requireText(docs, 'continuous measurement, not a publishing waiting room', 'governance documentation');
requireText(docs, 'No global 16-page waiting gate', 'governance documentation');
requireText(docs, 'does not contain fabricated current GSC metrics', 'evidence integrity');
requireText(reviewTemplate, 'Search Console evidence', 'review template');
requireText(reviewTemplate, 'Cannibalisation check', 'review template');
requireText(reviewTemplate, 'Decision', 'review template');

// R11 must never hardcode invented performance evidence into the runtime gate.
forbidText(gate, 'currentGsc', 'evidence integrity');
forbidText(gate, 'tinystepslearning.com clicks', 'evidence integrity');

if (failures.length) {
  console.error('Resources R11 measurement audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Resources R11 measurement audit passed.');
