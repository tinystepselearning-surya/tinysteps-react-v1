import { describe, expect, it } from 'vitest';
import { COMMERCIAL_C1_KEYWORD_UNIVERSE } from '../../lib/commercialC1SearchUniverse';
import { COMMERCIAL_C1_AI_STYLE_QUERIES } from '../../lib/commercialC1InternationalAiResearch';
import { COMMERCIAL_C1_INTERNATIONAL_ALL_QUERIES } from '../../lib/commercialC1InternationalCoreSubjectCompletion';
import {
  COMMERCIAL_C2_GEOGRAPHY_POLICY,
  COMMERCIAL_C2_GUARDRAILS,
  COMMERCIAL_C2_KEYWORD_ACCOUNTING,
  COMMERCIAL_C2_OWNERSHIP_CLUSTERS,
  COMMERCIAL_C2_ROUTE_DECISIONS,
  COMMERCIAL_C2_STATUS,
} from '../../lib/commercialC2KeywordOwnership';

const accountById = new Map(COMMERCIAL_C2_KEYWORD_ACCOUNTING.map((item) => [item.id, item]));
const clusterById = new Map(COMMERCIAL_C2_OWNERSHIP_CLUSTERS.map((item) => [item.id, item]));

describe('Commercial C2 canonical keyword ownership', () => {
  it('is ownership-complete and downstream of the complete C1 research universe', () => {
    expect(COMMERCIAL_C2_STATUS).toBe('ownership-complete');
    expect(COMMERCIAL_C2_KEYWORD_ACCOUNTING).toHaveLength(
      COMMERCIAL_C1_KEYWORD_UNIVERSE.length
      + COMMERCIAL_C1_INTERNATIONAL_ALL_QUERIES.length
      + COMMERCIAL_C1_AI_STYLE_QUERIES.length,
    );
  });

  it('accounts for every C1 research id exactly once with exactly one canonical owner', () => {
    const expectedIds = [
      ...COMMERCIAL_C1_KEYWORD_UNIVERSE.map((item) => item.id),
      ...COMMERCIAL_C1_INTERNATIONAL_ALL_QUERIES.map((item) => item.id),
      ...COMMERCIAL_C1_AI_STYLE_QUERIES.map((item) => item.id),
    ];
    expect(new Set(expectedIds).size).toBe(expectedIds.length);
    expect(new Set(COMMERCIAL_C2_KEYWORD_ACCOUNTING.map((item) => item.id)).size).toBe(expectedIds.length);
    for (const id of expectedIds) {
      const item = accountById.get(id);
      expect(item, id).toBeTruthy();
      expect(item?.canonicalOwnerPath, id).toMatch(/^\//);
      expect(item?.clusterId, id).toBeTruthy();
      expect(clusterById.get(item?.clusterId ?? ''), id).toBeTruthy();
    }
  });

  it('keeps one PRIMARY representative per commercial cluster', () => {
    for (const cluster of COMMERCIAL_C2_OWNERSHIP_CLUSTERS) {
      const primaries = COMMERCIAL_C2_KEYWORD_ACCOUNTING.filter(
        (item) => item.clusterId === cluster.id && item.status === 'PRIMARY',
      );
      expect(primaries, cluster.id).toHaveLength(1);
      expect(primaries[0].canonicalOwnerPath).toBe(cluster.canonicalOwnerPath);
    }
  });

  it('separates generic, comparison and price phonics intent', () => {
    expect(accountById.get('ph-online')).toMatchObject({
      clusterId: 'phonics-provider', canonicalOwnerPath: '/phonics', status: 'PRIMARY',
    });
    expect(accountById.get('ph-best')).toMatchObject({
      clusterId: 'phonics-comparison', canonicalOwnerPath: '/best-online-phonics-classes-for-kids-in-india', status: 'PRIMARY',
    });
    expect(accountById.get('ph-fees')).toMatchObject({
      clusterId: 'phonics-price', canonicalOwnerPath: '/phonics-fees-india', status: 'PRIMARY',
    });
  });

  it('keeps specialist reading fluency and confidence intent narrow', () => {
    expect(accountById.get('rd-fluency')).toMatchObject({
      clusterId: 'reading-fluency', canonicalOwnerPath: '/reading-fluency-program',
    });
    expect(accountById.get('rd-online')).toMatchObject({
      clusterId: 'reading-provider', canonicalOwnerPath: '/reading-classes-for-kids',
    });
    expect(accountById.get('cm-confidence')).toMatchObject({
      clusterId: 'confidence-building', canonicalOwnerPath: '/confidence-building-program-kids',
    });
    expect(accountById.get('cm-online')).toMatchObject({
      clusterId: 'communication-provider', canonicalOwnerPath: '/speaking',
    });
  });

  it('separates spoken-English from public-speaking ownership', () => {
    expect(accountById.get('se-online')).toMatchObject({ canonicalOwnerPath: '/spoken-english-classes-for-kids-online' });
    expect(accountById.get('ps-online')).toMatchObject({ canonicalOwnerPath: '/speaking' });
  });

  it('preserves Hyderabad as a narrow local owner while global and international intent inherit core owners', () => {
    expect(accountById.get('en-hyd')).toMatchObject({
      clusterId: 'broad-english-hyderabad', canonicalOwnerPath: '/online-english-classes-hyderabad',
    });
    expect(accountById.get('en-online')).toMatchObject({ canonicalOwnerPath: '/online-english-classes-for-kids' });
    expect(COMMERCIAL_C2_GEOGRAPHY_POLICY.newCountryOwnersCreated).toBe(0);
    for (const item of COMMERCIAL_C2_KEYWORD_ACCOUNTING.filter((entry) => entry.source === 'c1-international')) {
      expect(item.canonicalOwnerPath).not.toMatch(/\/(uae|usa|uk|australia|singapore|nri)(\/|$)/);
      expect(item.status).toBe('SECONDARY');
    }
  });

  it('maps explicit demo intent to the conversion owner but post-demo enrolment to the relevant programme', () => {
    expect(accountById.get('ai-uae-demo')).toMatchObject({
      canonicalOwnerPath: '/book-demo', clusterId: 'free-demo-booking', status: 'SEMANTIC',
    });
    expect(accountById.get('ai-global-demo-to-enrol')).toMatchObject({
      canonicalOwnerPath: '/online-english-classes-for-kids', clusterId: 'broad-english-provider', status: 'SEMANTIC',
    });
  });

  it('treats AI-style prompts as semantic demand rather than creating AI-prompt pages', () => {
    for (const item of COMMERCIAL_C2_KEYWORD_ACCOUNTING.filter((entry) => entry.source === 'c1-ai-style')) {
      expect(item.status).toBe('SEMANTIC');
      expect(item.canonicalOwnerPath).not.toContain('/ai-');
    }
    expect(COMMERCIAL_C2_GUARDRAILS.aiPromptPagesAllowed).toBe(false);
  });

  it('locks the known legacy cannibalisation decisions without implementing them in C2', () => {
    const byPath = new Map(COMMERCIAL_C2_ROUTE_DECISIONS.map((item) => [item.path, item]));
    expect(byPath.get('/public-speaking-communication-kids')).toMatchObject({
      action: 'CONSOLIDATE_TO_OWNER', canonicalOwnerPath: '/speaking',
    });
    expect(byPath.get('/english-grammar-writing-classes')).toMatchObject({
      action: 'DEMOTE_TO_SUPPORT', canonicalOwnerPath: null,
    });
    expect(byPath.get('/online-english-classes-for-kids-india')).toMatchObject({
      action: 'CONSOLIDATED_REDIRECT', canonicalOwnerPath: '/online-english-classes-for-kids',
    });
    expect(COMMERCIAL_C2_GUARDRAILS.redirectChangesInC2).toBe(false);
    expect(COMMERCIAL_C2_GUARDRAILS.publicPageChangesInC2).toBe(false);
    expect(COMMERCIAL_C2_GUARDRAILS.implementationBeginsAt).toBe('C3');
  });

  it('uses only the locked keyword-accounting statuses and creates no new owner', () => {
    const allowed = new Set(['PRIMARY','SECONDARY','SEMANTIC','SUPPORTING','NEW OWNER','CONSOLIDATED','HOLD','REJECT']);
    for (const item of COMMERCIAL_C2_KEYWORD_ACCOUNTING) expect(allowed.has(item.status), item.id).toBe(true);
    expect(COMMERCIAL_C2_KEYWORD_ACCOUNTING.some((item) => item.status === 'NEW OWNER')).toBe(false);
  });
});
