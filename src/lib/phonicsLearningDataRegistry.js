import { PHONICS_SOUND_REGISTRY, getPhonicsSound } from './phonicsSoundRegistry.js';
import { PHONICS_WORD_UTILITY_RECORDS } from './phonicsWordUtilityRegistry.js';
import { getPhonicsReadingSkill } from './phonicsReadingTaxonomy.js';

const freezeList = (values = []) => Object.freeze([...values]);

export const PHONICS_LEARNING_DATA_REVISION = '2026-09-10-ph2';
export const PHONICS_LEARNING_REVIEW_STATES = freezeList(['approved', 'pending', 'not-required']);

const BASELINE_WORD_SKILLS = new Set(['letter-sounds', 'blending', 'segmenting', 'cvc']);

const isBaselineCvcWord = (record) => {
  if (record.soundChunkCount !== 3 || record.phonemeCount !== 3) return false;
  return record.segments.every((segment) => {
    const sound = getPhonicsSound(segment.soundId);
    return sound && ['Consonant', 'Short Vowel'].includes(sound.category) && segment.grapheme.length === 1;
  });
};

/**
 * PH2 does not re-segment or republish words. It indexes the existing explicit
 * R13 word records against PH1 skills through established R8 concept IDs. A
 * narrow CVC predicate is retained for the starter words whose R13 records
 * intentionally have no published concept owner.
 */
export function getPhonicsWordUtilitiesBySkillId(skillId) {
  const skill = getPhonicsReadingSkill(skillId);
  if (!skill) return freezeList([]);
  const conceptIds = new Set(skill.knowledgeConceptIds);
  return freezeList(PHONICS_WORD_UTILITY_RECORDS.filter((record) => {
    if (record.conceptIds.some((conceptId) => conceptIds.has(conceptId))) return true;
    return BASELINE_WORD_SKILLS.has(skill.id) && isBaselineCvcWord(record);
  }));
}

export function getPhonicsSoundsForSkillId(skillId) {
  const words = getPhonicsWordUtilitiesBySkillId(skillId);
  const soundIds = new Set(words.flatMap((record) => record.segments.map((segment) => segment.soundId)));
  return freezeList(PHONICS_SOUND_REGISTRY.filter((sound) => soundIds.has(sound.id)));
}

export function getPhonicsLearningDataForSkill(skillId) {
  const skill = getPhonicsReadingSkill(skillId);
  if (!skill) return null;
  return Object.freeze({
    skill,
    words: getPhonicsWordUtilitiesBySkillId(skill.id),
    sounds: getPhonicsSoundsForSkillId(skill.id),
  });
}

export function getPhonicsPendingSoundAssets() {
  return freezeList(PHONICS_SOUND_REGISTRY.filter((sound) => sound.assetState === 'pending'));
}

export function getPhonicsPendingWordReviews() {
  return freezeList(PHONICS_WORD_UTILITY_RECORDS.filter((record) => record.humanReviewState === 'pending'));
}
