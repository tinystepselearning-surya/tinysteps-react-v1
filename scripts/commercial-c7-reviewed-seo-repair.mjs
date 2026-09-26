import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';

// Byte-for-byte reviewed SEO recovery exceptions.
// These are Git blob IDs, not general permission to edit the named files.
// The first two preserve the reviewed retired-Blog-10 repair. The latter two
// cover the focused phonics resource indexing recovery plus the subsequently
// reviewed Speaking Growth additions and ItemList deduplication on the shared
// subject resource hub. The founder-panel entry is the exact reviewed retirement
// of post-publication approval actions into a read-only pre-publication status
// surface. The 2026-09-27 Resources entries are exact reviewed blobs for the
// user-approved public-copy cleanup, bidirectional Resource links and governed
// Grammar knowledge expansion. Canonicals, commercial ownership and conversion
// ownership remain unchanged.
export const REVIEWED_SEO_RECOVERY_BLOBS = Object.freeze({
  'src/content/blog/shared/authorityLinking.ts': 'c0bd6bda8ac4c8bb703126827eff2b7affccd63c',
  'src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx': '21ec5766587f1635227d718401e705e4a6affa81',
  'src/pages/SubjectResourcesPage.tsx': '0a4fe318a3c4c043bbe7f7a4c1221d77e045d38b',
  'src/pages/ResourcesPage.tsx': '5822095736ccfd205b31b786095e391ef3662495',
  'src/pages/GrammarKnowledgePage.tsx': '3ecc9dbc2075c58561d654d8054f9aa96dafc382',
  'src/pages/parents/ParentsHubPage.tsx': 'be93563714b2ee5a5bc014d023c9d0514645e106',
  'src/pages/public/FreeEnglishGamesHubPage.tsx': 'a231a915e65fb0dd042a97cda96463dd511eff9f',
  'src/pages/ForSchoolsPage.tsx': '8970447f39dfa0ddbaebf0b069a88fa11a29ee2a',
  'src/pages/phonics.tsx': 'c2378e822fcf65e1c9aaa51ab02d07493f5fa507',
  'src/pages/founder/FounderEditorialReviewsPanel.tsx': '4ab9025aba1b3346aa71a1a1567a6769c29e74be',
});

export function isReviewedSeoRecoveryFile(relativePath, source) {
  if (typeof relativePath !== 'string' || !Object.hasOwn(REVIEWED_SEO_RECOVERY_BLOBS, relativePath)) return false;
  if (typeof source !== 'string' && !Buffer.isBuffer(source)) return false;
  const bytes = Buffer.isBuffer(source) ? source : Buffer.from(source, 'utf8');
  const header = 'blob ' + bytes.length + '\0';
  const blobId = createHash('sha1').update(header).update(bytes).digest('hex');
  return blobId === REVIEWED_SEO_RECOVERY_BLOBS[relativePath];
}

export const REVIEWED_SEO_RECOVERY_DELETIONS = Object.freeze([
  'src/content/blog/posts/public-speaking/spoken-english-classes-for-kids-confidence.ts',
]);
