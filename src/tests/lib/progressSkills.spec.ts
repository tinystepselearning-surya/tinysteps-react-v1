import { getProgressSkillsForLesson } from '../../lib/progressSkills';

describe('getProgressSkillsForLesson', () => {
  it('resolves phonics foundation lesson skills from its canonical rubric', () => {
    const skills = getProgressSkillsForLesson({
      courseId: 'phonics-foundations',
      rubricType: 'single_sound',
      area: 'phonics',
      subskillChips: ['stale skill that must not override canonical phonics'],
    });

    expect(skills.map((skill) => skill.label)).toEqual([
      'Letter recognition',
      'Sound pronunciation',
      'Initial sound spotting',
      'Letter formation',
    ]);
  });

  it('does not let historical Magic-E metadata leak into a canonical diphthong lesson', () => {
    const skills = getProgressSkillsForLesson({
      courseId: 'early-phonics',
      topicId: 'early-phonics__lesson-34',
      lessonId: 'Lesson-34',
      rubricType: 'diphthong',
      area: 'phonics',
      progressSkillsMeta: [
        { key: 'magic_e_rule', label: 'Magic E rule', area: 'phonics' },
        { key: 'short_vs_long', label: 'Short vs long', area: 'phonics' },
      ],
      subskillChips: ['Magic E rule', 'Spelling (magic e)'],
    });

    expect(skills.map((skill) => skill.label)).toEqual([
      'Diphthong recognition',
      'Sound glide practice',
      'Word reading',
      'Spelling choice',
      'Read sentence',
    ]);
    expect(skills.map((skill) => skill.label).join(' ')).not.toMatch(/Magic E|Short vs long/i);
  });

  it('still prefers explicit stored skill metadata for non-phonics feedback', () => {
    const skills = getProgressSkillsForLesson({
      courseId: 'basic-grammar',
      rubricType: 'concept',
      area: 'grammar',
      progressSkillsMeta: [
        { key: 'identify_nouns', label: 'Identify nouns', area: 'grammar' },
        { key: 'use_nouns', label: 'Use nouns in a sentence', area: 'grammar' },
      ],
    });

    expect(skills.map((skill) => skill.label)).toEqual([
      'Identify nouns',
      'Use nouns in a sentence',
    ]);
  });

  it('prefers explicit lesson subskill metadata when there is no canonical phonics rubric', () => {
    const skills = getProgressSkillsForLesson({
      courseId: 'basic-grammar',
      rubricType: 'unknown',
      area: 'grammar',
      subskillChips: ['identify concept', 'apply in sentence', 'write own example'],
    });

    expect(skills.map((skill) => skill.label)).toEqual([
      'Identify concept',
      'Apply in sentence',
      'Write own example',
    ]);
  });

  it('falls back to rubric defaults when lesson metadata is missing', () => {
    const skills = getProgressSkillsForLesson({
      courseId: 'advanced-grammar',
      rubricType: 'concept',
      area: 'grammar',
    });

    expect(skills.map((skill) => skill.label)).toEqual([
      'Identify concept',
      'Definition recall',
      'Spot examples',
      'Use in sentence',
      'Write own example',
    ]);
  });

  it('falls back to area defaults when there is no exact rubric match', () => {
    const skills = getProgressSkillsForLesson({
      courseId: 'basic-public-speaking',
      rubricType: 'unknown',
      area: 'speaking',
    });

    expect(skills.map((skill) => skill.label)).toEqual([
      'Confidence',
      'Pronunciation',
      'Fluency',
      'Idea expression',
      'Audience engagement',
    ]);
  });
});
