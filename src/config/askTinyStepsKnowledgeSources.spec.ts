import { describe, expect, it } from 'vitest';
import {
  ASK_TINY_STEPS_KNOWLEDGE_SOURCES,
  ASK_TINY_STEPS_SITE_ORIGIN,
  getAskTinyStepsKnowledgeSourceStats,
  getLegacyKbRefreshPaths,
} from './askTinyStepsKnowledgeSources';

describe('Ask Tiny Steps knowledge source registry', () => {
  it('keeps ids, paths and canonical URLs unique', () => {
    const ids = ASK_TINY_STEPS_KNOWLEDGE_SOURCES.map((source) => source.id);
    const paths = ASK_TINY_STEPS_KNOWLEDGE_SOURCES.map((source) => source.path);
    const urls = ASK_TINY_STEPS_KNOWLEDGE_SOURCES.map((source) => source.canonicalUrl);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(paths).size).toBe(paths.length);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('keeps every source on the Tiny Steps public origin', () => {
    for (const source of ASK_TINY_STEPS_KNOWLEDGE_SOURCES) {
      expect(source.path.startsWith('/')).toBe(true);
      expect(source.canonicalUrl).toBe(`${ASK_TINY_STEPS_SITE_ORIGIN}${source.path}`);
    }
  });

  it('keeps priority-one parent decision sources AI enabled', () => {
    const required = ['/book-demo', '/pricing', '/courses', '/phonics', '/grammar', '/speaking'];
    const byPath = new Map(ASK_TINY_STEPS_KNOWLEDGE_SOURCES.map((source) => [source.path, source]));

    for (const path of required) {
      const source = byPath.get(path);
      expect(source).toBeDefined();
      expect(source?.priority).toBe(1);
      expect(source?.enabledForAI).toBe(true);
      expect(source?.lifecycle).toBe('evergreen');
    }
  });

  it('keeps Summer Camp historical and intent-only', () => {
    const summer = ASK_TINY_STEPS_KNOWLEDGE_SOURCES.find(
      (source) => source.path === '/summer-camps',
    );

    expect(summer).toMatchObject({
      lifecycle: 'archived',
      retrievalPolicy: 'intent_only',
      category: 'seasonal',
      priority: 5,
    });
  });

  it('maps exactly the currently curated kb.json entries into legacy refresh', () => {
    const paths = getLegacyKbRefreshPaths();
    expect(paths).toHaveLength(17);
    expect(paths).toContain('/pricing');
    expect(paths).toContain('/for-schools');
    expect(paths).toContain('/summer-camps');
    expect(paths).toContain('/blog/phonics-teacher-training-for-schools-implementation');
  });

  it('reports registry coverage for admin visibility', () => {
    const stats = getAskTinyStepsKnowledgeSourceStats();
    expect(stats.total).toBe(ASK_TINY_STEPS_KNOWLEDGE_SOURCES.length);
    expect(stats.enabled).toBe(stats.total);
    expect(stats.legacyKbAvailable).toBe(17);
    expect(stats.archived).toBe(1);
    expect(stats.parent).toBeGreaterThan(10);
    expect(stats.schools).toBeGreaterThan(5);
  });
});
