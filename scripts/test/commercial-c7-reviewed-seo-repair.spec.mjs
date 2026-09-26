import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  REVIEWED_SEO_RECOVERY_BLOBS,
  REVIEWED_SEO_RECOVERY_DELETIONS,
  isReviewedSeoRecoveryFile,
} from '../commercial-c7-reviewed-seo-repair.mjs';

const authorityPath = 'src/content/blog/shared/authorityLinking.ts';
const comparisonPath = 'src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx';
const subjectHubPath = 'src/pages/SubjectResourcesPage.tsx';
const resourcesPath = 'src/pages/ResourcesPage.tsx';
const grammarKnowledgePath = 'src/pages/GrammarKnowledgePage.tsx';
const parentsHubPath = 'src/pages/parents/ParentsHubPage.tsx';
const gamesHubPath = 'src/pages/public/FreeEnglishGamesHubPage.tsx';
const schoolsPath = 'src/pages/ForSchoolsPage.tsx';
const phonicsPath = 'src/pages/phonics.tsx';
const founderPanelPath = 'src/pages/founder/FounderEditorialReviewsPanel.tsx';
const reviewedPaths = [
  authorityPath,
  comparisonPath,
  subjectHubPath,
  resourcesPath,
  grammarKnowledgePath,
  parentsHubPath,
  gamesHubPath,
  schoolsPath,
  phonicsPath,
  founderPanelPath,
];
const read = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('C7 verified SEO recovery repair boundary', () => {
  it('permits exactly the independently reviewed Git blob versions', () => {
    expect(REVIEWED_SEO_RECOVERY_BLOBS).toEqual({
      [authorityPath]: 'c0bd6bda8ac4c8bb703126827eff2b7affccd63c',
      [comparisonPath]: '21ec5766587f1635227d718401e705e4a6affa81',
      [subjectHubPath]: '0a4fe318a3c4c043bbe7f7a4c1221d77e045d38b',
      [resourcesPath]: '5822095736ccfd205b31b786095e391ef3662495',
      [grammarKnowledgePath]: '3ecc9dbc2075c58561d654d8054f9aa96dafc382',
      [parentsHubPath]: 'be93563714b2ee5a5bc014d023c9d0514645e106',
      [gamesHubPath]: 'a231a915e65fb0dd042a97cda96463dd511eff9f',
      [schoolsPath]: '8970447f39dfa0ddbaebf0b069a88fa11a29ee2a',
      [phonicsPath]: 'c2378e822fcf65e1c9aaa51ab02d07493f5fa507',
      [founderPanelPath]: '4ab9025aba1b3346aa71a1a1567a6769c29e74be',
    });
    expect(Object.isFrozen(REVIEWED_SEO_RECOVERY_BLOBS)).toBe(true);
  });
  it('accepts the exact reviewed sources as text and bytes', () => {
    for (const file of reviewedPaths) {
      expect(isReviewedSeoRecoveryFile(file, read(file)), file).toBe(true);
      expect(isReviewedSeoRecoveryFile(file, fs.readFileSync(path.join(process.cwd(), file))), file).toBe(true);
    }
  });
  it('pins the one approved retired speaking-source deletion', () => {
    expect(REVIEWED_SEO_RECOVERY_DELETIONS).toEqual([
      'src/content/blog/posts/public-speaking/spoken-english-classes-for-kids-confidence.ts',
    ]);
    expect(fs.existsSync(path.join(process.cwd(), REVIEWED_SEO_RECOVERY_DELETIONS[0]))).toBe(false);
  });

  it('rejects any further protected-source mutation rather than allowing the whole filename', () => {
    for (const file of reviewedPaths) {
      expect(isReviewedSeoRecoveryFile(file, read(file) + '// unreviewed edit')).toBe(false);
    }
  });
  it('pins the founder quality-status retirement to the exact reviewed blob', () => {
    const panel = read(founderPanelPath);
    expect(panel).toContain('Pre-publication Quality Status');
    expect(panel).not.toContain('setFounderEditorialReviewDecision');
    expect(isReviewedSeoRecoveryFile(founderPanelPath, panel)).toBe(true);
    expect(isReviewedSeoRecoveryFile(founderPanelPath, panel.replace('Pre-publication Quality Status', 'Quality Status'))).toBe(false);
  });
  it('rejects restored retired recommendations and redirects in the comparison CTA', () => {
    const authority = read(authorityPath).replace('export const B7_BEST_PHONICS_DECISION_GUIDES = Object.freeze([',
      "export const B7_BEST_PHONICS_DECISION_GUIDES = Object.freeze(['how-to-choose-phonics-classes',");
    const comparison = read(comparisonPath).replace('href="#provider-scorecard"', 'href="/blog/how-to-choose-phonics-classes"');
    expect(authority).not.toBe(read(authorityPath));
    expect(comparison).not.toBe(read(comparisonPath));
    expect(isReviewedSeoRecoveryFile(authorityPath, authority)).toBe(false);
    expect(isReviewedSeoRecoveryFile(comparisonPath, comparison)).toBe(false);
  });
  it('does not whitelist other protected owners or inherited object keys', () => {
    for (const file of ['src/lib/commercialC2KeywordOwnership.ts', 'src/lib/commercialC4CtrOptimization.ts', 'src/lib/commercialC6ValidationFreeze.ts', 'toString', '__proto__']) {
      expect(isReviewedSeoRecoveryFile(file, read(comparisonPath))).toBe(false);
    }
  });
  it('fails closed for missing, malformed or cross-file source input', () => {
    for (const input of [undefined, null, {}, 0, '']) {
      expect(isReviewedSeoRecoveryFile(authorityPath, input)).toBe(false);
    }
    expect(isReviewedSeoRecoveryFile(authorityPath, read(comparisonPath))).toBe(false);
    expect(isReviewedSeoRecoveryFile(null, read(authorityPath))).toBe(false);
  });
});
