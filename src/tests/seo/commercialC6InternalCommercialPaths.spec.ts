import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { COMMERCIAL_C3_UNIQUE_OWNER_PATHS } from '../../lib/commercialC3OwnerPageAudit';
import { COMMERCIAL_C5_POLICY } from '../../lib/commercialC5ConversionFlow';
import {
  COMMERCIAL_C6_R4_EDGES,
  COMMERCIAL_C6_R4_JOURNEYS,
  COMMERCIAL_C6_R4_POLICY,
  COMMERCIAL_C6_R4_STATUS,
  COMMERCIAL_C6_R4_SUMMARY,
} from '../../lib/commercialC6InternalCommercialPaths';

const repoRoot = path.resolve(__dirname, '../../..');
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const edgeKey = (from: string, to: string) => `${from}=>${to}`;

describe('Commercial C6-R4 internal commercial paths', () => {
  it('keeps R4 inside the frozen 14-owner commercial architecture', () => {
    expect(COMMERCIAL_C6_R4_STATUS).toBe('internal-commercial-paths-validated');
    expect(COMMERCIAL_C6_R4_POLICY.ownerCount).toBe(14);
    expect(COMMERCIAL_C6_R4_SUMMARY.ownerCount).toBe(14);
    expect(new Set(COMMERCIAL_C3_UNIQUE_OWNER_PATHS).size).toBe(14);
    expect(COMMERCIAL_C6_R4_POLICY.newCommercialUrlsAllowed).toBe(false);
    expect(COMMERCIAL_C6_R4_POLICY.c2OwnershipMutationAllowed).toBe(false);
    expect(COMMERCIAL_C6_R4_POLICY.c4MetadataMutationAllowed).toBe(false);
    expect(COMMERCIAL_C6_R4_POLICY.c5ConversionOwnerMutationAllowed).toBe(false);
  });

  it('preserves one direct assessment route from every pre-conversion owner', () => {
    const direct = COMMERCIAL_C6_R4_EDGES.filter((edge) => edge.role === 'direct-assessment');
    expect(direct).toHaveLength(13);
    expect(new Set(direct.map((edge) => edge.from)).size).toBe(13);
    expect(direct.every((edge) => edge.to === '/book-demo')).toBe(true);
    expect(COMMERCIAL_C5_POLICY.singleConversionOwner).toBe('/book-demo');
  });

  it('keeps all R4 edges inside existing commercial owners', () => {
    const owners = new Set(COMMERCIAL_C3_UNIQUE_OWNER_PATHS);
    for (const edge of COMMERCIAL_C6_R4_EDGES) {
      expect(owners.has(edge.from), `${edge.from} is not an existing owner`).toBe(true);
      expect(owners.has(edge.to), `${edge.to} is not an existing owner`).toBe(true);
    }
  });

  it('implements every strategic journey with explicit graph edges ending at assessment', () => {
    const edges = new Set(COMMERCIAL_C6_R4_EDGES.map((edge) => edgeKey(edge.from, edge.to)));
    expect(COMMERCIAL_C6_R4_JOURNEYS).toHaveLength(6);
    for (const journey of COMMERCIAL_C6_R4_JOURNEYS) {
      expect(journey.sequence.at(-1)).toBe('/book-demo');
      for (let index = 0; index < journey.sequence.length - 1; index += 1) {
        expect(edges.has(edgeKey(journey.sequence[index], journey.sequence[index + 1]))).toBe(true);
      }
    }
  });

  it('keeps comparison, fee and programme-fit handoffs explicit', () => {
    const edges = new Set(COMMERCIAL_C6_R4_EDGES.map((edge) => edgeKey(edge.from, edge.to)));
    expect(edges.has(edgeKey('/best-online-phonics-classes-for-kids-in-india', '/phonics-fees-india'))).toBe(true);
    expect(edges.has(edgeKey('/best-online-phonics-classes-for-kids-in-india', '/phonics'))).toBe(true);
    expect(edges.has(edgeKey('/phonics-fees-india', '/phonics'))).toBe(true);
    expect(edges.has(edgeKey('/pricing', '/reading-classes-for-kids'))).toBe(true);
    expect(edges.has(edgeKey('/pricing', '/writing-classes-for-kids'))).toBe(true);
    expect(edges.has(edgeKey('/pricing', '/spoken-english-classes-for-kids-online'))).toBe(true);
  });

  it('verifies that every R4 edge already exists in its owner page source', () => {
    const cache = new Map<string, string>();
    for (const edge of COMMERCIAL_C6_R4_EDGES) {
      const source = cache.get(edge.sourcePath) ?? read(edge.sourcePath);
      cache.set(edge.sourcePath, source);
      expect(source.includes(edge.to), `${edge.from} source is missing internal path ${edge.to}`).toBe(true);
    }
  });

  it('does not require body-copy or metadata churn during the C4 control window', () => {
    expect(COMMERCIAL_C6_R4_POLICY.implementationMode).toBe('validate-existing-links');
    expect(COMMERCIAL_C6_R4_POLICY.bodyCopyChangeRequired).toBe(false);
    expect(COMMERCIAL_C6_R4_POLICY.c4MetadataMutationAllowed).toBe(false);
  });
});
