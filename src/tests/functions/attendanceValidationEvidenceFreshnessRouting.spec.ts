import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('AVS cached evidence freshness routing', () => {
  const shadow = read('functions/src/attendanceValidation/shadowRunner.ts');
  const latest = read(
    'functions/src/attendanceValidation/latestCheckCallable.ts',
  );

  it('classifies freshness from the already preloaded session/evidence point reads', () => {
    expect(shadow).toContain('classifyCachedEvidenceFreshness');
    expect(shadow).toContain('const preloaded = await baseStore.loadWorkItems');
    expect(shadow).toContain('const compatibleLoaded');
    expect(shadow).toContain("'fresh_evidence_required'");
    expect(shadow).toContain(
      "'cached_evidence_compatibility_unresolved'",
    );
  });

  it('excludes stale evidence before same-day coverage aggregation', () => {
    const classifier = shadow.indexOf(
      'classifyCachedEvidenceFreshness({',
    );
    const sameDay = shadow.indexOf(
      'const sameDayGroups = new Map<string, SameDayGroupDescriptor>();',
      classifier,
    );
    expect(classifier).toBeGreaterThan(-1);
    expect(sameDay).toBeGreaterThan(classifier);
    expect(shadow).toContain(
      'for (const loadedItem of compatibleLoaded)',
    );
  });

  it('does not add another Firestore point-read pass', () => {
    expect(shadow).toContain(
      'pointReadDocumentBudget: normalizedItems.length * 2',
    );
    expect(shadow).not.toContain(
      'freshnessPointReadDocumentBudget',
    );
  });

  it('keeps stale/unsafe sessions dirty and exposes them to the caller', () => {
    expect(latest).toContain('freshEvidenceRequiredSessionIds');
    expect(latest).toContain('freshnessUnsafeSessionIds');
    expect(latest).toContain(
      "item.reason === 'fresh_evidence_required'",
    );
    expect(latest).toContain(
      "item.reason === 'cached_evidence_compatibility_unresolved'",
    );
    expect(latest).toContain(
      '.filter((sessionId) => !skippedSessionIds.has(sessionId))',
    );
  });

  it('keeps Latest Check Graph-free', () => {
    expect(latest).not.toContain('MicrosoftGraphClient');
    expect(latest).not.toContain('collectTeamsEvidence');
    expect(latest).toContain('graphCalls: 0');
  });
});
