import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

function requireTokens(relativePath, tokens) {
  const source = read(relativePath);
  for (const token of tokens) {
    if (!source.includes(token)) throw new Error(`C7-R5 missing ${JSON.stringify(token)} in ${relativePath}`);
  }
}

requireTokens('src/lib/commercialC7ValidationFreeze.ts', [
  "COMMERCIAL_C7_STATUS = 'frozen'",
  "singleConversionOwner: '/book-demo'",
  'reopenOnlyWithMeasuredEvidenceOrVerifiedDefect: true',
  'maxCommercialPromptsPerKnowledgeSurface: 2',
  "measurementPrimaryKpi: COMMERCIAL_C7_R4_MEASUREMENT.primaryKpi",
]);

requireTokens('src/lib/commercialC7KnowledgeMeasurement.ts', [
  "knowledgeView: 'knowledge_commercial_view'",
  "knowledgeHandoffClick: 'knowledge_commercial_handoff_click'",
  'clickEqualsQualifiedLead: false',
]);

console.log('C7-R5 validation and freeze audit passed.');
