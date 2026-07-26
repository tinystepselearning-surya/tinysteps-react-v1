import {
  deriveLegacyProgressFromRatings,
  normalizeProgressRatings,
  summarizeProgressRatings,
} from '../../lib/skillRatings';
import { getProgressSkillsForLesson } from '../../lib/progressSkills';

describe('progress rating helpers', () => {
  it('normalizes explicit progress ratings and clamps invalid values', () => {
    const skills = getProgressSkillsForLesson({
      area: 'phonics',
      subskillChips: ['sound recall', 'blending', 'segmenting'],
    });

    expect(
      normalizeProgressRatings(
        {
          sound_recall: 3,
          blending: 9,
          segmenting: -1,
        },
        skills,
      ),
    ).toEqual({
      sound_recall: 3,
      blending: 4,
      segmenting: 0,
    });
  });

  it('falls back to legacy mastery and checks when dynamic ratings are missing', () => {
    const skills = getProgressSkillsForLesson({
      area: 'phonics',
      subskillChips: ['recognise sounds', 'say sounds clearly', 'read words', 'write letters'],
    });

    expect(
      normalizeProgressRatings(undefined, skills, {
        mastery: 'proficient',
        checks: {
          recognise: 'mastered',
          say: 'developing',
          read: 'emerging',
          write: 'not_started',
        },
      }),
    ).toEqual({
      recognise_sounds: 4,
      say_sounds_clearly: 2,
      read_words: 1,
      write_letters: 0,
    });
  });

  it('derives legacy summary fields from dynamic ratings', () => {
    const skills = getProgressSkillsForLesson({
      area: 'phonics',
      subskillChips: ['recognise sounds', 'say sounds clearly', 'read words', 'write letters'],
    });

    const result = deriveLegacyProgressFromRatings(
      {
        recognise_sounds: 4,
        say_sounds_clearly: 3,
        read_words: 3,
        write_letters: 1,
      },
      skills,
    );

    expect(result).toEqual({
      mastery: 'proficient',
      masteryKey: 'proficient',
      masteryPct: 75,
      checks: {
        recognise: 'mastered',
        say: 'proficient',
        read: 'proficient',
        write: 'emerging',
      },
    });
  });

  it('summarizes strongest skills, needs practice, and average from dynamic ratings', () => {
    const skills = getProgressSkillsForLesson({
      area: 'grammar',
      subskillChips: ['identify noun', 'use adjective', 'write sentence'],
    });

    const summary = summarizeProgressRatings(
      {
        identify_noun: 4,
        use_adjective: 2,
        write_sentence: 3,
      },
      skills,
    );

    expect(summary.roundedAverageRating).toBe(3);
    expect(summary.ratedSkillCount).toBe(3);
    expect(summary.strongestSkills.map((skill) => skill.label)).toEqual([
      'Identify noun',
      'Write sentence',
    ]);
    expect(summary.needsPracticeSkills.map((skill) => skill.label)).toEqual([
      'Use adjective',
    ]);
  });

  it('keeps the maximum at four and excludes zero entries from the positive-rating average', () => {
    const skills = getProgressSkillsForLesson({
      area: 'phonics',
      subskillChips: ['recognition', 'blending', 'writing'],
    });

    const summary = summarizeProgressRatings(
      {
        recognition: 4,
        blending: 2,
        writing: 0,
      },
      skills,
    );

    expect(summary.averageRating).toBe(3);
    expect(summary.roundedAverageRating).toBe(3);
    expect(summary.ratedSkillCount).toBe(2);
    expect(Math.max(...Object.values({ recognition: 4, blending: 2, writing: 0 }))).toBe(4);
  });
});
