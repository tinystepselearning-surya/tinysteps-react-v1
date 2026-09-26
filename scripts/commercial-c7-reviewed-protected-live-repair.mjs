import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';

// Byte-for-byte reviewed protected live-file exceptions for non-C7 repairs.
// These are Git blob IDs, not path-level permissions. Any future edit changes
// the blob ID and is blocked again by the C7 frozen-architecture guard.
//
// P2 mobile INP repair at 530f9d780545cff519f00f6353965572d4269611:
// HomePage only changes deferred rendering timing/placement. SEO metadata,
// knowledge copy, commercial ownership, canonical routing and C7 handoffs are
// unchanged.
export const REVIEWED_C7_PROTECTED_LIVE_BLOBS = Object.freeze({
  'src/pages/HomePage.tsx': '70dfca313cb81ad50202eaf6c916618aeb2746da',
});

export function isReviewedC7ProtectedLiveFile(relativePath, source) {
  if (
    typeof relativePath !== 'string' ||
    !Object.hasOwn(REVIEWED_C7_PROTECTED_LIVE_BLOBS, relativePath)
  ) {
    return false;
  }
  if (typeof source !== 'string' && !Buffer.isBuffer(source)) return false;

  const bytes = Buffer.isBuffer(source) ? source : Buffer.from(source, 'utf8');
  const header = 'blob ' + bytes.length + '\0';
  const blobId = createHash('sha1').update(header).update(bytes).digest('hex');
  return blobId === REVIEWED_C7_PROTECTED_LIVE_BLOBS[relativePath];
}
