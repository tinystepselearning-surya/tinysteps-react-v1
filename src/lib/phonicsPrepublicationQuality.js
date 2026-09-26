const freeze = (value) => Object.freeze(value);

export const PHONICS_PREPUBLICATION_QUALITY_REVISION = '2026-09-26-prepublish-v1';
export const PHONICS_PREPUBLICATION_QUALITY_STATE = 'passed';

export function assertPhonicsPrepublicationQuality(concept, approval) {
  const failures = [];
  const text = (value) => String(value || '').trim();
  const list = (value) => Array.isArray(value) ? value : [];

  if (text(concept?.parentQuestion).length < 20) failures.push('parentQuestion');
  if (text(concept?.quickAnswer).length < 60) failures.push('quickAnswer');
  if (text(concept?.searchIntent).length < 10) failures.push('searchIntent');
  if (list(concept?.exampleWords).length < 3) failures.push('exampleWords');
  if (list(concept?.teachingNotes).length < 2) failures.push('teachingNotes');
  if (list(concept?.practiceIdeas).length < 2) failures.push('practiceIdeas');
  if (list(concept?.commonConfusions).length < 1) failures.push('commonConfusions');
  if (list(concept?.curriculumRefs).length < 1) failures.push('curriculumRefs');
  if (list(concept?.supportingPaths).length < 1) failures.push('supportingPaths');

  if (text(approval?.topicId).length < 8) failures.push('topicId');
  if (text(approval?.seoTitle).length < 30) failures.push('seoTitle');
  if (text(approval?.seoDescription).length < 90) failures.push('seoDescription');
  if (text(approval?.cardTitle).length < 3) failures.push('cardTitle');
  if (!['Spelling rules', 'Consonant patterns', 'Vowel patterns', 'Word structure'].includes(approval?.group)) failures.push('group');

  if (failures.length) {
    throw new Error(`Phonics pre-publication quality gate failed for ${concept?.id || 'unknown'}: ${failures.join(', ')}`);
  }

  return freeze({
    state: PHONICS_PREPUBLICATION_QUALITY_STATE,
    revision: PHONICS_PREPUBLICATION_QUALITY_REVISION,
    checks: freeze([
      'intent',
      'quick-answer',
      'examples',
      'teaching-notes',
      'practice',
      'confusions',
      'curriculum-alignment',
      'supporting-links',
      'seo-title',
      'seo-description',
      'publication-group',
    ]),
  });
}
