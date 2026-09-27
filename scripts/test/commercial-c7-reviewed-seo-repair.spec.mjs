import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { REVIEWED_SEO_RECOVERY_BLOBS, isReviewedSeoRecoveryFile } from '../commercial-c7-reviewed-seo-repair.mjs';

const authorityPath = 'src/content/blog/shared/authorityLinking.ts';
const comparisonPath = 'src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx';
const subjectHubPath = 'src/pages/SubjectResourcesPage.tsx';
const phonicsPath = 'src/pages/phonics.tsx';
const founderPanelPath = 'src/pages/founder/FounderEditorialReviewsPanel.tsx';
const canonicalOwnershipPath = 'src/lib/canonicalTopicOwnershipRegistry.js';
const schoolsPath = 'src/pages/ForSchoolsPage.tsx';
const grammarKnowledgePath = 'src/pages/GrammarKnowledgePage.tsx';
const resourcesPath = 'src/pages/ResourcesPage.tsx';
const blogIndexPath = 'src/pages/blog/BlogIndexPage.tsx';
const blogIndexUxPath = 'src/pages/blog/blogIndexUx.ts';
const parentsHubPath = 'src/pages/parents/ParentsHubPage.tsx';
const freeGamesPath = 'src/pages/public/FreeEnglishGamesHubPage.tsx';

const reviewedPaths = [
  authorityPath,
  comparisonPath,
  subjectHubPath,
  phonicsPath,
  founderPanelPath,
  canonicalOwnershipPath,
  schoolsPath,
  grammarKnowledgePath,
  resourcesPath,
  blogIndexPath,
  blogIndexUxPath,
  parentsHubPath,
  freeGamesPath,
];

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('C7 verified post-freeze SEO boundary', () => {
  it('pins only independently reviewed Git blob versions', () => {
    expect(REVIEWED_SEO_RECOVERY_BLOBS).toEqual({
      [authorityPath]: 'c0bd6bda8ac4c8bb703126827eff2b7affccd63c',
      [comparisonPath]: '21ec5766587f1635227d718401e705e4a6affa81',
      [subjectHubPath]: '665c15035d57085afe9ffc7d194753da506b824a',
      [phonicsPath]: 'c2378e822fcf65e1c9aaa51ab02d07493f5fa507',
      [founderPanelPath]: '4ab9025aba1b3346aa71a1a1567a6769c29e74be',
      [canonicalOwnershipPath]: 'b0c6af4749f77c21d04613f314f696d7dcc65e4e',
      [schoolsPath]: '7be826c4fb422a5d022884607f340d3179d9ee25',
      [grammarKnowledgePath]: '80190e0e6da35419d90bf22d3da534d3547f4415',
      [resourcesPath]: 'b4c64ba762cfae96f0ff2f8b705310dbf36cd639',
      [blogIndexPath]: 'c392e1025138d96d7ae11d1748d66be84e99f437',
      [blogIndexUxPath]: 'c42e8c80ba0f56217eb9fb14a4ec1b4fafd8a919',
      [parentsHubPath]: 'c895e42389e264b3bfede7d1a2e029b2a93e0165',
      [freeGamesPath]: 'c42429e4613e72aef51fa7ad43504a31decba04a',
    });
    expect(Object.isFrozen(REVIEWED_SEO_RECOVERY_BLOBS)).toBe(true);
  });

  it('accepts the exact reviewed sources as text and bytes', () => {
    for (const file of reviewedPaths) {
      expect(isReviewedSeoRecoveryFile(file, read(file)), file).toBe(true);
      expect(isReviewedSeoRecoveryFile(file, fs.readFileSync(path.join(process.cwd(), file))), file).toBe(true);
    }
  });

  it('fails closed after any byte change', () => {
    for (const file of reviewedPaths) {
      expect(isReviewedSeoRecoveryFile(file, read(file) + '// changed')).toBe(false);
    }
  });

  it('keeps frozen commercial owner files outside the exception map', () => {
    for (const file of [
      'src/lib/commercialC2KeywordOwnership.ts',
      'src/lib/commercialC4CtrOptimization.ts',
      'src/lib/commercialC6ValidationFreeze.ts',
    ]) {
      expect(isReviewedSeoRecoveryFile(file, read(comparisonPath))).toBe(false);
    }
  });

  it('fails closed for malformed or cross-file source input', () => {
    expect(isReviewedSeoRecoveryFile(authorityPath, null)).toBe(false);
    expect(isReviewedSeoRecoveryFile(authorityPath, read(comparisonPath))).toBe(false);
  });
});
