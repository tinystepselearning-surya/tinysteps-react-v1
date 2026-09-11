import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

function requireTokens(relativePath, tokens) {
  const source = read(relativePath);
  for (const token of tokens) {
    if (!source.includes(token)) throw new Error(`C7-R4 missing ${JSON.stringify(token)} in ${relativePath}`);
  }
}

requireTokens('src/lib/commercialC7KnowledgeMeasurement.ts', [
  "COMMERCIAL_C7_R4_STATUS = 'knowledge-conversion-measurement-implemented'",
  "knowledgeView: 'knowledge_commercial_view'",
  "knowledgeHandoffClick: 'knowledge_commercial_handoff_click'",
  "primaryKpi: COMMERCIAL_C0_MEASUREMENT.primaryKpi",
  "clickEqualsQualifiedLead: false",
  "singleConversionOwner: '/book-demo'",
]);

requireTokens('src/components/common/ConversionTracker.tsx', [
  'isCommercialC7MeasuredKnowledgePath',
  'trackCommercialC7KnowledgeView',
  'trackCommercialC7HandoffClick',
  'const isC7KnowledgePage = isCommercialC7MeasuredKnowledgePath(pagePath);',
]);

console.log('C7-R4 knowledge conversion measurement audit passed.');
