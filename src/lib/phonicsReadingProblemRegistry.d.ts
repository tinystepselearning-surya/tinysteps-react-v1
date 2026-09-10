export type PhonicsReadingProblemOwnerState = 'existing-diagnostic' | 'supporting-owner' | 'hold-no-url';
export interface PhonicsReadingProblem {
  readonly id: string;
  readonly label: string;
  readonly symptom: string;
  readonly explanation: string;
  readonly diagnosisChecks: readonly string[];
  readonly skillIds: readonly string[];
  readonly practicePaths: readonly string[];
  readonly ownerState: PhonicsReadingProblemOwnerState;
  readonly ownerTopicId: string | null;
  readonly ownerPath: string | null;
  readonly nextStepPaths: readonly string[];
  readonly assessmentPath: '/book-demo';
}
export const PHONICS_READING_PROBLEM_REVISION: string;
export const PHONICS_READING_PROBLEM_OWNER_STATES: readonly PhonicsReadingProblemOwnerState[];
export const PHONICS_READING_PROBLEMS: readonly PhonicsReadingProblem[];
export function getPhonicsReadingProblem(problemId: string): PhonicsReadingProblem | null;
export function getPhonicsReadingProblemsForSkill(skillId: string): readonly PhonicsReadingProblem[];
