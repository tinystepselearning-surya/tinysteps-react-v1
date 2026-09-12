import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { REVIEWED_SEO_RECOVERY_BLOBS, isReviewedSeoRecoveryFile } from '../commercial-c7-reviewed-seo-repair.mjs';

const authorityPath = 'src/content/blog/shared/authorityLinking.ts';
const comparisonPath = 'src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx';
const read = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('C7 verified SEO recovery repair boundary', () => {
  it('permits exactly the two independently reviewed Git blob versions', () => {
    expect(REVIEWED_SEO_RECOVERY_BLOBS).toEqual({
      [authorityPath]: 'c0bd6bda8ac4c8bb703126827eff2b7affccd63c',
      [comparisonPath]: '21ec5766587f1635227d718401e705e4a6affa81',
    });
    expect(Object.isFrozen(REVIEWED_SEO_RECOVERY_BLOBS)).toBe(true);
  });
  it('accepts the exact reviewed sources as text and bytes', () => {
    for (const file of [authorityPath, comparisonPath]) {
      expect(isReviewedSeoRecoveryFile(file, read(file)), file).toBe(true);
      expect(isReviewedSeoRecoveryFile(file, fs.readFileSync(path.join(process.cwd(), file))), file).toBe(true);
    }
  });
  it('rejects any further protected-source mutation rather than allowing the whole filename', () => {
    for (const file of [authorityPath, comparisonPath]) {
      expect(isReviewedSeoRecoveryFile(file, read(file) + '// unreviewed edit')).toBe(false);
      expect(isReviewedSeoRecoveryFile(file, read(file).replace('/book-demo', '/pricing'))).toBe(false);
    }
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
    for (const file of ['src/pages/phonics.tsx', 'src/lib/commercialC2KeywordOwnership.ts', 'src/lib/commercialC4CtrOptimization.ts', 'src/lib/commercialC6ValidationFreeze.ts', 'toString', '__proto__']) {
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
