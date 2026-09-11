import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

function requireTokens(relativePath, tokens) {
  const source = read(relativePath);
  for (const token of tokens) {
    if (!source.includes(token)) throw new Error(`C8 missing ${JSON.stringify(token)} in ${relativePath}`);
  }
}

requireTokens('src/lib/commercialC8TrustEvidenceDifferentiation.ts', [
  "COMMERCIAL_C8_STATUS = 'frozen'",
  'auditAndGovernanceOnly: true',
  'newPublicUrlsAllowed: false',
  'unsupportedCredentialsAllowed: false',
  'guaranteedOutcomeClaimsAllowed: false',
  "nextProject: 'C9 — External Authority & Brand Search Growth'",
]);

requireTokens('src/pages/team/TeamPageSections.tsx', [
  'Built around how children actually learn',
  'Child development',
  'Learning science',
  'Observe the child during class',
  'Reduce teacher support gradually',
]);

requireTokens('src/pages/CurriculumPage.tsx', [
  'The complete Tiny Steps learning roadmap',
  'Children do not have to complete every pathway in a fixed age order.',
]);

requireTokens('src/pages/ClassSamplesPage.tsx', [
  'Tiny Steps classes are live teacher-guided online classes.',
  'Children are encouraged to read, speak, answer, practise, and try again with teacher support.',
]);

requireTokens('src/pages/TestimonialsPage.tsx', [
  'curated set of first-party parent feedback excerpts',
  'They describe individual family experiences',
  'it is not a promise or guarantee of a particular outcome',
]);

requireTokens('src/pages/ForSchoolsPage.tsx', [
  'How academic design becomes classroom practice',
  'Model → guided practice → observe → correct → retry → reduce support',
  'independent education provider',
]);

console.log('C8 trust, evidence and differentiation audit passed.');
