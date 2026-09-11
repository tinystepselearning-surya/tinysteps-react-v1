import { describe, expect, it } from 'vitest';
import type { BlogPost } from '../../content/blog/types';
import { applyCommercialC7ContextualHandoffs } from '../../content/blog/shared/commercialHandoffs';
import {
  COMMERCIAL_C7_R3_HANDOFFS,
  COMMERCIAL_C7_R3_POLICY,
  COMMERCIAL_C7_R3_PROTECTED_EXISTING_SURFACES,
  COMMERCIAL_C7_R3_REVISION,
  COMMERCIAL_C7_R3_STATUS,
  COMMERCIAL_C7_R3_SUMMARY,
  getCommercialC7R3Handoff,
} from '../../lib/commercialC7ContextualHandoffImplementation';

function post(slug: string): BlogPost {
  return {
    slug,
    title: slug,
    category: 'Parent Tips',
    author: 'Tiny Steps Learning',
    date: '2026-09-11',
    readTime: '5 min read',
    excerpt: 'A sufficiently long excerpt for a focused C7-R3 test post that checks contextual next-step linking without changing metadata.',
    body: [{ type: 'p', content: 'Useful parent guidance without an existing commercial destination.' }],
  };
}

function bodyText(value: BlogPost) {
  return value.body.map((block) => block.content).join('\n');
}

describe('Commercial C7-R3 contextual commercial handoffs', () => {
  it('implements R2 without reopening frozen commercial architecture', () => {
    expect(COMMERCIAL_C7_R3_REVISION).toBe('2026-09-11-c7-r3');
    expect(COMMERCIAL_C7_R3_STATUS).toBe('contextual-commercial-handoffs-implemented');
    expect(COMMERCIAL_C7_R3_POLICY.liveContextualHandoffsAllowed).toBe(true);
    expect(COMMERCIAL_C7_R3_POLICY.directBlogBodyEditsAllowed).toBe(false);
    expect(COMMERCIAL_C7_R3_POLICY.newKnowledgeUrlsAllowed).toBe(false);
    expect(COMMERCIAL_C7_R3_POLICY.newCommercialUrlsAllowed).toBe(false);
    expect(COMMERCIAL_C7_R3_POLICY.c2OwnershipMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_R3_POLICY.c4MetadataMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_R3_POLICY.c5ConversionOwnerMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_R3_POLICY.c6ArchitectureMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_R3_POLICY.singleConversionOwner).toBe('/book-demo');
    expect(COMMERCIAL_C7_R3_POLICY.everyNonSoftRuleMustBeRenderedOrProtected).toBe(true);
  });

  it('resolves the broad-English buyer guide to the frozen broad-English owner instead of /courses', () => {
    const handoff = getCommercialC7R3Handoff('/blog/online-english-classes-for-kids-india');
    expect(handoff?.primary.to).toBe('/online-english-classes-for-kids');
    expect(handoff?.secondary).toBeNull();

    const transformed = applyCommercialC7ContextualHandoffs(post('online-english-classes-for-kids-india'));
    expect(bodyText(transformed)).toContain('](/online-english-classes-for-kids)');
    expect(bodyText(transformed)).not.toContain('](/courses)');
  });

  it('routes spoken-output difficulty to spoken English before assessment', () => {
    const handoff = getCommercialC7R3Handoff('/blog/child-understands-english-but-does-not-speak');
    expect(handoff?.primary.to).toBe('/spoken-english-classes-for-kids-online');
    expect(handoff?.secondary?.to).toBe('/book-demo');

    const transformed = applyCommercialC7ContextualHandoffs(post('child-understands-english-but-does-not-speak'));
    const text = bodyText(transformed);
    expect(text).toContain('](/spoken-english-classes-for-kids-online)');
    expect(text).toContain('](/book-demo)');
    expect(text.indexOf('/spoken-english-classes-for-kids-online')).toBeLessThan(text.indexOf('/book-demo'));
  });

  it('uses the specialist reading-fluency owner where R1/R2 resolved fluency intent', () => {
    const handoff = getCommercialC7R3Handoff('/blog/how-to-improve-reading-fluency-in-children');
    expect(handoff?.primary.to).toBe('/reading-fluency-program');
    const transformed = applyCommercialC7ContextualHandoffs(post('how-to-improve-reading-fluency-in-children'));
    expect(bodyText(transformed)).toContain('](/reading-fluency-program)');
  });

  it('keeps phonics comparison research inside the dedicated comparison owner', () => {
    const handoff = getCommercialC7R3Handoff('/blog/how-to-choose-phonics-classes');
    expect(handoff?.ruleClass).toBe('RESEARCH_HANDOFF');
    expect(handoff?.primary.to).toBe('/best-online-phonics-classes-for-kids-in-india');
    expect(handoff?.secondary).toBeNull();
  });

  it('does not inject a commercial prompt into soft parent-routine discovery', () => {
    expect(getCommercialC7R3Handoff('/blog/screen-smart-summer-routine-for-kids')).toBeNull();
    const transformed = applyCommercialC7ContextualHandoffs(post('screen-smart-summer-routine-for-kids'));
    const text = bodyText(transformed);
    expect(text).not.toContain('/book-demo');
    expect(text).not.toContain('/phonics');
    expect(text).not.toContain('/grammar');
    expect(text).not.toContain('/speaking');
  });

  it('caps every implemented knowledge surface at the R2 two-commercial-prompt maximum', () => {
    for (const handoff of COMMERCIAL_C7_R3_HANDOFFS) {
      expect(1 + (handoff.secondary ? 1 : 0)).toBeLessThanOrEqual(2);
      expect(1 + (handoff.secondary ? 1 : 0)).toBeLessThanOrEqual(handoff.maxCommercialPrompts);
    }
  });

  it('covers shared renderers while explicitly protecting navigation hubs and correct standalone paths', () => {
    expect(COMMERCIAL_C7_R3_SUMMARY.focusedPhonicsHandoffCount).toBeGreaterThan(0);
    expect(COMMERCIAL_C7_R3_SUMMARY.blogHandoffCount).toBeGreaterThan(0);
    expect(COMMERCIAL_C7_R3_PROTECTED_EXISTING_SURFACES.map((item) => item.path)).toEqual(
      expect.arrayContaining([
        '/blog',
        '/parents',
        '/resources/phonics',
        '/resources/grammar',
        '/resources/speaking',
        '/child-not-reading-properly',
        '/slow-reader-child-help',
        '/shy-child-speaking-confidence',
      ]),
    );
  });
});
