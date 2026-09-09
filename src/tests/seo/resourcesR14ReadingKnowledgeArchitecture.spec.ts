import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import {
  READING_CONTENT_ACTIONS,
  READING_CONTENT_AUDIT,
  READING_KNOWLEDGE_DOMAINS,
  getReadingContentAuditByAction,
  getReadingKnowledgeDomain,
} from '../../lib/readingKnowledgeArchitecture.js';
import { getCanonicalTopicOwnerPath } from '../../lib/canonicalTopicOwnershipRegistry.js';

describe('Resources R14 reading knowledge architecture', () => {
  it('defines a stable reading-knowledge graph without pretending it is one rigid staircase', () => {
    expect(READING_KNOWLEDGE_DOMAINS).toHaveLength(9);
    expect(new Set(READING_KNOWLEDGE_DOMAINS.map((domain) => domain.id)).size).toBe(9);
    expect(READING_KNOWLEDGE_DOMAINS.map((domain) => domain.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(getReadingKnowledgeDomain('phonological-awareness')?.printBoundary).toBe('spoken-language');
    expect(getReadingKnowledgeDomain('phonemic-awareness')?.printBoundary).toBe('spoken-language');
    expect(getReadingKnowledgeDomain('phonics-decoding')?.printBoundary).toBe('speech-to-print');
    expect(getReadingKnowledgeDomain('fluency')?.printBoundary).toBe('connected-text');
  });

  it('keeps the editorial action vocabulary explicit', () => {
    expect(READING_CONTENT_ACTIONS).toEqual(['keep', 'refresh', 'consolidate', 'create']);
    for (const record of READING_CONTENT_AUDIT) expect(READING_CONTENT_ACTIONS).toContain(record.action);
  });

  it('maps every audit record to a real knowledge domain', () => {
    for (const record of READING_CONTENT_AUDIT) {
      expect(getReadingKnowledgeDomain(record.domainId)).toBeTruthy();
      expect(record.reasons.length).toBeGreaterThan(0);
    }
  });

  it('protects established reading owners instead of creating duplicate pillars', () => {
    const expectedOwners: Record<string, string> = {
      'phonics-definition': '/blog/what-is-phonics-for-kids',
      'phonics-parent-guide': '/blog/phonics-for-parents-guide',
      'phonics-blending-progression': '/blog/how-kids-learn-blending',
      'letter-sounds-known-word-reading-fails': '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
      'abc-known-reading-fails': '/blog/child-knows-abc-but-cannot-read',
      'cvc-words-explanation': '/blog/cvc-words-explained-for-parents',
      'reading-fluency-guide': '/blog/how-to-improve-reading-fluency-in-children',
    };
    for (const [topicId, path] of Object.entries(expectedOwners)) {
      expect(getCanonicalTopicOwnerPath(topicId)).toBe(path);
      const audit = READING_CONTENT_AUDIT.find((record) => record.canonicalTopicId === topicId);
      expect(audit?.path).toBe(path);
      expect(audit?.action).not.toBe('create');
    }
  });

  it('references existing public blog slugs for KEEP/REFRESH records', () => {
    const publicSlugs = new Set(blogPosts.map((post) => post.slug));
    for (const record of READING_CONTENT_AUDIT.filter((item) => item.path)) {
      const slug = record.path!.replace(/^\/blog\//, '');
      expect(publicSlugs.has(slug), `${record.id} should resolve to an existing public blog slug`).toBe(true);
    }
  });

  it('records only a small set of genuine CREATE gaps and does not publish them', () => {
    const publicSlugs = new Set(blogPosts.map((post) => post.slug));
    const createRecords = getReadingContentAuditByAction('create');
    expect(createRecords).toHaveLength(3);
    for (const record of createRecords) {
      expect(record.path).toBeNull();
      expect(record.proposedPath).toMatch(/^\/blog\/[a-z0-9-]+$/);
      const slug = record.proposedPath!.replace(/^\/blog\//, '');
      expect(publicSlugs.has(slug)).toBe(false);
    }
  });

  it('does not treat phonological awareness, phonemic awareness and phonics as synonyms', () => {
    const phonological = getReadingKnowledgeDomain('phonological-awareness');
    const phonemic = getReadingKnowledgeDomain('phonemic-awareness');
    const phonics = getReadingKnowledgeDomain('phonics-decoding');
    expect(phonological?.summary).toContain('syllables');
    expect(phonemic?.summary).toContain('phoneme-level');
    expect(phonics?.summary).toContain('graphemes');
  });
});
