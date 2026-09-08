import { createHash } from 'node:crypto';
import { PHONICS_KNOWLEDGE_DATASET, PHONICS_KNOWLEDGE_STAGES, PHONICS_KNOWLEDGE_TYPES, PHONICS_EXPANSION_STATES } from '../src/content/phonicsKnowledge/index.js';
import { PHONICS_KNOWLEDGE_CURRICULUM } from '../src/content/phonicsKnowledge/curriculum.js';
import { CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/canonicalTopicOwnershipRegistry.js';
import { PUBLIC_ROUTE_MANIFEST, PUBLIC_REDIRECT_MANIFEST } from '../src/lib/publicRouteManifest.js';
import { PHONICS_PILOT_OWNERSHIP_SCREEN } from '../src/content/phonicsKnowledge/ownershipScreen.js';

export const intentFingerprint = (concept) => createHash('sha256').update(JSON.stringify([
  concept.id, concept.searchIntent, concept.parentQuestion, concept.futureSlugCandidate, concept.graphemes,
])).digest('hex');
const normalize = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const nonempty = (s) => typeof s === 'string' && s.trim().length > 0;
const countBy = (items, key) => items.reduce((out, item) => ({ ...out, [item[key]]: (out[item[key]] ?? 0) + 1 }), {});
const protectedIntents = [
  ['satpin-phonics', /\bsatpin\b/],
  ['cvc-words-explanation', /\bcvc\b/],
  ['phonics-blending-progression', /\b(?:how (?:kids|children) (?:learn )?(?:phonics )?blend\w*|blending progression|what (?:is|does) blending)\b/],
  ['abc-known-reading-fails', /\b(?:knows?|known) abc\b.*\b(?:cannot|fails?|not) read/],
  ['letter-sounds-known-word-reading-fails', /\b(?:knows?|known) (?:letter )?sounds\b.*\b(?:cannot|fails?|not) read/],
];

// Pure validator accepts mutated fixtures so negative tests exercise failure paths.
export function validatePhonicsKnowledge({
  concepts = PHONICS_KNOWLEDGE_DATASET,
  curriculum = PHONICS_KNOWLEDGE_CURRICULUM,
  owners = CANONICAL_TOPIC_OWNERSHIP,
  routes = PUBLIC_ROUTE_MANIFEST,
  redirects = PUBLIC_REDIRECT_MANIFEST,
  blogPaths = [],
  ownershipScreen = PHONICS_PILOT_OWNERSHIP_SCREEN,
  approvedPilotPages = [],
} = {}) {
  const errors = [], warnings = [];
  const fail = (code, id, detail) => errors.push({ code, id, detail });
  const ids = new Set(), slugs = new Set(), exampleLists = new Map();
  const lessons = new Map(curriculum.map((x) => [x.id, x]));
  const approvedByConcept = new Map((approvedPilotPages || []).map((page) => [page.conceptId, page]));
  const ownerById = new Map(owners.map((x) => [x.id, x]));
  const routePaths = new Set(routes.flatMap((x) => [x.path, x.canonicalPath].filter(Boolean)));
  const redirectSources = new Set(redirects.map((x) => x.source));
  const existingPaths = new Set([...routePaths, ...blogPaths]);
  const occupied = new Set([...existingPaths, ...redirectSources, ...owners.map((x) => x.ownerPath)]);
  const occupiedSlugs = new Set([...occupied].map((p) => p.split('/').filter(Boolean).at(-1)));
  const courseCounts = countBy(curriculum, 'courseId');
  const expectedCounts = { 'phonics-foundations': 31, 'early-phonics': 40, 'advanced-phonics': 30 };
  if (curriculum.length !== 101 || lessons.size !== 101 || Object.keys(courseCounts).length !== 3 || Object.entries(expectedCounts).some(([id, n]) => courseCounts[id] !== n)) {
    fail('curriculum-structure', 'curriculum', 'Canonical curriculum must contain 31/40/30 unique lessons.');
  }
  let referenceCount = 0, ownershipCollisions = 0, slugCollisions = 0;
  for (const original of concepts) {
    if (!original || typeof original !== 'object') { fail('concept-contract', 'unknown', 'Expected a concept object.'); continue; }
    const c = { ...original };
    for (const key of ['exampleWords', 'contrastWords', 'graphemes', 'teachingNotes', 'practiceIdeas', 'commonConfusions', 'prerequisiteIds', 'nextIds', 'distinctValueSignals', 'supportingPaths', 'curriculumRefs']) {
      if (!Array.isArray(c[key])) { fail('list-contract', c.id, key); c[key] = []; }
    }
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(c.id ?? '') || ids.has(c.id)) fail('concept-id', c.id, 'Malformed or duplicate concept ID.');
    ids.add(c.id);
    for (const key of ['label', 'searchIntent', 'parentQuestion', 'quickAnswer', 'expansionRationale']) {
      if (!nonempty(c[key])) fail('required-field', c.id, key);
    }
    if (!PHONICS_KNOWLEDGE_STAGES.includes(c.knowledgeStage) || !PHONICS_KNOWLEDGE_TYPES.includes(c.conceptType) || !PHONICS_EXPANSION_STATES.includes(c.expansionState)) fail('classification', c.id, 'Unknown stage, family, or expansion state.');
    if (!Number.isInteger(c.progressionRank) || c.progressionRank < 0) fail('progression-rank', c.id, 'Expected a nonnegative integer presentation hint.');
    if (c.subject !== 'phonics-reading' || c.publicationStatus !== 'dataset-only' || c.publicationApproved !== false || c.editorialState !== 'needs-human-review') fail('publication-state', c.id, 'R8 must remain unapproved dataset-only knowledge.');
    for (const key of ['exampleWords', 'contrastWords', 'graphemes', 'teachingNotes', 'practiceIdeas', 'commonConfusions', 'prerequisiteIds', 'nextIds', 'distinctValueSignals', 'supportingPaths']) {
      if (!Array.isArray(c[key]) || c[key].some((x) => !nonempty(x)) || new Set(c[key]).size !== c[key].length) fail('list-contract', c.id, key);
    }
    for (const key of ['exampleWords', 'teachingNotes', 'practiceIdeas', 'commonConfusions', 'distinctValueSignals']) {
      if (!Array.isArray(c[key]) || c[key].length < 2) fail('pedagogical-depth', c.id, key);
    }
    if (c.practiceIdeas?.some((idea) => !/\b(say|tap|build|sort|read|dictate|mark|compare|highlight|add|remove|circle|slide|mix|group|complete|predict|split|choose|hide|underline|contrast|check)\b/i.test(idea))) fail('practice-action', c.id, 'Practice must specify an observable action.');
    if (c.teachingNotes?.some((note) => c.practiceIdeas?.includes(note)) || c.quickAnswer === c.searchIntent) fail('thin-content', c.id, 'Explanation, instruction and practice must provide distinct value.');
    const examples = [...(c.exampleWords ?? [])].sort().join('|');
    exampleLists.set(examples, [...(exampleLists.get(examples) ?? []), c.id]);
    if (!['direct', 'embedded-skill', 'prerequisite-context', 'lesson-theme'].includes(c.curriculumAlignment)) fail('curriculum-alignment', c.id, 'Unknown alignment.');
    if (!Array.isArray(c.curriculumRefs) || (c.curriculumAlignment !== 'prerequisite-context' && !c.curriculumRefs.length)) fail('curriculum-refs', c.id, 'Missing curriculum references.');
    const refIds = new Set();
    for (const ref of c.curriculumRefs ?? []) {
      referenceCount++;
      if (!ref || typeof ref !== 'object') { fail('curriculum-reference', c.id, 'Expected a lesson reference object.'); continue; }
      const lesson = lessons.get(ref.lessonId);
      const expectedId = `${ref.courseId}__lesson-${String(ref.lessonNumber).padStart(2, '0')}`;
      if (!/^(phonics-foundations|early-phonics|advanced-phonics)__lesson-\d{2}$/.test(ref.lessonId ?? '') || !Number.isInteger(ref.lessonNumber) || !lesson || ref.lessonId !== expectedId || lesson.courseId !== ref.courseId || lesson.lessonNumber !== ref.lessonNumber || lesson.label !== ref.label) fail('curriculum-reference', c.id, JSON.stringify(ref));
      if (refIds.has(ref.lessonId)) fail('duplicate-reference', c.id, ref.lessonId);
      refIds.add(ref.lessonId);
    }
    for (const key of ['prerequisiteIds', 'nextIds']) for (const id of c[key] ?? []) {
      if (id === c.id || !concepts.some((other) => other.id === id)) fail('concept-relation', c.id, `${key}: ${id}`);
    }
    if (c.knowledgeStage !== 'pre-phonics' && !c.prerequisiteIds?.length) fail('missing-prerequisite', c.id, 'Non-foundational concepts need a readiness relationship.');
    const owner = ownerById.get(c.canonicalOwnerTopicId);
    if (c.canonicalOwnerTopicId != null && !owner) fail('owner-reference', c.id, 'Unknown R5 topic ID.');
    if (c.expansionState === 'existing-owner' && (!owner || owner.subject !== 'phonics-reading' || !existingPaths.has(owner.ownerPath) || redirectSources.has(owner.ownerPath))) fail('existing-owner', c.id, 'Owner must resolve to a current phonics page.');
    if (owner && c.expansionState !== 'existing-owner') fail('owner-classification', c.id, 'Concepts with the same intent as a canonical owner cannot be new page candidates.');
    for (const support of c.supportingPaths ?? []) if (!existingPaths.has(support) || redirectSources.has(support)) fail('supporting-path', c.id, support);
    if (['existing-owner', 'supporting-only'].includes(c.expansionState) && c.futureSlugCandidate !== null) fail('ineligible-slug', c.id, 'No new slug is allowed for this state.');
    if (['pilot-wave-1', 'future-wave-2'].includes(c.expansionState)) {
      const slug = c.futureSlugCandidate;
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug ?? '') || slugs.has(slug)) fail('candidate-slug', c.id, 'Malformed or duplicate candidate slug.');
      slugs.add(slug);
      const approved = approvedByConcept.get(c.id);
      const approvedPath = `/resources/phonics/${slug}`;
      const isExactApprovedR9 = Boolean(approved && approved.path === approvedPath && approved.slug === slug && approved.conceptId === c.id);
      if ((occupiedSlugs.has(slug) || [...occupied].some((p) => p.endsWith(`/${slug}`))) && !isExactApprovedR9) {
        slugCollisions++; fail('slug-collision', c.id, slug);
      }
      const query = normalize(`${c.label} ${c.searchIntent} ${c.parentQuestion} ${slug}`);
      if (/\b(classes|class fees|fees|pricing|price|tuition|enrol|enroll|book demo|assessment booking|best online|near me|resource hub|resources hub|resources gateway|resources discovery|learning resources)\b/.test(query)) fail('reserved-intent', c.id, 'Commercial or discovery intent cannot enter the candidate pool.');
      const canonicalQuery = owners.find((o) => normalize(o.queryIntent) === normalize(c.searchIntent) || normalize(o.queryIntent) === normalize(c.parentQuestion));
      const protectedMatch = protectedIntents.find(([id, regex]) => ownerById.has(id) && regex.test(query));
      const approvedOwnerMatch = isExactApprovedR9 && canonicalQuery?.id === approved?.topicId && !owner && !protectedMatch;
      if ((owner || canonicalQuery || protectedMatch) && !approvedOwnerMatch) {
        ownershipCollisions++; fail('ownership-collision', c.id, owner?.id ?? canonicalQuery?.id ?? protectedMatch[0]);
      }
    }
    if (c.expansionState === 'pilot-wave-1') {
      const screen = ownershipScreen[c.id];
      if (!screen || screen.intentFingerprint !== intentFingerprint(c) || screen.state !== 'screened-pending-human-review' || !nonempty(screen.differentiation) || !screen.comparedPaths?.length) fail('ownership-screen', c.id, 'New/changed pilot intent requires explicit comparison with established content.');
      for (const p of screen?.comparedPaths ?? []) if (!existingPaths.has(p)) fail('ownership-screen-path', c.id, p);
      if (c.distinctValueSignals?.length < 3 || !c.nextIds?.length || c.curriculumAlignment !== 'direct') fail('pilot-readiness', c.id, 'Pilot requires distinct value, a next step and direct lesson alignment.');
    }
  }
  for (const [list, usedBy] of exampleLists) if (list && usedBy.length > 2) fail('recycled-examples', usedBy.join(', '), 'Identical example bank reused more than twice.');
  // Prerequisites and recommended next links are separate graphs, not a second curriculum.
  for (const field of ['prerequisiteIds', 'nextIds']) {
    const visited = new Set(), active = new Set(), byId = new Map(concepts.map((c) => [c.id, c]));
    const visit = (id) => {
      if (active.has(id)) { fail('relation-cycle', id, field); return; }
      if (visited.has(id)) return;
      active.add(id);
      for (const next of byId.get(id)?.[field] ?? []) if (byId.has(next)) visit(next);
      active.delete(id); visited.add(id);
    };
    for (const id of byId.keys()) visit(id);
  }
  const byStatus = countBy(concepts, 'expansionState');
  if ((byStatus['pilot-wave-1'] ?? 0) > 20) fail('pilot-cap', 'dataset', 'Wave 1 exceeds 20 candidates.');
  if ((byStatus['pilot-wave-1'] ?? 0) < 12) warnings.push('Fewer than 12 Wave 1 candidates; never fill the pool with thin topics to meet a quota.');
  const referenced = new Set(concepts.flatMap((c) => (c.curriculumRefs ?? []).map((r) => r.lessonId)));
  const uncovered = curriculum.filter((l) => l.rubricType !== 'revision' && !referenced.has(l.id));
  if (uncovered.length) fail('curriculum-coverage', 'dataset', uncovered.map((l) => l.id).join(', '));
  warnings.push('Human pedagogical and publication review remains required for all concepts; candidates are not approved pages.');
  warnings.push('Lesson-theme examples need teacher confirmation; revision lessons are intentionally not standalone concepts.');
  return { errors, warnings, summary: { totalConcepts: concepts.length, byFamily: countBy(concepts, 'conceptType'), byStatus, curriculumLessons: curriculum.length, curriculumReferences: referenceCount, uniqueReferencedLessons: referenced.size, ownershipCollisions, slugCollisions } };
}
