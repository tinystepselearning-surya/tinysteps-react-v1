import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { VOCABULARY_AUTHORITY_REQUIREMENTS, VOCABULARY_KNOWLEDGE_STAGES } from '../../lib/grammarVocabularyAuthorityRequirements.js';
import { VOCABULARY_AUTHORITY_PAGES } from '../../lib/vocabularyAuthorityRegistry.js';
import { VOCABULARY_AUTHORITY_PATHS, VOCABULARY_HUB_PATH } from '../../lib/vocabularyAuthoritySeoManifest.js';
import { VOCABULARY_LEXICAL_ENTRIES } from '../../lib/vocabularyLexicalModel';
import { PUBLIC_ROUTE_MANIFEST } from '../../lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';
import { CANONICAL_TOPIC_OWNERSHIP } from '../../lib/canonicalTopicOwnershipRegistry.js';
import { isPublicAnalyticsPath } from '../../lib/publicAnalyticsPathPolicy.js';
import {
  AI_ANSWER_LAYER_REVISION,
  AI_ANSWER_LAYER_2_LEARNING_CONCEPTS,
  AI_ANSWER_LAYER_3_PRACTICE_ACTIONS,
} from '../../lib/aiAnswerLayerRegistry.js';
import { getCommercialC7R1Mapping } from '../../lib/commercialC7KnowledgeOwnerMapping';
import { getCommercialC7R2NextStepRule } from '../../lib/commercialC7IntentNextStepRules';
import { getCommercialC7R3Handoff } from '../../lib/commercialC7ContextualHandoffImplementation';
import {
  VOCABULARY_GV6_DISCOVERY_SURFACES,
  VOCABULARY_GV6_FREEZE_POLICY,
  VOCABULARY_GV6_MEASUREMENT_POLICY,
  VOCABULARY_GV6_PRACTICE_OWNER,
  VOCABULARY_GV6_REVISION,
  VOCABULARY_GV6_SEMANTIC_DESTINATIONS,
  VOCABULARY_GV6_STATUS,
} from '../../lib/vocabularyGv6Closure.js';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('GV6 Vocabulary discovery, AI and practice integration closure', () => {
  it('freezes the completed 16-guide estate without creating another publication batch', () => {
    expect(VOCABULARY_GV6_REVISION).toBe('2026-09-27-gv6');
    expect(VOCABULARY_GV6_STATUS).toBe('discovery-ai-practice-integration-frozen');
    expect(VOCABULARY_AUTHORITY_REQUIREMENTS).toHaveLength(16);
    expect(VOCABULARY_KNOWLEDGE_STAGES).toHaveLength(6);
    expect(VOCABULARY_AUTHORITY_PAGES).toHaveLength(16);
    expect(VOCABULARY_AUTHORITY_PATHS).toHaveLength(16);
    expect(VOCABULARY_LEXICAL_ENTRIES).toHaveLength(50);
    expect(VOCABULARY_GV6_FREEZE_POLICY.newAuthorityUrlsAllowed).toBe(false);
    expect(VOCABULARY_GV6_FREEZE_POLICY.taxonomyMutationAllowed).toBe(false);
    expect(VOCABULARY_GV6_FREEZE_POLICY.lexicalBaselineExpansionAllowed).toBe(false);
  });

  it('keeps every Vocabulary authority route indexable, self-canonical, uniquely owned and measurable', () => {
    const manifestByPath = new Map(PUBLIC_ROUTE_MANIFEST.map((entry) => [entry.path, entry]));
    expect(isPublicAnalyticsPath(VOCABULARY_HUB_PATH)).toBe(true);

    for (const page of VOCABULARY_AUTHORITY_PAGES) {
      const manifest = manifestByPath.get(page.path);
      expect(manifest, page.path).toBeTruthy();
      expect(manifest?.indexable, page.path).not.toBe(false);
      expect(ROUTE_SEO_REGISTRY[page.path]?.canonicalPath, page.path).toBe(page.path);
      expect(isPublicAnalyticsPath(page.path), page.path).toBe(true);

      const owners = CANONICAL_TOPIC_OWNERSHIP.filter((entry) => entry.ownerPath === page.path);
      expect(owners, page.path).toHaveLength(1);
      expect(owners[0]?.subject, page.path).toBe('vocabulary');
      expect(owners[0]?.ownerRole, page.path).toBe('skill-guide');
    }

    expect(VOCABULARY_GV6_MEASUREMENT_POLICY.publicAnalyticsRequired).toBe(true);
    expect(VOCABULARY_GV6_MEASUREMENT_POLICY.expansionDefault).toBe('HOLD');
    expect(VOCABULARY_GV6_MEASUREMENT_POLICY.numericThresholdInvented).toBe(false);
  });

  it('exposes every guide in AI Layer 2 and keeps Vocabulary Adventure as the one Layer 3 practice owner', () => {
    expect(AI_ANSWER_LAYER_REVISION).toBe('2026-09-27-gv6');
    const vocabulary = AI_ANSWER_LAYER_2_LEARNING_CONCEPTS.filter((item) =>
      item.canonicalPath.startsWith('/resources/vocabulary/'),
    );
    expect(AI_ANSWER_LAYER_2_LEARNING_CONCEPTS).toHaveLength(112);
    expect(vocabulary).toHaveLength(16);

    for (const page of VOCABULARY_AUTHORITY_PAGES) {
      const item = vocabulary.find((entry) => entry.canonicalPath === page.path);
      expect(item, page.path).toBeTruthy();
      expect(item?.hubPath, page.path).toBe(VOCABULARY_HUB_PATH);
      expect(item?.practicePaths, page.path).toEqual([VOCABULARY_GV6_PRACTICE_OWNER]);
    }

    const vocabularyPractice = AI_ANSWER_LAYER_3_PRACTICE_ACTIONS.filter((item) => item.subject === 'vocabulary');
    expect(vocabularyPractice).toHaveLength(1);
    expect(vocabularyPractice[0]?.canonicalPath).toBe(VOCABULARY_GV6_PRACTICE_OWNER);
  });

  it('keeps the complete Vocabulary estate in C7 soft discovery with no commercial handoff', () => {
    for (const page of VOCABULARY_AUTHORITY_PAGES) {
      const mapping = getCommercialC7R1Mapping(page.path);
      const rule = getCommercialC7R2NextStepRule(page.path);
      expect(mapping, page.path).not.toBeNull();
      expect(mapping?.primaryCommercialOwner, page.path).toBeNull();
      expect(mapping?.ownerFamily, page.path).toBe('soft-discovery');
      expect(mapping?.decision, page.path).toBe('HOLD_SOFT_DISCOVERY');
      expect(rule?.ruleClass, page.path).toBe('SOFT_DISCOVERY');
      expect(rule?.primaryDestination, page.path).toBeNull();
      expect(rule?.maxCommercialPrompts, page.path).toBe(0);
      expect(getCommercialC7R3Handoff(page.path), page.path).toBeNull();
    }
  });

  it('preserves explicit Reading, Speaking and Writing transfer connections without changing ownership', () => {
    const byId = new Map(VOCABULARY_AUTHORITY_PAGES.map((page) => [page.id, page]));
    expect(byId.get('context-clues')?.relatedPaths).toContain(VOCABULARY_GV6_SEMANTIC_DESTINATIONS.reading);
    expect(byId.get('vocabulary-for-speaking')?.relatedPaths).toContain(VOCABULARY_GV6_SEMANTIC_DESTINATIONS.speaking);
    expect(byId.get('vocabulary-for-writing')?.relatedPaths).toContain(VOCABULARY_GV6_SEMANTIC_DESTINATIONS.writing);

    const allRelated = new Set(VOCABULARY_AUTHORITY_PAGES.flatMap((page) => page.relatedPaths));
    for (const destination of Object.values(VOCABULARY_GV6_SEMANTIC_DESTINATIONS)) {
      expect(allRelated.has(destination), destination).toBe(true);
    }
  });

  it('adds a generated 16-guide Vocabulary directory to both LLM discovery files', () => {
    const generator = read('scripts/generate-rss.mjs');
    expect(generator).toContain('Vocabulary Authority Library — 16 governed guides');
    expect(generator).toContain('buildVocabularyLlmSection');
    expect(generator).toContain('VOCABULARY_AUTHORITY_PAGES');
    expect(generator).toContain('Vocabulary Adventure');
    expect(VOCABULARY_GV6_DISCOVERY_SURFACES).toContain('/llms.txt');
    expect(VOCABULARY_GV6_DISCOVERY_SURFACES).toContain('/llms-full.txt');
    expect(VOCABULARY_GV6_DISCOVERY_SURFACES).toContain('/ai-resource-index.json');
  });

  it('holds expansion until measured evidence justifies reopening the frozen architecture', () => {
    expect(VOCABULARY_GV6_FREEZE_POLICY.newAuthorityUrlsAllowed).toBe(false);
    expect(VOCABULARY_GV6_FREEZE_POLICY.newPracticeOwnerAllowed).toBe(false);
    expect(VOCABULARY_GV6_FREEZE_POLICY.commercialOwnershipMutationAllowed).toBe(false);
    expect(VOCABULARY_GV6_FREEZE_POLICY.reopenRequires).toEqual([
      'measured-unmet-intent',
      'no-existing-canonical-owner',
      'source-backed-authority-plan',
      'full-publication-quality-gates',
    ]);
  });
});
