import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CANONICAL_TOPIC_OWNERSHIP } from '../../lib/canonicalTopicOwnershipRegistry.js';
import { PUBLIC_ROUTE_MANIFEST } from '../../lib/publicRouteManifest.js';
import { PHONICS_READING_PROBLEMS } from '../../lib/phonicsReadingProblemRegistry.js';
import {
  getPhonicsReadingSemanticOrphans,
  isPhonicsReadingSkillReachable,
} from '../../lib/phonicsReadingSemanticGraph';
import { GRAMMAR_WRITING_PARENT_PROBLEMS } from '../../lib/grammarWritingParentProblemArchitecture.js';
import {
  GRAMMAR_WRITING_GR6_SEMANTIC_NODES,
  GRAMMAR_WRITING_GR6_PUBLIC_OWNERS,
  getGrammarWritingGr6IncomingEdges,
  getGrammarWritingGr6OutgoingEdges,
} from '../../lib/grammarWritingGr6SemanticGraph.js';
import {
  GRAMMAR_WRITING_GR7_PUBLICATION_POLICY,
  GRAMMAR_WRITING_GR7_STATUS,
} from '../../lib/grammarWritingGr7Closure.js';
import {
  SPEAKING_COMMUNICATION_FREEZE,
  SPEAKING_COMMUNICATION_PARENT_PROBLEM_ROUTES,
  SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS,
} from '../../lib/speakingCommunicationCompletionArchitecture.js';
import {
  KNOWLEDGE_BASE_FINAL_POLICY,
  KNOWLEDGE_BASE_FINAL_PROTECTED_COMMERCIAL_OWNERS,
  KNOWLEDGE_BASE_FINAL_PROTECTED_HUBS,
  KNOWLEDGE_BASE_FINAL_REVISION,
  KNOWLEDGE_BASE_FINAL_SESSIONS,
  KNOWLEDGE_BASE_FINAL_STATUS,
  getKnowledgeBaseFinalSnapshot,
} from '../../lib/knowledgeBaseFinalClosure.js';

const root = process.cwd();
const routeByPath = new Map(PUBLIC_ROUTE_MANIFEST.map((route) => [route.path, route]));
const topicById = new Map(CANONICAL_TOPIC_OWNERSHIP.map((topic) => [topic.id, topic]));
const isKnownPublicPath = (candidate: string) => candidate.startsWith('/blog/') || routeByPath.has(candidate);

describe('KB-FINAL cross-knowledge-base integration and freeze', () => {
  it('freezes Sessions A, B and C as one completed knowledge base', () => {
    expect(KNOWLEDGE_BASE_FINAL_REVISION).toBe('2026-09-10-kb-final');
    expect(KNOWLEDGE_BASE_FINAL_STATUS).toBe('frozen');
    expect(KNOWLEDGE_BASE_FINAL_SESSIONS.map((session) => session.id)).toEqual(['session-a', 'session-b', 'session-c']);
    expect(KNOWLEDGE_BASE_FINAL_SESSIONS.every((session) => session.status === 'frozen')).toBe(true);
    expect(GRAMMAR_WRITING_GR7_STATUS).toBe('frozen');
    expect(SPEAKING_COMMUNICATION_FREEZE).toMatchObject({ state: 'frozen', contentExpansionAllowed: false });
  });

  it('keeps the three knowledge hubs self-canonical, indexable and discovery-only', () => {
    expect(KNOWLEDGE_BASE_FINAL_PROTECTED_HUBS).toEqual([
      '/resources/phonics',
      '/resources/grammar',
      '/resources/speaking',
    ]);
    for (const hub of KNOWLEDGE_BASE_FINAL_PROTECTED_HUBS) {
      expect(routeByPath.get(hub)).toMatchObject({
        path: hub,
        indexable: true,
        prerender: true,
        sitemap: true,
        canonicalPath: hub,
      });
      const ownedTopics = CANONICAL_TOPIC_OWNERSHIP.filter((topic) => topic.ownerPath === hub);
      expect(ownedTopics.length, hub).toBeGreaterThan(0);
      expect(ownedTopics.every((topic) => topic.ownerRole === 'subject-hub' && topic.intent === 'informational'), hub).toBe(true);
    }
  });

  it('protects commercial/conversion owners from knowledge-hub ownership leakage', () => {
    const expectedPaths = [
      '/phonics',
      '/reading-classes-for-kids',
      '/grammar',
      '/writing-classes-for-kids',
      '/speaking',
      '/spoken-english-classes-for-kids-online',
      '/online-english-classes-for-kids',
      '/book-demo',
    ];
    expect(KNOWLEDGE_BASE_FINAL_PROTECTED_COMMERCIAL_OWNERS.map((owner) => owner.path)).toEqual(expectedPaths);
    expect(new Set(expectedPaths).size).toBe(expectedPaths.length);

    for (const owner of KNOWLEDGE_BASE_FINAL_PROTECTED_COMMERCIAL_OWNERS) {
      expect(KNOWLEDGE_BASE_FINAL_PROTECTED_HUBS).not.toContain(owner.path);
      expect(routeByPath.get(owner.path)).toMatchObject({
        indexable: true,
        prerender: true,
        sitemap: true,
        canonicalPath: owner.path,
      });
      if (owner.topicId) expect(topicById.get(owner.topicId)?.ownerPath).toBe(owner.path);
    }
  });

  it('preserves global canonical query-intent uniqueness across the merged knowledge systems', () => {
    const ids = CANONICAL_TOPIC_OWNERSHIP.map((topic) => topic.id);
    const intents = CANONICAL_TOPIC_OWNERSHIP.map((topic) => topic.queryIntent.trim().toLowerCase());
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(intents).size).toBe(intents.length);

    for (const topic of CANONICAL_TOPIC_OWNERSHIP.filter((item) => ['commercial', 'high-commercial', 'solution-aware', 'transactional-brand'].includes(item.intent))) {
      expect(KNOWLEDGE_BASE_FINAL_PROTECTED_HUBS).not.toContain(topic.ownerPath);
    }
  });

  it('keeps each frozen parent-problem layer routed to real existing owners/practice without inventing a KB-FINAL page', () => {
    expect(PHONICS_READING_PROBLEMS).toHaveLength(9);
    for (const problem of PHONICS_READING_PROBLEMS) {
      if (problem.ownerPath) expect(isKnownPublicPath(problem.ownerPath), problem.id).toBe(true);
      expect(problem.practicePaths.every((entry) => isKnownPublicPath(entry)), problem.id).toBe(true);
      expect(problem.assessmentPath).toBe('/book-demo');
      if (problem.ownerState === 'hold-no-url') expect(problem.ownerPath).toBeNull();
    }

    expect(GRAMMAR_WRITING_PARENT_PROBLEMS).toHaveLength(10);
    expect(new Set(GRAMMAR_WRITING_PARENT_PROBLEMS.map((problem) => problem.id)).size).toBe(10);

    expect(SPEAKING_COMMUNICATION_PARENT_PROBLEM_ROUTES).toHaveLength(9);
    for (const problem of SPEAKING_COMMUNICATION_PARENT_PROBLEM_ROUTES) {
      expect(isKnownPublicPath(problem.ownerPath), `${problem.id} owner`).toBe(true);
      expect(isKnownPublicPath(problem.practicePath), `${problem.id} practice`).toBe(true);
      if (problem.supportingPath) expect(isKnownPublicPath(problem.supportingPath), `${problem.id} support`).toBe(true);
    }
  });

  it('preserves closed semantic journeys without cross-session orphan regression', () => {
    expect(isPhonicsReadingSkillReachable('phonemic-awareness', 'comprehension-transition')).toBe(true);
    expect(getPhonicsReadingSemanticOrphans().filter((entry) => entry.kind !== 'owner')).toEqual([]);

    expect(GRAMMAR_WRITING_GR6_PUBLIC_OWNERS).toHaveLength(17);
    for (const node of GRAMMAR_WRITING_GR6_SEMANTIC_NODES) {
      const degree = getGrammarWritingGr6IncomingEdges(node.ref).length + getGrammarWritingGr6OutgoingEdges(node.ref).length;
      expect(degree, node.ref).toBeGreaterThan(0);
    }

    expect(SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS).toHaveLength(15);
    for (const owner of SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS) {
      expect(isKnownPublicPath(owner.ownerPath), owner.id).toBe(true);
    }
  });

  it('keeps informational expansion frozen and commercial SEO explicitly downstream', () => {
    expect(GRAMMAR_WRITING_GR7_PUBLICATION_POLICY).toMatchObject({
      informationalExpansion: 'frozen',
      commercialSeoExpansion: 'separate-project',
    });
    expect(KNOWLEDGE_BASE_FINAL_POLICY).toMatchObject({
      informationalExpansion: 'frozen',
      reopenKnowledgeBase: 'evidence-required',
      newInformationalOwners: 'hold',
      commercialSeoExpansion: 'separate-project',
      keywordResearch: 'commercial-project',
    });

    const source = fs.readFileSync(path.join(root, 'src/lib/knowledgeBaseFinalClosure.js'), 'utf8');
    expect(source).not.toContain("ownerPath: '/blog/");
    expect(source).not.toContain('newArticle');
    expect(source).not.toContain('publicationApproved: true');
  });

  it('exposes one immutable downstream closure snapshot and keeps closure evidence present', () => {
    const snapshot = getKnowledgeBaseFinalSnapshot();
    expect(snapshot.status).toBe('frozen');
    expect(snapshot.sessions).toBe(KNOWLEDGE_BASE_FINAL_SESSIONS);
    expect(snapshot.protectedHubs).toBe(KNOWLEDGE_BASE_FINAL_PROTECTED_HUBS);
    expect(snapshot.protectedCommercialOwners).toBe(KNOWLEDGE_BASE_FINAL_PROTECTED_COMMERCIAL_OWNERS);
    expect(Object.isFrozen(snapshot)).toBe(true);

    for (const session of KNOWLEDGE_BASE_FINAL_SESSIONS) {
      expect(fs.existsSync(path.join(root, session.closureEvidence)), session.closureEvidence).toBe(true);
    }
  });
});
