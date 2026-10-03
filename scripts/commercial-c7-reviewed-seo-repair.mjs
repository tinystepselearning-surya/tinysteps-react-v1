import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';

// Byte-for-byte reviewed SEO and post-freeze architecture exceptions.
// These are Git blob IDs, not general permission to edit the named files.
// The original entries preserve independently reviewed recovery work. The
// Resources/Grammar entries pin only the exact reviewed snapshots required for
// the central Resources gateway, governed grammar guides, retired-blog listing,
// reciprocal discovery links and the exact GV4 Vocabulary publication snapshots.
// Speaking Commercial Authority v2 adds a reviewed informational article, its
// subject-hub link, a distinct canonical owner, and the authorized /speaking C4
// override. The /speaking pin also includes the reviewed post-merge hero blend
// polish; only those exact approved source bytes are allowed. Commercial
// C2/C5/C6 ownership and conversion boundaries remain frozen; further edits
// to any pinned file fail closed.
export const REVIEWED_SEO_RECOVERY_BLOBS = Object.freeze({
  'src/content/blog/shared/authorityLinking.ts': 'c0bd6bda8ac4c8bb703126827eff2b7affccd63c',
  'src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx': '023cb60613ffe88e7c221d4d7b8698d34e5a91f8',
  'src/pages/SubjectResourcesPage.tsx': 'a32b47fec82372c013e8a9d323dde80283f3e008',
  'src/pages/phonics.tsx': '9b37d26b928789ec2bb224ab0d7e8ffd33aa3dbb',
  'src/pages/founder/FounderEditorialReviewsPanel.tsx': '4ab9025aba1b3346aa71a1a1567a6769c29e74be',
  'src/lib/canonicalTopicOwnershipRegistry.js': 'e7bbdb67b3840a10813bbb3a95e7270e2b502956',
  'src/lib/commercialC4CtrOptimization.ts': '62ec23c3b0c76440ea386f4f23fde4a292b93099',
  'src/pages/speaking.tsx': 'ebc160a6f28db53e1f200f98e8657db101a4e4d8',
  'src/content/blog/posts/public-speaking/why-public-speaking-is-important-for-kids.ts': '584cc647fd76ddff5d018798517f8db57b25684f',
  'src/content/blog/shared/conversionFamilies.ts': 'c6bbe00f36e62fe6f7ba41d42291faee13b51c03',
  'src/content/blog/shared/heroFamilies.ts': '892b0db34c5f3597a3c005e185e5398cf2baeb7c',
  'src/content/blog/shared/technicalAuthority.ts': 'fb622b631b1578f05e038476d201fa035deefd42',
  'src/pages/ForSchoolsPage.tsx': '7be826c4fb422a5d022884607f340d3179d9ee25',
  'src/pages/GrammarKnowledgePage.tsx': '80190e0e6da35419d90bf22d3da534d3547f4415',
  'src/pages/ResourcesPage.tsx': '9bae80879eb765f6ff33154ed64f58cbb886ce5a',
  'src/pages/blog/BlogIndexPage.tsx': 'c392e1025138d96d7ae11d1748d66be84e99f437',
  'src/pages/blog/blogIndexUx.ts': 'c42e8c80ba0f56217eb9fb14a4ec1b4fafd8a919',
  'src/pages/parents/ParentsHubPage.tsx': 'c895e42389e264b3bfede7d1a2e029b2a93e0165',
  'src/pages/public/FreeEnglishGamesHubPage.tsx': 'c42429e4613e72aef51fa7ad43504a31decba04a',
  // Reviewed informational Vocabulary surfaces: exact current publication bytes only.
  'src/pages/VocabularyHubPage.tsx': '352f15d7f967db2e9dbd9115bfbaea886c8e5369',
  'src/pages/VocabularyKnowledgePage.tsx': '21bd4cf5ae358af13f9841788c29008de8a253cc',
});

export function isReviewedSeoRecoveryFile(relativePath, source) {
  if (typeof relativePath !== 'string' || !Object.hasOwn(REVIEWED_SEO_RECOVERY_BLOBS, relativePath)) return false;
  if (typeof source !== 'string' && !Buffer.isBuffer(source)) return false;
  const bytes = Buffer.isBuffer(source) ? source : Buffer.from(source, 'utf8');
  const header = 'blob ' + bytes.length + '\0';
  const blobId = createHash('sha1').update(header).update(bytes).digest('hex');
  return blobId === REVIEWED_SEO_RECOVERY_BLOBS[relativePath];
}
