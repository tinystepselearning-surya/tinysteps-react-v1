import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import { CANONICAL_TOPIC_OWNERSHIP } from '../../lib/canonicalTopicOwnershipRegistry.js';
import { R19_CANONICAL_TOPIC_OWNERSHIP } from '../../lib/grammarWritingSemanticCanonicalOwnership.js';
import {
  R21_CANONICAL_TOPIC_OWNERSHIP,
  R21_SPEAKING_COMMUNICATION_CANONICAL_TOPIC_OWNERSHIP,
} from '../../lib/speakingCommunicationContentCanonicalOwnership.js';
import {
  SPEAKING_COMMUNICATION_CONTENT_EXECUTION,
  getPublishedSpeakingCommunicationContentExecutions,
} from '../../lib/speakingCommunicationContentExecutionRegistry.js';
import { getSpeakingCommunicationContentAuditByAction } from '../../lib/speakingCommunicationKnowledgeArchitecture.js';

const root = process.cwd();
const source = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');
const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));
const sourceBySlug: Record<string, string> = {
  'conversation-skills-for-kids': source('src/content/blog/posts/public-speaking/conversation-skills-for-kids.ts'),
  'how-to-teach-storytelling-to-kids': source('src/content/blog/posts/public-speaking/how-to-teach-storytelling-to-kids.ts'),
  'public-speaking-delivery-for-kids': source('src/content/blog/posts/public-speaking/public-speaking-delivery-for-kids.ts'),
};

const expectedExecutionPaths = [
  '/blog/conversation-skills-for-kids',
  '/blog/how-to-teach-storytelling-to-kids',
  '/blog/public-speaking-delivery-for-kids',
] as const;

const normalise = (value: string) => value.replace(/\s+/g, ' ').trim();

describe('Resources R21 high-value speaking content', () => {
  it('executes exactly the three R20 CREATE decisions and nothing else', () => {
    expect(SPEAKING_COMMUNICATION_CONTENT_EXECUTION).toHaveLength(3);
    expect(getPublishedSpeakingCommunicationContentExecutions()).toHaveLength(3);
    expect(SPEAKING_COMMUNICATION_CONTENT_EXECUTION.map((item) => item.path)).toEqual(expectedExecutionPaths);
    expect(SPEAKING_COMMUNICATION_CONTENT_EXECUTION.every((item) => item.state === 'published' && item.priorAction === 'create')).toBe(true);

    const plannedCreates = getSpeakingCommunicationContentAuditByAction('create');
    expect(plannedCreates).toHaveLength(3);
    for (const execution of SPEAKING_COMMUNICATION_CONTENT_EXECUTION) {
      const planned = plannedCreates.find((item) => item.id === execution.id);
      expect(planned?.proposedPath).toBe(execution.path);
      expect(planned?.path).toBeNull();
      expect(planned?.canonicalTopicId).toBeNull();
      expect(planned?.publicationApproved).toBe(false);
    }
  });

  it('publishes three substantial parent-facing speaking guides with clean metadata', () => {
    for (const pathname of expectedExecutionPaths) {
      const slug = pathname.replace('/blog/', '');
      const post = bySlug.get(slug);
      expect(post, `${slug} should be in blogPosts`).toBeTruthy();
      expect(post).toMatchObject({
        category: 'Public Speaking',
        author: 'Priya',
        date: '2026-09-10',
        audience: 'Parent',
        discoveryCategory: 'Speaking & Communication',
      });
      expect(normalise(post!.excerpt).length).toBeGreaterThanOrEqual(120);
      expect(normalise(post!.excerpt).length).toBeLessThanOrEqual(200);
      expect(normalise(post!.metaDescription ?? '').length).toBeGreaterThanOrEqual(120);
      expect(normalise(post!.metaDescription ?? '').length).toBeLessThanOrEqual(180);
      expect(post!.body.filter((block) => block.type === 'h2').length).toBeGreaterThanOrEqual(8);
      expect(post!.faq?.length ?? 0).toBeGreaterThanOrEqual(5);
      expect(post!.readTime).toMatch(/^1[0-9] min read$/);
    }
  });

  it('makes conversation a reciprocal communication guide rather than a longer-answer worksheet', () => {
    const article = sourceBySlug['conversation-skills-for-kids'];
    for (const marker of ['two-way exchange', 'LISTEN → RESPOND → ADD → ASK → REPAIR', 'turn-taking', 'follow-up question', 'repair a misunderstanding', 'does not require constant eye contact']) {
      expect(article).toContain(marker);
    }
    expect(article).toContain('Conversation is different from debate and public speaking');
    expect(article).toContain('multilingual');
  });

  it('distinguishes oral retelling from story creation and focuses on sequence, detail and independence', () => {
    const article = sourceBySlug['how-to-teach-storytelling-to-kids'];
    for (const marker of ['Retelling and creating a story are related but different jobs', 'SET → START → CHANGE → BUILD → END → RETELL', 'Teach sequence with meaning', 'choose relevant details', 'fewer adult prompts', 'Multilingual storytelling']) {
      expect(article).toContain(marker);
    }
    expect(article).toContain('/blog/grammar-speaking-bridge');
    expect(article).toContain('/blog/speaking-structure');
  });

  it('defines delivery around intelligibility and meaning without accent or forced-eye-contact conformity', () => {
    const article = sourceBySlug['public-speaking-delivery-for-kids'];
    for (const marker of ['pace, audible volume, pausing, emphasis, intelligibility', 'HEAR → FOLLOW → FEEL → CONNECT → ADJUST', 'Intelligibility is more useful than accent conformity', 'Constant eye contact is not a universal requirement', 'SAY → NOTICE → CHOOSE ONE TARGET → RETRY → TRANSFER']) {
      expect(article).toContain(marker);
    }
    expect(article).toContain('formal public-speaking and presentation skills are not the main focus');
  });

  it('uses authoritative curriculum/evidence sources with explicit evidence boundaries', () => {
    for (const article of Object.values(sourceBySlug)) {
      expect(article).toContain('https://www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study');
      expect(article).toContain('https://www.australiancurriculum.edu.au/');
      expect(article).toContain('https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/oral-language-interventions');
    }
  });

  it('adds exactly three canonical speaking owners on top of R19 without intent collisions', () => {
    expect(R21_SPEAKING_COMMUNICATION_CANONICAL_TOPIC_OWNERSHIP).toHaveLength(3);
    expect(R21_CANONICAL_TOPIC_OWNERSHIP).toHaveLength(R19_CANONICAL_TOPIC_OWNERSHIP.length + 3);
    expect(R21_SPEAKING_COMMUNICATION_CANONICAL_TOPIC_OWNERSHIP.map((entry) => [entry.id, entry.ownerPath])).toEqual([
      ['conversation-skills-guide', '/blog/conversation-skills-for-kids'],
      ['oral-storytelling-retelling-guide', '/blog/how-to-teach-storytelling-to-kids'],
      ['public-speaking-delivery-guide', '/blog/public-speaking-delivery-for-kids'],
    ]);
    expect(new Set(R21_CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.id)).size).toBe(R21_CANONICAL_TOPIC_OWNERSHIP.length);
    expect(new Set(R21_CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.queryIntent.trim().toLowerCase())).size).toBe(R21_CANONICAL_TOPIC_OWNERSHIP.length);
    for (const owner of R21_SPEAKING_COMMUNICATION_CANONICAL_TOPIC_OWNERSHIP) {
      expect(owner).toMatchObject({ subject: 'speaking-communication', intent: 'informational', ownerRole: 'editorial-pillar', hubPath: '/resources/speaking' });
    }
  });

  it('preserves the informational and commercial speaking owners plus the legacy consolidation hold', () => {
    const canonicalById = new Map(CANONICAL_TOPIC_OWNERSHIP.map((entry) => [entry.id, entry]));
    expect(canonicalById.get('speaking-subject-discovery')).toMatchObject({ ownerPath: '/resources/speaking', intent: 'informational' });
    expect(canonicalById.get('live-public-speaking-classes')).toMatchObject({ ownerPath: '/speaking', intent: 'high-commercial' });
    expect(canonicalById.get('spoken-english-classes')).toMatchObject({ ownerPath: '/spoken-english-classes-for-kids-online', intent: 'commercial' });

    const legacy = getSpeakingCommunicationContentAuditByAction('consolidate')[0];
    expect(legacy).toMatchObject({
      path: '/blog/spoken-english-classes-for-kids-confidence',
      consolidationTarget: '/blog/speaking-confidence-seeds',
      implementationState: 'hold',
      urlChangeAuthorized: false,
      publicationApproved: false,
    });
  });
});
