import { describe, expect, it } from 'vitest';
import { getPhonicsLessons, type PhonicsCourseId } from '../../content/phonicsCurriculum';
import { getProgressSkillsForLesson } from '../../lib/progressSkills';

function lessonSkills(courseId: PhonicsCourseId, lessonNumber: number) {
  const lesson = getPhonicsLessons(courseId).find((item) => item.lessonNumber === lessonNumber);
  if (!lesson) throw new Error(`Missing ${courseId} lesson ${lessonNumber}`);
  return getProgressSkillsForLesson({
    courseId: lesson.courseId,
    topicId: lesson.id,
    lessonId: lesson.lesson,
    rubricType: lesson.rubricType,
    stageLabel: lesson.stageLabel,
    lessonTitle: lesson.displayTitle,
    topicLabel: lesson.label,
    area: lesson.area,
  }).map((skill) => skill.label);
}

describe('canonical phonics lesson-specific progress rubrics', () => {
  it.each([2, 4, 9, 15, 16])('uses vowel-specific checks for Foundation lesson %i', (lessonNumber) => {
    expect(lessonSkills('phonics-foundations', lessonNumber)).toEqual([
      'Letter recognition',
      'Short vowel pronunciation',
      'Vowel sound spotting',
      'Letter formation',
    ]);
  });

  it('keeps the standard consonant single-sound rubric unchanged', () => {
    expect(lessonSkills('phonics-foundations', 1)).toEqual([
      'Letter recognition',
      'Sound pronunciation',
      'Initial sound spotting',
      'Letter formation',
    ]);
  });

  it('separates TH pronunciation from the KN silent-letter pattern', () => {
    expect(lessonSkills('early-phonics', 15)).toEqual([
      'TH recognition',
      'TH sound pronunciation',
      'KN silent-letter pattern',
      'Word reading',
      'Pattern spelling',
    ]);
  });

  it('uses a consolidated A-Z baseline for Advanced lesson 1', () => {
    expect(lessonSkills('advanced-phonics', 1)).toEqual([
      'A–Z sound recall',
      'Sound pronunciation',
      'Blend and segment',
      'Word reading',
      'Simple spelling',
    ]);
  });

  it.each([
    [24, 'A'],
    [25, 'E'],
    [26, 'I'],
    [27, 'O'],
    [28, 'U'],
  ] as const)('uses family-specific checks for Advanced long-%s families', (lessonNumber, vowel) => {
    expect(lessonSkills('advanced-phonics', lessonNumber)).toEqual([
      `Long ${vowel} family recognition`,
      `Compare long ${vowel} spellings`,
      `Read long-${vowel} words`,
      `Spell long-${vowel} words`,
      'Read sentence',
    ]);
  });

  it('uses reduced-sound checks for Missing and Sleepy Sounds', () => {
    expect(lessonSkills('advanced-phonics', 29)).toEqual([
      'Spot missing/sleepy sounds',
      'Pronounce reduced sounds',
      'Word reading',
      'Spelling pattern',
      'Read sentence',
    ]);
  });

  it.each([
    ['early-phonics', 40],
    ['advanced-phonics', 30],
  ] as const)('uses schwa-focused checks for %s lesson %i', (courseId, lessonNumber) => {
    expect(lessonSkills(courseId, lessonNumber)).toEqual([
      'Hear the schwa sound',
      'Spot unstressed syllables',
      'Word reading',
      'Schwa spelling choice',
      'Read sentence',
    ]);
  });

  it('keeps unaffected digraph lessons on the canonical digraph rubric', () => {
    expect(lessonSkills('early-phonics', 13)).toEqual([
      'Digraph recognition',
      'Sound pronunciation',
      'Word reading',
      'Spelling (digraph)',
      'Read sentence',
    ]);
  });
});
