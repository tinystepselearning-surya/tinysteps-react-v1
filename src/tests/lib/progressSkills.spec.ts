import { getProgressSkillsForLesson } from '../../lib/progressSkills';

describe('getProgressSkillsForLesson', () => {
  it('resolves phonics foundation lesson skills from explicit lesson metadata', () => {
    const skills = getProgressSkillsForLesson({
      courseId: 'phonics-foundations',
      rubricType: 'single_sound',
      area: 'phonics',
      subskillChips: ['letter recognition', 'sound pronunciation', 'initial sound spotting', 'letter formation'],
    });

    expect(skills.map((skill) => skill.label)).toEqual([
      'Letter recognition',
      'Sound pronunciation',
      'Initial sound spotting',
      'Letter formation',
    ]);
  });

  it('prefers explicit lesson subskill metadata', () => {
    const skills = getProgressSkillsForLesson({
      courseId: 'early-phonics',
      rubricType: 'magic_e',
      area: 'phonics',
      subskillChips: ['magic e rule', 'short vs long', 'word reading'],
    });

    expect(skills.map((skill) => skill.label)).toEqual([
      'Magic e rule',
      'Short vs long',
      'Word reading',
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
