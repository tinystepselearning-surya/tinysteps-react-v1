import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { getCanonicalTopicOwnerPath } from '../../lib/canonicalTopicOwnershipRegistry.js';
import { getGrammarWritingContentExecution } from '../../lib/grammarWritingContentExecutionRegistry.js';
import {
  GRAMMAR_WRITING_CONTENT_ACTIONS,
  GRAMMAR_WRITING_CONTENT_AUDIT,
  GRAMMAR_WRITING_KNOWLEDGE_DOMAINS,
  getGrammarWritingContentAuditByAction,
  getGrammarWritingKnowledgeDomain,
} from '../../lib/grammarWritingKnowledgeArchitecture.js';

describe('Resources R17 grammar and writing knowledge architecture', () => {
  it('defines nine interacting grammar/writing domains without pretending they form one rigid staircase', () => {
    expect(GRAMMAR_WRITING_KNOWLEDGE_DOMAINS).toHaveLength(9);
    expect(new Set(GRAMMAR_WRITING_KNOWLEDGE_DOMAINS.map((domain) => domain.id)).size).toBe(9);
    expect(GRAMMAR_WRITING_KNOWLEDGE_DOMAINS.map((domain) => domain.order)).toEqual([1,2,3,4,5,6,7,8,9]);
    expect(getGrammarWritingKnowledgeDomain('sentence-core')?.summary).toContain('complete idea');
    expect(getGrammarWritingKnowledgeDomain('punctuation-conventions')?.summary).toContain('sentence boundaries');
    expect(getGrammarWritingKnowledgeDomain('editing-transfer')?.summary).toContain('fresh speaking and writing');
  });

  it('uses the same controlled editorial action vocabulary as the reading audit', () => {
    expect(GRAMMAR_WRITING_CONTENT_ACTIONS).toEqual(['keep', 'refresh', 'consolidate', 'create']);
    for (const record of GRAMMAR_WRITING_CONTENT_AUDIT) expect(GRAMMAR_WRITING_CONTENT_ACTIONS).toContain(record.action);
  });

  it('protects the established canonical grammar owners', () => {
    const expected: Record<string, string> = {
      'grammar-progression': '/blog/grammar-nouns-to-paragraphs',
      'sentence-formation': '/blog/how-to-improve-sentence-formation-in-kids',
      'grammar-transfer-mistakes': '/blog/child-knows-grammar-but-makes-mistakes',
    };
    for (const [topicId, pathname] of Object.entries(expected)) {
      expect(getCanonicalTopicOwnerPath(topicId)).toBe(pathname);
      const record = GRAMMAR_WRITING_CONTENT_AUDIT.find((item) => item.canonicalTopicId === topicId);
      expect(record?.path).toBe(pathname);
      expect(record?.action).toBe('keep');
    }
  });

  it('maps every existing audit record to a real public blog slug', () => {
    const slugs = new Set(blogPosts.map((post) => post.slug));
    for (const record of GRAMMAR_WRITING_CONTENT_AUDIT.filter((item) => item.path)) {
      expect(slugs.has(record.path!.replace(/^\/blog\//, '')), `${record.id} should resolve to a public blog slug`).toBe(true);
    }
  });

  it('preserves strong focused guides instead of regenerating tenses, conjunctions, agreement, editing or assessment pages', () => {
    const protectedPaths = [
      '/blog/grammar-tenses',
      '/blog/grammar-conjunctions',
      '/blog/grammar-subject-verb',
      '/blog/grammar-creative-writing',
      '/blog/grammar-editing-camp',
      '/blog/grammar-assessment',
    ];
    for (const pathname of protectedPaths) {
      const record = GRAMMAR_WRITING_CONTENT_AUDIT.find((item) => item.path === pathname);
      expect(record?.action).toBe('keep');
    }
  });

  it('preserves exactly two R17 CREATE decisions while requiring explicit R18 execution before publication', () => {
    const slugs = new Set(blogPosts.map((post) => post.slug));
    const creates = getGrammarWritingContentAuditByAction('create');
    expect(creates).toHaveLength(2);
    expect(creates.map((item) => item.id)).toEqual([
      'punctuation-capitalisation-parent-guide',
      'paragraph-writing-parent-guide',
    ]);
    for (const record of creates) {
      expect(record.path).toBeNull();
      expect(record.proposedPath).toMatch(/^\/blog\/[a-z0-9-]+$/);
      const execution = getGrammarWritingContentExecution(record.id);
      expect(execution?.state).toBe('published');
      expect(execution?.path).toBe(record.proposedPath);
      expect(slugs.has(record.proposedPath!.replace(/^\/blog\//, ''))).toBe(true);
    }
  });

  it('does not split parts of speech or beginner punctuation into thin pages', () => {
    const roadmap = GRAMMAR_WRITING_CONTENT_AUDIT.find((item) => item.id === 'grammar-roadmap');
    const punctuation = GRAMMAR_WRITING_CONTENT_AUDIT.find((item) => item.id === 'punctuation-capitalisation-parent-guide');
    expect(roadmap?.reasons.join(' ')).toContain('parts-of-speech');
    expect(punctuation?.reasons.join(' ')).toContain('thin pages');
  });
});
