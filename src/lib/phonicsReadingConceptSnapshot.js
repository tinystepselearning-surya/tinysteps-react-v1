const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const PHONICS_READING_CONCEPT_SNAPSHOT_REVISION = '2026-09-10-ph3-r8-parity';

const concept = (id, label, conceptType, expansionState, options = {}) => freeze({
  id,
  label,
  conceptType,
  expansionState,
  canonicalOwnerTopicId: options.canonicalOwnerTopicId ?? null,
  supportingOwnerPath: options.supportingOwnerPath ?? null,
  futureSlugCandidate: options.futureSlugCandidate ?? null,
});

/**
 * Runtime-safe Session A projection of the frozen R8 concept inventory.
 *
 * R8 deliberately forbids arbitrary runtime imports from its source dataset,
 * because that dataset contains future publication candidates. This projection
 * contains only the minimum non-publishing metadata needed by PH3/PH6. Tests
 * compare every record back to R8 so drift fails CI without relaxing R8's
 * publication boundary.
 */
export const PHONICS_READING_CONCEPT_SNAPSHOT = freezeList([
  concept('phonemic-awareness', 'Phonemic awareness before print', 'phonological-foundation', 'supporting-only', { supportingOwnerPath: '/blog/phonics-rules-for-beginners' }),
  concept('letter-sound-foundations', 'Letter-sound foundations', 'sound-symbol', 'supporting-only', { supportingOwnerPath: '/blog/phonics-rules-for-beginners' }),
  concept('satpin', 'SATPIN starter sound set', 'sound-symbol', 'existing-owner', { canonicalOwnerTopicId: 'satpin-phonics' }),
  concept('blending', 'Sound blending for word reading', 'decoding-skill', 'existing-owner', { canonicalOwnerTopicId: 'phonics-blending-progression' }),
  concept('short-vowels', 'Short vowel system', 'vowel-system', 'supporting-only', { supportingOwnerPath: '/blog/phonics-rules-for-beginners' }),
  concept('cvc-words', 'CVC word decoding', 'decoding-skill', 'existing-owner', { canonicalOwnerTopicId: 'cvc-words-explanation' }),

  concept('ck-rule', 'CK spelling rule', 'spelling-rule', 'pilot-wave-1', { futureSlugCandidate: 'ck-rule-phonics' }),
  concept('floss-rule', 'Floss spelling rule', 'spelling-rule', 'pilot-wave-1', { futureSlugCandidate: 'floss-rule-phonics' }),
  concept('qu-sound', 'QU sound pattern', 'sound-symbol', 'pilot-wave-1', { futureSlugCandidate: 'qu-sound-phonics' }),
  concept('digraph-ch', 'CH digraph', 'digraph', 'pilot-wave-1', { futureSlugCandidate: 'ch-digraph-phonics' }),
  concept('digraph-sh', 'SH digraph', 'digraph', 'pilot-wave-1', { futureSlugCandidate: 'sh-digraph-phonics' }),
  concept('digraph-th', 'TH digraph: voiced and voiceless', 'digraph', 'pilot-wave-1', { futureSlugCandidate: 'th-digraph-phonics' }),
  concept('digraph-ng', 'NG digraph', 'digraph', 'pilot-wave-1', { futureSlugCandidate: 'ng-digraph-phonics' }),
  concept('soft-c-hard-c', 'Soft C and hard C', 'advanced-pattern', 'pilot-wave-1', { futureSlugCandidate: 'soft-c-hard-c-phonics' }),

  concept('vowel-team-ai', 'AI vowel team', 'vowel-team', 'pilot-wave-1', { futureSlugCandidate: 'ai-vowel-team-phonics' }),
  concept('vowel-team-ee', 'EE vowel team', 'vowel-team', 'pilot-wave-1', { futureSlugCandidate: 'ee-vowel-team-phonics' }),
  concept('vowel-team-ea', 'EA vowel team', 'vowel-team', 'pilot-wave-1', { futureSlugCandidate: 'ea-vowel-team-phonics' }),
  concept('vowel-team-ie', 'IE vowel team', 'vowel-team', 'pilot-wave-1', { futureSlugCandidate: 'ie-vowel-team-phonics' }),
  concept('vowel-team-oa', 'OA vowel team', 'vowel-team', 'pilot-wave-1', { futureSlugCandidate: 'oa-vowel-team-phonics' }),
  concept('magic-e', 'Magic E / silent-e pattern', 'magic-e', 'pilot-wave-1', { futureSlugCandidate: 'magic-e-phonics' }),
  concept('rabbit-rule', 'Rabbit Rule for two-syllable words', 'syllable-rule', 'pilot-wave-1', { futureSlugCandidate: 'rabbit-rule-phonics' }),
  concept('consonant-le', 'Consonant-le / Monster LE ending', 'syllable-rule', 'pilot-wave-1', { futureSlugCandidate: 'consonant-le-phonics' }),

  concept('soft-g-hard-g', 'Soft G and hard G', 'advanced-pattern', 'future-wave-2', { futureSlugCandidate: 'soft-g-hard-g-phonics' }),
  concept('r-controlled-ar', 'R-controlled AR', 'r-controlled', 'future-wave-2', { futureSlugCandidate: 'ar-r-controlled-vowels-phonics' }),
  concept('r-controlled-or', 'R-controlled OR', 'r-controlled', 'future-wave-2', { futureSlugCandidate: 'or-r-controlled-vowels-phonics' }),
  concept('r-controlled-er-ir-ur', 'R-controlled ER, IR and UR', 'r-controlled', 'future-wave-2', { futureSlugCandidate: 'er-ir-ur-r-controlled-vowels-phonics' }),
  concept('y-secret-vowel', 'Y as a vowel', 'alternate-vowel', 'future-wave-2', { futureSlugCandidate: 'y-as-a-vowel-phonics' }),
  concept('diphthong-oo', 'OO sound patterns', 'diphthong', 'future-wave-2', { futureSlugCandidate: 'oo-sounds-phonics' }),

  concept('diphthong-oi-oy', 'OI and OY patterns', 'diphthong', 'future-wave-2', { futureSlugCandidate: 'oi-oy-phonics' }),
  concept('diphthong-au-aw', 'AU and AW patterns', 'diphthong', 'future-wave-2', { futureSlugCandidate: 'au-aw-phonics' }),
  concept('diphthong-ou-ow', 'OU and OW patterns', 'diphthong', 'future-wave-2', { futureSlugCandidate: 'ou-ow-phonics' }),
  concept('j-sounds', 'Three common spellings for the J sound', 'advanced-pattern', 'future-wave-2', { futureSlugCandidate: 'j-sound-spellings-phonics' }),
  concept('shun-family', 'SHUN sound family', 'advanced-pattern', 'future-wave-2', { futureSlugCandidate: 'shun-sound-family-phonics' }),
  concept('schwa-lazy-vowel', 'Schwa / lazy vowel in unstressed syllables', 'alternate-vowel', 'future-wave-2', { futureSlugCandidate: 'schwa-sound-for-kids-phonics' }),

  concept('digraph-kn', 'KN and the silent initial K', 'digraph', 'future-wave-2', { futureSlugCandidate: 'kn-silent-k-phonics' }),
  concept('digraph-tch', 'CH and TCH spelling choice', 'spelling-rule', 'future-wave-2', { futureSlugCandidate: 'ch-tch-spelling-phonics' }),
  concept('digraph-wh-ph', 'WH and PH correspondences', 'digraph', 'supporting-only', { supportingOwnerPath: '/blog/digraphs-and-tricky-words' }),

  concept('vowel-team-ui', 'UI in the long /oo/ family', 'alternate-vowel', 'future-wave-2', { futureSlugCandidate: 'ui-vowel-sound-phonics' }),
  concept('long-vowel-families', 'Long A, E, I, O and U sound families', 'alternate-vowel', 'supporting-only', { supportingOwnerPath: '/blog/long-vowel-sounds-for-kids' }),
  concept('missing-sleepy-sounds', 'Missing and Sleepy Sounds', 'advanced-pattern', 'supporting-only', { supportingOwnerPath: '/blog/digraphs-and-tricky-words' }),
]);

const ids = PHONICS_READING_CONCEPT_SNAPSHOT.map((entry) => entry.id);
if (ids.length !== 40 || new Set(ids).size !== ids.length) throw new Error('PH3 concept snapshot must contain 40 unique R8 concept IDs.');

const byId = new Map(PHONICS_READING_CONCEPT_SNAPSHOT.map((entry) => [entry.id, entry]));
export function getPhonicsReadingConceptSnapshot(conceptId) {
  return byId.get(String(conceptId || '')) ?? null;
}
