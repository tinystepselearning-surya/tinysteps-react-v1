import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import {
  GRAMMAR_WRITING_CONTENT_EXECUTION,
  getPublishedGrammarWritingContentExecutions,
} from '../../lib/grammarWritingContentExecutionRegistry.js';
import { R18_GRAMMAR_WRITING_CANONICAL_TOPIC_OWNERSHIP } from '../../lib/grammarWritingContentCanonicalOwnership.js';
import { R16_CANONICAL_TOPIC_OWNERSHIP } from '../../lib/readingSemanticCanonicalOwnership.js';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

const CREATED = [
  'punctuation-and-capital-letters-for-kids',
  'how-to-teach-paragraph-writing-to-kids',
] as const;

describe('Resources R18 high-value grammar and writing content execution', () => {
  it('executes exactly the two R17 CREATE decisions and no other grammar/writing items', () => {
    expect(GRAMMAR_WRITING_CONTENT_EXECUTION).toHaveLength(2);
    expect(getPublishedGrammarWritingContentExecutions()).toHaveLength(2);
    expect(GRAMMAR_WRITING_CONTENT_EXECUTION.map((item) => item.id)).toEqual([
      'punctuation-capitalisation-parent-guide',
      'paragraph-writing-parent-guide',
    ]);
    expect(GRAMMAR_WRITING_CONTENT_EXECUTION.every((item) => item.state === 'published')).toBe(true);
  });

  it('publishes both controlled gaps as substantive parent-facing guides', () => {
    for (const slug of CREATED) {
      const post = bySlug.get(slug);
      expect(post, `${slug} should be loaded by the blog registry`).toBeDefined();
      expect(post?.audience).toBe('Parent');
      expect(post?.body.filter((block) => block.type === 'h2').length).toBeGreaterThanOrEqual(8);
      expect(post?.body.filter((block) => block.type === 'p').length).toBeGreaterThanOrEqual(12);
      expect(post?.faq?.length).toBeGreaterThanOrEqual(5);
      expect(post?.metaDescription?.length).toBeGreaterThan(100);
      expect(post?.excerpt.length).toBeGreaterThanOrEqual(120);
      expect(post?.excerpt.length).toBeLessThanOrEqual(200);
    }
  });

  it('keeps punctuation instruction anchored to sentence meaning rather than thin mark definitions', () => {
    const text = bySlug.get(CREATED[0])?.body.map((block) => block.content).join('\n') ?? '';
    expect(text).toContain('meaning → sentence boundary → punctuation choice → rereading → transfer');
    expect(text).toContain('SAY → FIND → CHOOSE → WRITE → REREAD');
    expect(text).toContain('Commas have several jobs');
    expect(text).toContain('not a complete rule');
    expect(text).toContain('Evidence and curriculum boundary');
  });

  it('keeps paragraph instruction focused on coherence rather than a fixed sentence-count formula', () => {
    const text = bySlug.get(CREATED[1])?.body.map((block) => block.content).join('\n') ?? '';
    expect(text).toContain('Do not begin by demanding “five sentences.”');
    expect(text).toContain('FOCUS → PLAN → SAY → WRITE → CONNECT → REREAD');
    expect(text).toContain('Relevant details: teach children to choose, not just add');
    expect(text).toContain('Cohesion: how do sentences stick together?');
    expect(text).toContain('Evidence and curriculum boundary');
  });

  it('uses authoritative evidence boundaries and does not copy competitor/reference-site content', () => {
    for (const slug of CREATED) {
      const text = bySlug.get(slug)?.body.map((block) => block.content).join('\n') ?? '';
      expect(text).toContain('ies.ed.gov/ncee/wwc/PracticeGuide/17');
      expect(text).toContain('gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study');
      expect(text).not.toContain('readnaturally.com');
      expect(text).not.toContain('jollylearning.com');
      expect(text).not.toContain('learnphonics.co');
    }
  });

  it('adds exactly one canonical owner per new intent without colliding with the R16 graph', () => {
    expect(R18_GRAMMAR_WRITING_CANONICAL_TOPIC_OWNERSHIP).toHaveLength(2);
    const priorIds = new Set(R16_CANONICAL_TOPIC_OWNERSHIP.map((item: any) => item.id));
    const priorIntents = new Set(R16_CANONICAL_TOPIC_OWNERSHIP.map((item: any) => String(item.queryIntent).toLowerCase()));
    for (const owner of R18_GRAMMAR_WRITING_CANONICAL_TOPIC_OWNERSHIP) {
      expect(priorIds.has(owner.id)).toBe(false);
      expect(priorIntents.has(owner.queryIntent.toLowerCase())).toBe(false);
      expect(owner.ownerPath).toMatch(/^\/blog\//);
      expect(owner.hubPath).toBe('/resources/grammar');
      expect(owner.subject).toBe('grammar-writing');
    }
  });

  it('surfaces both new guides from the grammar resource hub without changing commercial ownership', () => {
    const hub = read('src/pages/SubjectResourcesPage.tsx');
    expect(hub).toContain('data-grammar-writing-featured-guides');
    for (const slug of CREATED) expect(hub).toContain(`/blog/${slug}`);
    expect(hub).toContain("programmeTo: '/grammar'");
  });
});
