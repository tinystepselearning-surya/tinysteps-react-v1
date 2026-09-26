import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';

// Byte-for-byte reviewed SEO recovery exceptions.
// These are Git blob IDs, not general permission to edit the named files.
// The first two preserve the reviewed retired-Blog-10 repair. The latter two
// cover the focused phonics resource indexing recovery plus the subsequently
// reviewed Speaking Growth additions and ItemList deduplication on the shared
// subject resource hub. The founder-panel entry is the exact reviewed retirement
// of post-publication approval actions into a read-only pre-publication status
// surface. Canonicals, titles, commercial ownership, robots policy and conversion
// ownership remain unchanged.
export const REVIEWED_SEO_RECOVERY_BLOBS = Object.freeze({
  'src/content/blog/shared/authorityLinking.ts': 'c0bd6bda8ac4c8bb703126827eff2b7affccd63c',
  'src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx': '21ec5766587f1635227d718401e705e4a6affa81',
  'src/pages/SubjectResourcesPage.tsx': 'f6b0137a50f5168fe0d8c5cfd0536d10415e4403',
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
