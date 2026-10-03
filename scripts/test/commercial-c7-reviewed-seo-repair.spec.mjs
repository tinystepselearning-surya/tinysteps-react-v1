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
const vocabularyHubPath = 'src/pages/VocabularyHubPage.tsx';
const vocabularyKnowledgePath = 'src/pages/VocabularyKnowledgePage.tsx';
const speakingPath = 'src/pages/speaking.tsx';
const courseDetailPath = 'src/pages/CourseDetailPage.tsx';
const curriculumPath = 'src/pages/CurriculumPage.tsx';
const testimonialsPath = 'src/pages/TestimonialsPage.tsx';
const confidenceBuildingPath = 'src/pages/public/ConfidenceBuildingProgramKidsPage.tsx';
const speakingProgressPath = 'src/pages/public/SpeakingProgressFrameworkPage.tsx';
const speakingArticlePath = 'src/content/blog/posts/public-speaking/why-public-speaking-is-important-for-kids.ts';
const c4Path = 'src/lib/commercialC4CtrOptimization.ts';
const conversionFamiliesPath = 'src/content/blog/shared/conversionFamilies.ts';
const heroFamiliesPath = 'src/content/blog/shared/heroFamilies.ts';
const technicalAuthorityPath = 'src/content/blog/shared/technicalAuthority.ts';

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
  vocabularyHubPath,
  vocabularyKnowledgePath,
  speakingPath,
  courseDetailPath,
  curriculumPath,
  testimonialsPath,
  confidenceBuildingPath,
  speakingProgressPath,
  speakingArticlePath,
  c4Path,
  conversionFamiliesPath,
  heroFamiliesPath,
  technicalAuthorityPath,
];

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('C7 verified post-freeze SEO boundary', () => {
  it('pins only independently reviewed Git blob versions', () => {
    expect(REVIEWED_SEO_RECOVERY_BLOBS).toEqual({
      [authorityPath]: 'c0bd6bda8ac4c8bb703126827eff2b7affccd63c',
      [comparisonPath]: '023cb60613ffe88e7c221d4d7b8698d34e5a91f8',
      [subjectHubPath]: 'a32b47fec82372c013e8a9d323dde80283f3e008',
      [phonicsPath]: '9b37d26b928789ec2bb224ab0d7e8ffd33aa3dbb',
      [founderPanelPath]: '4ab9025aba1b3346aa71a1a1567a6769c29e74be',
      [canonicalOwnershipPath]: 'e7bbdb67b3840a10813bbb3a95e7270e2b502956',
      [c4Path]: '62ec23c3b0c76440ea386f4f23fde4a292b93099',
      [speakingPath]: 'a3913ca4c4d79cfdbd8412339920fbae1495d83a',
      [courseDetailPath]: '8b2608266bc8ae522f8a89edda7ff1e0f0675458',
      [curriculumPath]: 'bbdd0490226bc028d8c2dd4f6a33e21cb9cb9291',
      [testimonialsPath]: '228cccac38b5a893153c90081421108ca2322b44',
      [confidenceBuildingPath]: 'e33b7f617cb661b4a805d1651bd0c5d1d0966e40',
      [speakingProgressPath]: 'e434d0fa31dc67809d3bad044d515071d9dac7c3',
      [speakingArticlePath]: '584cc647fd76ddff5d018798517f8db57b25684f',
      [conversionFamiliesPath]: 'c6bbe00f36e62fe6f7ba41d42291faee13b51c03',
      [heroFamiliesPath]: '892b0db34c5f3597a3c005e185e5398cf2baeb7c',
      [technicalAuthorityPath]: 'fb622b631b1578f05e038476d201fa035deefd42',
      [schoolsPath]: '7be826c4fb422a5d022884607f340d3179d9ee25',
      [grammarKnowledgePath]: '80190e0e6da35419d90bf22d3da534d3547f4415',
      [resourcesPath]: '9bae80879eb765f6ff33154ed64f58cbb886ce5a',
      [blogIndexPath]: 'c392e1025138d96d7ae11d1748d66be84e99f437',
      [blogIndexUxPath]: 'c42e8c80ba0f56217eb9fb14a4ec1b4fafd8a919',
      [parentsHubPath]: 'c895e42389e264b3bfede7d1a2e029b2a93e0165',
      [freeGamesPath]: 'c42429e4613e72aef51fa7ad43504a31decba04a',
      [vocabularyHubPath]: '352f15d7f967db2e9dbd9115bfbaea886c8e5369',
      [vocabularyKnowledgePath]: '21bd4cf5ae358af13f9841788c29008de8a253cc',
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
