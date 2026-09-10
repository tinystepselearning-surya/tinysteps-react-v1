import { PHONICS_KNOWLEDGE_DATASET } from '../content/phonicsKnowledge/index.js';
import { getPublishedPhonicsResourcePageByConceptId } from './phonicsPublicationRegistry.js';
import { getCanonicalTopicOwnerPath } from './canonicalTopicOwnershipRegistry.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const PHONICS_READING_COVERAGE_REVISION = '2026-09-10-ph3';
export const PHONICS_READING_COVERAGE_STATES = freezeList([
  'canonical-owner',
  'supporting-owner',
  'dataset-practice-only',
  'evidence-gated-hold',
]);

function coverageFor(concept) {
  const published = getPublishedPhonicsResourcePageByConceptId(concept.id);
  if (published) {
    return freeze({
      conceptId: concept.id,
      state: 'canonical-owner',
      ownerPath: published.path,
      ownerTopicId: published.topicId,
      supportingPaths: freezeList(concept.supportingPaths),
      heldSlugCandidate: null,
      rationale: 'Existing governed phonics publication owns this concept.',
    });
  }

  if (concept.canonicalOwnerTopicId) {
    return freeze({
      conceptId: concept.id,
      state: 'canonical-owner',
      ownerPath: getCanonicalTopicOwnerPath(concept.canonicalOwnerTopicId),
      ownerTopicId: concept.canonicalOwnerTopicId,
      supportingPaths: freezeList(concept.supportingPaths),
      heldSlugCandidate: null,
      rationale: 'An established canonical topic owner already serves this intent.',
    });
  }

  if (concept.expansionState === 'supporting-only') {
    return freeze({
      conceptId: concept.id,
      state: concept.supportingPaths.length ? 'supporting-owner' : 'dataset-practice-only',
      ownerPath: concept.supportingPaths[0] ?? null,
      ownerTopicId: null,
      supportingPaths: freezeList(concept.supportingPaths),
      heldSlugCandidate: null,
      rationale: concept.supportingPaths.length
        ? 'Broader established content supports the concept without creating a competing standalone owner.'
        : 'The concept remains reusable learning data without a public URL.',
    });
  }

  return freeze({
    conceptId: concept.id,
    state: 'evidence-gated-hold',
    ownerPath: null,
    ownerTopicId: null,
    supportingPaths: freezeList(concept.supportingPaths),
    heldSlugCandidate: concept.futureSlugCandidate ?? null,
    rationale: 'No new owner is authorized unless distinct intent, depth and cannibalisation review justify publication.',
  });
}

export const PHONICS_READING_COVERAGE = freezeList(PHONICS_KNOWLEDGE_DATASET.map(coverageFor));

const byConceptId = new Map(PHONICS_READING_COVERAGE.map((entry) => [entry.conceptId, entry]));
if (byConceptId.size !== PHONICS_READING_COVERAGE.length) throw new Error('PH3 coverage contains duplicate concept IDs.');
for (const entry of PHONICS_READING_COVERAGE) {
  if (!PHONICS_READING_COVERAGE_STATES.includes(entry.state)) throw new Error(`PH3 has unsupported state: ${entry.conceptId}`);
  if (entry.state === 'canonical-owner' && !entry.ownerPath) throw new Error(`PH3 canonical owner is missing a path: ${entry.conceptId}`);
  if (entry.state === 'evidence-gated-hold' && entry.ownerPath) throw new Error(`PH3 held concept cannot publish an owner path: ${entry.conceptId}`);
}

export function getPhonicsReadingCoverage(conceptId) {
  return byConceptId.get(String(conceptId || '')) ?? null;
}

export function getPhonicsReadingCoverageByState(state) {
  return freezeList(PHONICS_READING_COVERAGE.filter((entry) => entry.state === state));
}
