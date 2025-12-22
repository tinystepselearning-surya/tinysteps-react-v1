export type SkillResult = {
  tag: string;
  attempts: number;
  correct: number;
  wrong: number;
};

export type LevelResultInput = {
  schemaVersion: 1;
  eventId: string;
  kidId: string;
  gameId: string;
  progressDocId: string;
  levelId: string | number;
  accuracy: number;
  score?: number;
  attempts: number;
  correct: number;
  wrong: number;
  timeSpentSec: number;
  pointsEarned: number;
  skillResults: SkillResult[];
};
