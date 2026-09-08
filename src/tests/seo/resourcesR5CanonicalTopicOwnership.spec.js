import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CANONICAL_TOPIC_OWNERSHIP,
  getCanonicalTopicOwner,
  getCanonicalTopicOwnerPath,
  getCanonicalTopicsForSubject,
} from '../../lib/canonicalTopicOwnershipRegistry.js';
import { RESOURCE_ECOSYSTEM_REGISTRY } from '../../lib/resourcesArchitectureRegistry.js';

const repoRoot = process.cwd();
const subjectPageSource = fs.readFileSync(path.join(repoRoot, 'src/pages/SubjectResourcesPage.tsx'), 'utf8');
const r4Map = fs.readFileSync(path.join(repoRoot, 'docs/seo/resources-architecture/R4_CANONICAL_OWNERSHIP_MAP.md'), 'utf8');

const byPath = new Map(RESOURCE_ECOSYSTEM_REGISTRY.map((entry) => [entry.path, entry]));
const subjectHubs = new Set(['/resources/phonics', '/resources/grammar', '/resources/speaking']);

describe('Resources architecture R5 canonical topic ownership', () => {
  it('keeps topic ids and query-intent ownership unique', () => {
    const ids = CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.id);
    const queries = CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.queryIntent.trim().toLowerCase());

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(queries).size).toBe(queries.length);
  });

  it('lets Resources subject hubs own discovery only', () => {
    for (const entry of CANONICAL_TOPIC_OWNERSHIP.filter((item) => subjectHubs.has(item.ownerPath))) {
      expect(entry.ownerRole).toBe('subject-hub');
      expect(entry.intent).toBe('informational');
      expect(entry.id).toMatch(/subject-discovery$/);
    }

    for (const entry of CANONICAL_TOPIC_OWNERSHIP.filter((item) => ['commercial', 'high-commercial', 'solution-aware'].includes(item.intent))) {
      expect(subjectHubs.has(entry.ownerPath)).toBe(false);
    }
  });

  it('preserves the established commercial query owners from the R0 ecosystem registry', () => {
    const expectations = [
      ['live-phonics-classes', '/phonics', 'online phonics classes for kids in India'],
      ['phonics-fees-india', '/phonics-fees-india', 'phonics class fees in India'],
      ['best-online-phonics-comparison', '/best-online-phonics-classes-for-kids-in-india', 'best online phonics classes for kids in India'],
      ['live-grammar-classes', '/grammar', 'grammar classes for kids in India'],
      ['writing-classes', '/writing-classes-for-kids', 'writing classes for kids'],
      ['live-public-speaking-classes', '/speaking', 'public speaking classes for kids in India'],
      ['spoken-english-classes', '/spoken-english-classes-for-kids-online', 'spoken English classes for kids online'],
    ];

    for (const [topicId, ownerPath, queryOwner] of expectations) {
      const topic = getCanonicalTopicOwner(topicId);
      const ecosystem = byPath.get(ownerPath);
      expect(topic.ownerPath).toBe(ownerPath);
      expect(ecosystem).toBeTruthy();
      expect(ecosystem.primaryQueryOwner).toBe(queryOwner);
      expect(topic.queryIntent).toBe(queryOwner);
    }
  });

  it('protects established editorial and diagnostic owners', () => {
    const expectedOwners = {
      'phonics-parent-guide': '/blog/phonics-for-parents-guide',
      'satpin-phonics': '/blog/satpin-phonics-guide',
      'phonics-blending-progression': '/blog/how-kids-learn-blending',
      'phonics-blending-practice': '/blog/phonics-blending-activities',
      'abc-known-reading-fails': '/blog/child-knows-abc-but-cannot-read',
      'letter-sounds-known-word-reading-fails': '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
      'grammar-progression': '/blog/grammar-nouns-to-paragraphs',
      'sentence-formation': '/blog/how-to-improve-sentence-formation-in-kids',
      'grammar-transfer-mistakes': '/blog/child-knows-grammar-but-makes-mistakes',
      'speaking-confidence-progression': '/blog/speaking-confidence-seeds',
      'one-word-answers': '/blog/child-gives-one-word-answers',
      'understands-english-does-not-speak': '/blog/child-understands-english-but-does-not-speak',
    };

    for (const [topicId, pathName] of Object.entries(expectedOwners)) {
      expect(getCanonicalTopicOwnerPath(topicId)).toBe(pathName);
      expect(r4Map).toContain(`\`${pathName}\``);
    }
  });

  it('keeps subject-hub cards pointed at registered canonical owners', () => {
    const cardTopics = [
      'phonics-definition',
      'satpin-phonics',
      'phonics-blending-progression',
      'cvc-words-explanation',
      'letter-sound-practice',
      'word-building-practice',
      'reading-practice',
      'abc-known-reading-fails',
      'letter-sounds-known-word-reading-fails',
      'reading-fluency-guide',
      'grammar-progression',
      'sentence-formation',
      'grammar-transfer-mistakes',
      'grammar-practice',
      'sentence-building-practice',
      'grammar-focused-practice-game',
      'writing-classes',
      'speaking-confidence-progression',
      'one-word-answers',
      'understands-english-does-not-speak',
      'speaking-practice',
      'speaking-focused-practice-game',
      'shy-child-speaking-confidence',
    ];

    for (const topicId of cardTopics) {
      expect(subjectPageSource).toContain(getCanonicalTopicOwnerPath(topicId));
    }
  });

  it('keeps every subject family anchored to its dedicated Resources hub', () => {
    const expected = [
      ['phonics-reading', '/resources/phonics'],
      ['grammar-writing', '/resources/grammar'],
      ['speaking-communication', '/resources/speaking'],
    ];

    for (const [subject, hubPath] of expected) {
      const topics = getCanonicalTopicsForSubject(subject);
      expect(topics.length).toBeGreaterThan(5);
      for (const topic of topics) expect(topic.hubPath).toBe(hubPath);
    }
  });

  it('does not create ownership for unapproved granular programmatic topics', () => {
    const ids = CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.id);
    for (const forbidden of ['short-a-cvc', 'short-e-cvc', 'sh-digraph', 'ai-vowel-team', 'magic-e-pattern', 'r-controlled-ar']) {
      expect(ids).not.toContain(forbidden);
    }
  });
});
