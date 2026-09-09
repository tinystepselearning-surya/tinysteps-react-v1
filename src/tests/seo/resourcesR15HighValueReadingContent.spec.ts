import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import {
  READING_CONTENT_EXECUTION,
  getPublishedReadingContentExecutions,
} from '../../lib/readingContentExecutionRegistry.js';
import { R15_READING_CANONICAL_TOPIC_OWNERSHIP } from '../../lib/readingContentCanonicalOwnership.js';
import { R12_CANONICAL_TOPIC_OWNERSHIP } from '../../lib/phonicsWave2CanonicalOwnership.js';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

const CREATED = [
  'phonological-awareness-vs-phonemic-awareness-vs-phonics',
  'how-vocabulary-supports-reading-comprehension',
  'how-children-recognise-words-automatically-after-phonics',
] as const;

describe('Resources R15 high-value reading content execution', () => {
  it('executes exactly three CREATE decisions and leaves the two refreshes as no-churn already-satisfied decisions', () => {
    expect(READING_CONTENT_EXECUTION).toHaveLength(5);
    expect(getPublishedReadingContentExecutions()).toHaveLength(3);
    expect(READING_CONTENT_EXECUTION.filter((item) => item.state === 'already-satisfied')).toHaveLength(2);
    expect(READING_CONTENT_EXECUTION.filter((item) => item.state === 'already-satisfied').map((item) => item.path).sort()).toEqual([
      '/blog/how-to-improve-reading-fluency-in-children',
      '/blog/phonics-comprehension',
    ]);
  });

  it('publishes the three controlled gaps as substantive parent-facing articles', () => {
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

  it('uses authoritative evidence boundaries instead of copying reference-site content', () => {
    const awareness = bySlug.get(CREATED[0]);
    const vocabulary = bySlug.get(CREATED[1]);
    const automatic = bySlug.get(CREATED[2]);
    const awarenessText = awareness?.body.map((block) => block.content).join('\n') ?? '';
    const vocabularyText = vocabulary?.body.map((block) => block.content).join('\n') ?? '';
    const automaticText = automatic?.body.map((block) => block.content).join('\n') ?? '';

    expect(awarenessText).toContain('Evidence and source boundary');
    expect(awarenessText).toContain('ies.ed.gov/ncee/wwc/PracticeGuide/21/Published');
    expect(awarenessText).toContain('gov.uk/government/publications/the-reading-framework-teaching-the-foundations-of-literacy');
    expect(vocabularyText).toContain('Evidence and source boundary');
    expect(vocabularyText).toContain('gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study');
    expect(automaticText).toContain('Evidence and source boundary');
    expect(automaticText).toContain('doi.org/10.1080/10888438.2013.819356');

    for (const text of [awarenessText, vocabularyText, automaticText]) {
      expect(text).not.toContain('readnaturally.com');
      expect(text).not.toContain('jollylearning.com');
      expect(text).not.toContain('literacytrust.org.uk');
    }
  });

  it('keeps phonological awareness, phonemic awareness and phonics conceptually separate', () => {
    const text = bySlug.get(CREATED[0])?.body.map((block) => block.content).join('\n') ?? '';
    expect(text).toContain('Phonological awareness');
    expect(text).toContain('Phonemic awareness');
    expect(text).toContain('Phonics');
    expect(text).toContain('without looking at letters');
    expect(text).toContain('phonics begins when speech sounds are explicitly connected with print');
    expect(text).toContain('not a rule that children must complete a long oral-only stage');
  });

  it('keeps automatic word recognition distinct from visual guessing', () => {
    const text = bySlug.get(CREATED[2])?.body.map((block) => block.content).join('\n') ?? '';
    expect(text).toContain('orthographic mapping');
    expect(text).toContain('memorising the word as a picture');
    expect(text).toContain('Guessing from shape, picture or first letter');
    expect(text).toContain('spelling, pronunciation and meaning');
  });

  it('assigns exactly one additive canonical owner to each new reading intent without colliding with R12', () => {
    expect(R15_READING_CANONICAL_TOPIC_OWNERSHIP).toHaveLength(3);
    const priorIds = new Set(R12_CANONICAL_TOPIC_OWNERSHIP.map((item: any) => item.id));
    const priorIntents = new Set(R12_CANONICAL_TOPIC_OWNERSHIP.map((item: any) => String(item.queryIntent).toLowerCase()));
    for (const owner of R15_READING_CANONICAL_TOPIC_OWNERSHIP) {
      expect(priorIds.has(owner.id)).toBe(false);
      expect(priorIntents.has(owner.queryIntent.toLowerCase())).toBe(false);
      expect(owner.ownerPath).toMatch(/^\/blog\//);
      expect(owner.hubPath).toBe('/resources/phonics');
    }
  });

  it('surfaces all three new knowledge guides compactly from the existing phonics resource hub', () => {
    const hub = read('src/components/resources/PhonicsPilotGuideGrid.tsx');
    expect(hub).toContain('data-reading-knowledge-guides');
    for (const slug of CREATED) expect(hub).toContain(`/blog/${slug}`);
  });

  it('does not manufacture a refresh or modified date for already-satisfied owners', () => {
    const fluency = read('src/content/blog/posts/parent-tips/how-to-improve-reading-fluency-in-children.ts');
    const comprehension = read('src/content/blog/posts/phonics/week-6-phonics-comprehension.ts');
    expect(fluency).toContain("modifiedDate: '2026-08-30'");
    expect(comprehension).toContain("modifiedDate: '2026-08-30'");
  });
});
