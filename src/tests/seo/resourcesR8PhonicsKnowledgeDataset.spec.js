import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'vitest';
import {
  PHONICS_KNOWLEDGE_DATASET as dataset, getPhonicsKnowledgeConcept as get,
  getPhonicsKnowledgeByFamily, getPhonicsKnowledgeByExpansionStatus,
  getPhonicsKnowledgeForLesson, getPhonicsKnowledgeByCanonicalOwner,
  getPhonicsKnowledgeByCandidateSlug, getBrick9PilotCandidates, getConceptsWithExistingOwners,
} from '../../content/phonicsKnowledge/index.js';
import { definePhonicsKnowledge } from '../../content/phonicsKnowledge/schema.js';
import { PHONICS_KNOWLEDGE_CURRICULUM as curriculum } from '../../content/phonicsKnowledge/curriculum.js';
import { CANONICAL_TOPIC_OWNERSHIP as owners } from '../../lib/canonicalTopicOwnershipRegistry.js';
import {
  PHONICS_PUBLISHED_RESOURCE_PAGES,
  PHONICS_PUBLISHED_RESOURCE_PATHS,
} from '../../lib/phonicsPublicationRegistry.js';
import { extractBlogEntriesFromPostFiles } from '../../../scripts/blog-route-utils.mjs';
import { validatePhonicsKnowledge } from '../../../scripts/phonics-knowledge-validation.mjs';
import { auditKnowledgePublicSurfaces, validateR8ChangedPaths } from '../../../scripts/phonics-knowledge-route-safety.mjs';

const blogPaths = extractBlogEntriesFromPostFiles(path.resolve('src/content/blog/posts')).flatMap((p) => [`/blog/${p.slug}`, `/blog/${p.sourceSlug}`]);
const validate = (overrides = {}) => validatePhonicsKnowledge({ blogPaths, approvedPublicationPages: PHONICS_PUBLISHED_RESOURCE_PAGES, ...overrides });
const mutate = (id, change) => dataset.map((c) => c.id === id ? { ...c, ...change } : c);
const fails = (code, overrides) => assert.ok(validate(overrides).errors.some((e) => e.code === code), `Expected ${code}`);

describe('Resources R8 phonics knowledge dataset', () => {
  it('passes the complete contract against real curriculum, routes and normalized blog slugs', () => {
    assert.deepEqual(validate().errors, []);
    assert.equal(validate().summary.curriculumLessons, 101);
  });
  it('keeps concept IDs and candidate slugs unique', () => {
    assert.equal(new Set(dataset.map((c) => c.id)).size, dataset.length);
    const slugs = dataset.map((c) => c.futureSlugCandidate).filter(Boolean);
    assert.equal(new Set(slugs).size, slugs.length);
  });
  it('indexes identity and returns null or a frozen empty result for misses', () => {
    assert.equal(get('ck-rule'), dataset.find((c) => c.id === 'ck-rule'));
    assert.equal(get('unknown'), null);
    assert.equal(getPhonicsKnowledgeByCandidateSlug('unknown'), null);
    assert.deepEqual(getPhonicsKnowledgeForLesson('unknown'), []);
    assert.ok(Object.isFrozen(getPhonicsKnowledgeForLesson('unknown')));
  });
  it('groups by family and expansion state without losing concepts', () => {
    for (const c of dataset) {
      assert.ok(getPhonicsKnowledgeByFamily(c.conceptType).includes(c));
      assert.ok(getPhonicsKnowledgeByExpansionStatus(c.expansionState).includes(c));
      assert.ok(getPhonicsKnowledgeByFamily(c.conceptType).every((x) => x.conceptType === c.conceptType));
    }
  });
  it('indexes every exact lesson reference and canonical owner', () => {
    for (const c of dataset) for (const ref of c.curriculumRefs) assert.ok(getPhonicsKnowledgeForLesson(ref.lessonId).includes(c));
    assert.deepEqual(getPhonicsKnowledgeByCanonicalOwner('satpin-phonics'), [get('satpin')]);
    assert.ok(getPhonicsKnowledgeForLesson('early-phonics__lesson-23').includes(get('magic-e')));
  });
  it('does not expose mutable records or arrays', () => {
    for (const c of dataset) {
      assert.ok(Object.isFrozen(c));
      for (const value of Object.values(c)) if (Array.isArray(value)) assert.ok(Object.isFrozen(value));
      for (const ref of c.curriculumRefs) assert.ok(Object.isFrozen(ref));
    }
    assert.throws(() => get('ck-rule').exampleWords.push('bad'), TypeError);
    assert.throws(() => getPhonicsKnowledgeByFamily('digraph').pop(), TypeError);
  });
  it('copies input collections before freezing and cannot be configured as published', () => {
    const exampleWords = ['cat'];
    const curriculumRefs = [{ courseId: 'early-phonics', lessonNumber: 12, label: 'Short Vowels' }];
    const c = definePhonicsKnowledge('test', { exampleWords, curriculumRefs, publicationApproved: true, publicationStatus: 'live' });
    exampleWords.push('dog'); curriculumRefs[0].label = 'Wrong';
    assert.deepEqual(c.exampleWords, ['cat']); assert.equal(c.curriculumRefs[0].label, 'Short Vowels');
    assert.equal(c.publicationApproved, false); assert.equal(c.publicationStatus, 'dataset-only');
  });
  it('keeps a controlled pool with direct curriculum alignment and no commercial intent', () => {
    const pool = getBrick9PilotCandidates();
    assert.ok(pool.length >= 12 && pool.length <= 20);
    for (const c of pool) {
      assert.equal(c.curriculumAlignment, 'direct');
      assert.equal(c.canonicalOwnerTopicId, null);
      assert.equal(getPhonicsKnowledgeByCandidateSlug(c.futureSlugCandidate), c);
      assert.ok(!/classes|fees|pricing|book-demo/.test(c.futureSlugCandidate));
    }
  });
  for (const [id, topicId, ownerPath] of [
    ['satpin', 'satpin-phonics', '/blog/satpin-phonics-guide'],
    ['blending', 'phonics-blending-progression', '/blog/how-kids-learn-blending'],
    ['cvc-words', 'cvc-words-explanation', '/blog/cvc-words-explained-for-parents'],
  ]) it(`preserves the established ${id} owner`, () => {
    assert.equal(get(id).expansionState, 'existing-owner');
    assert.equal(get(id).canonicalOwnerTopicId, topicId);
    assert.equal(owners.find((o) => o.id === topicId).ownerPath, ownerPath);
    assert.ok(getConceptsWithExistingOwners().includes(get(id)));
  });
  it('covers every non-revision lesson without inventing revision concepts', () => {
    for (const lesson of curriculum.filter((l) => l.rubricType !== 'revision')) assert.ok(getPhonicsKnowledgeForLesson(lesson.id).length, lesson.id);
    assert.equal(curriculum.filter((l) => l.rubricType === 'revision').length, 5);
    assert.equal(get('long-vowel-families').curriculumRefs.length, 5);
    assert.equal(get('long-vowel-families').expansionState, 'supporting-only');
  });
  it('retains phonics exception and pronunciation boundaries', () => {
    assert.ok(get('ck-rule').quickAnswer.includes('one-syllable'));
    assert.ok(get('floss-rule').commonConfusions.join(' ').includes('exceptions'));
    assert.ok(get('qu-sound').teachingNotes.join(' ').includes('two phonemes'));
    assert.ok(get('digraph-th').commonConfusions.length >= 2);
    assert.ok(get('diphthong-oo').standardTerm.includes('monophthong'));
    assert.ok(get('consonant-le').curriculumRefs.some((r) => r.label === 'Monster LE'));
    assert.ok(!get('shun-family').exampleWords.includes('vision'));
    assert.ok(get('shun-family').contrastWords.includes('vision'));
    assert.equal(get('missing-sleepy-sounds').curriculumAlignment, 'lesson-theme');
  });
  it('allows only the explicit downstream publication registry on publishing surfaces', () => {
    assert.deepEqual(auditKnowledgePublicSurfaces(process.cwd(), dataset, { approvedPaths: PHONICS_PUBLISHED_RESOURCE_PATHS }), []);
  });
  it('rejects all out-of-scope publishing changes even without a literal candidate slug', () => {
    for (const p of ['src/app/routes.tsx', 'src/pages/GeneratedPhonics.tsx', 'src/lib/publicRouteManifest.js', 'scripts/prerender.mjs', 'scripts/generate-sitemaps.js', 'public/sitemap.xml', 'public/llms.txt', 'firebase.json', 'src/lib/canonicalTopicOwnershipRegistry.js']) assert.equal(validateR8ChangedPaths([p]).length, 1, p);
    assert.deepEqual(validateR8ChangedPaths(['src/content/phonicsKnowledge/index.js', 'scripts/phonics-knowledge-validation.mjs']), []);
  });
  it('detects injected indirect publication and emitted candidate HTML', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'r8-public-'));
    try {
      fs.mkdirSync(path.join(root, 'src/app'), { recursive: true });
      fs.writeFileSync(path.join(root, 'src/app/routes.tsx'), 'import { getBrick9PilotCandidates } from "../content/phonicsKnowledge/index.js";');
      fs.mkdirSync(path.join(root, 'dist/resources/phonics/ck-rule-phonics'), { recursive: true });
      fs.writeFileSync(path.join(root, 'dist/resources/phonics/ck-rule-phonics/index.html'), '<h1>CK</h1>');
      const codes = auditKnowledgePublicSurfaces(root, dataset, { dist: true }).map((e) => e.code);
      assert.ok(codes.includes('runtime-publication-import'));
      assert.ok(codes.includes('candidate-output'));
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });
});

describe('Resources R8 audit rejection paths', () => {
  for (const [label, change, code] of [
    ['missing explanation', { quickAnswer: '' }, 'required-field'],
    ['empty examples', { exampleWords: [] }, 'pedagogical-depth'],
    ['unactionable practice', { practiceIdeas: ['Wonderful learning.', 'Excellent knowledge.'] }, 'practice-action'],
    ['unknown family', { conceptType: 'invented' }, 'classification'],
    ['unknown prerequisite', { prerequisiteIds: ['missing'] }, 'concept-relation'],
    ['self prerequisite', { prerequisiteIds: ['ck-rule'] }, 'concept-relation'],
    ['self next step', { nextIds: ['ck-rule'] }, 'concept-relation'],
    ['thin candidate', { distinctValueSignals: ['a'] }, 'pilot-readiness'],
    ['missing next step', { nextIds: [] }, 'pilot-readiness'],
    ['commercial intent', { searchIntent: 'online phonics classes for kids in India' }, 'reserved-intent'],
    ['discovery intent', { searchIntent: 'Tiny Steps phonics and reading resources' }, 'ownership-collision'],
    ['stolen SATPIN intent', { searchIntent: 'SATPIN starter sequence for children' }, 'ownership-collision'],
    ['stolen CVC intent', { searchIntent: 'CVC words explained for parents' }, 'ownership-collision'],
    ['changed pilot intent without re-screen', { parentQuestion: 'New parent problem?' }, 'ownership-screen'],
    ['published candidate', { publicationApproved: true }, 'publication-state'],
    ['unknown supporting URL', { supportingPaths: ['/nonexistent'] }, 'supporting-path'],
    ['route slug collision', { futureSlugCandidate: 'phonics' }, 'slug-collision'],
    ['blog slug collision', { futureSlugCandidate: 'satpin-phonics-guide' }, 'slug-collision'],
  ]) it(`rejects ${label}`, () => fails(code, { concepts: mutate('ck-rule', change) }));
  for (const [label, change] of [
    ['wrong course', { courseId: 'grammar' }],
    ['unknown lesson', { lessonNumber: 99, lessonId: 'early-phonics__lesson-99' }],
    ['malformed ID', { lessonId: 'early-phonics__lesson-5' }],
    ['fractional number', { lessonNumber: 5.5 }],
    ['wrong lesson title', { label: 'Wrong' }],
    ['mismatched ID', { lessonId: 'advanced-phonics__lesson-05' }],
  ]) it(`rejects ${label} curriculum references`, () => fails('curriculum-reference', { concepts: mutate('ck-rule', { curriculumRefs: [{ ...get('ck-rule').curriculumRefs[0], ...change }] }) }));
  it('rejects duplicate lesson references', () => fails('duplicate-reference', { concepts: mutate('ck-rule', { curriculumRefs: [get('ck-rule').curriculumRefs[0], get('ck-rule').curriculumRefs[0]] }) }));
  it('rejects duplicate concept IDs', () => fails('concept-id', { concepts: [...dataset, dataset[0]] }));
  it('rejects duplicate candidate slugs', () => fails('candidate-slug', { concepts: mutate('floss-rule', { futureSlugCandidate: 'ck-rule-phonics' }) }));
  it('rejects a redirect-source collision', () => fails('slug-collision', { redirects: [{ source: '/resources/phonics/ck-rule-phonics' }] }));
  it('rejects invalid and wrong-subject owners', () => {
    fails('existing-owner', { concepts: mutate('satpin', { canonicalOwnerTopicId: null }) });
    fails('existing-owner', { owners: owners.map((o) => o.id === 'satpin-phonics' ? { ...o, subject: 'grammar-writing' } : o) });
  });
  it('rejects cyclic prerequisite and next graphs', () => {
    fails('relation-cycle', { concepts: mutate('phonemic-awareness', { prerequisiteIds: ['letter-sound-foundations'] }) });
    fails('relation-cycle', { concepts: mutate('schwa-lazy-vowel', { nextIds: ['missing-sleepy-sounds'] }) });
  });
  it('rejects a changed canonical course structure', () => fails('curriculum-structure', { curriculum: curriculum.slice(1) }));
  it('rejects excessively recycled example banks', () => fails('recycled-examples', { concepts: dataset.map((c, i) => i < 3 ? { ...c, exampleWords: ['cat', 'dog'] } : c) }));
});
