import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';

// Byte-for-byte reviewed SEO and post-freeze architecture exceptions.
// These are Git blob IDs, not general permission to edit the named files.
// The original entries preserve independently reviewed recovery work. The
// Resources/Grammar entries pin only the exact reviewed snapshots required for
// the central Resources gateway, governed grammar guides, retired-blog listing
// cleanup and reciprocal discovery links. Commercial C2/C4/C5/C6 ownership and
// conversion boundaries remain frozen; any further byte change fails closed.
export const REVIEWED_SEO_RECOVERY_BLOBS = Object.freeze({
  'src/content/blog/shared/authorityLinking.ts': 'c0bd6bda8ac4c8bb703126827eff2b7affccd63c',
  'src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx': '21ec5766587f1635227d718401e705e4a6affa81',
  'src/pages/SubjectResourcesPage.tsx': '665c15035d57085afe9ffc7d194753da506b824a',
  'src/pages/phonics.tsx': 'c2378e822fcf65e1c9aaa51ab02d07493f5fa507',
  'src/pages/founder/FounderEditorialReviewsPanel.tsx': '4ab9025aba1b3346aa71a1a1567a6769c29e74be',
  'src/lib/canonicalTopicOwnershipRegistry.js': 'b0c6af4749f77c21d04613f314f696d7dcc65e4e',
  'src/pages/ForSchoolsPage.tsx': '7be826c4fb422a5d022884607f340d3179d9ee25',
  'src/pages/GrammarKnowledgePage.tsx': '80190e0e6da35419d90bf22d3da534d3547f4415',
  'src/pages/ResourcesPage.tsx': 'b4c64ba762cfae96f0ff2f8b705310dbf36cd639',
  'src/pages/blog/BlogIndexPage.tsx': 'c392e1025138d96d7ae11d1748d66be84e99f437',
  'src/pages/blog/blogIndexUx.ts': 'c42e8c80ba0f56217eb9fb14a4ec1b4fafd8a919',
  'src/pages/parents/ParentsHubPage.tsx': 'c895e42389e264b3bfede7d1a2e029b2a93e0165',
  'src/pages/public/FreeEnglishGamesHubPage.tsx': 'c42429e4613e72aef51fa7ad43504a31decba04a',
});

export function isReviewedSeoRecoveryFile(relativePath, source) {
  if (typeof relativePath !== 'string' || !Object.hasOwn(REVIEWED_SEO_RECOVERY_BLOBS, relativePath)) return false;
  if (typeof source !== 'string' && !Buffer.isBuffer(source)) return false;
  const bytes = Buffer.isBuffer(source) ? source : Buffer.from(source, 'utf8');
  const header = 'blob ' + bytes.length + '\0';
  const blobId = createHash('sha1').update(header).update(bytes).digest('hex');
  return blobId === REVIEWED_SEO_RECOVERY_BLOBS[relativePath];
}
