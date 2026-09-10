export type GrammarWritingCurriculumAnchor = {
  courseSlug: 'basic-grammar' | 'advanced-grammar';
  lessonNumber: number;
  lessonTitle: string;
};

export type GrammarWritingWritingStageKind = 'foundation' | 'sentence' | 'sentence-connection' | 'paragraph' | 'genre' | 'transfer';
export type GrammarWritingWritingPrerequisiteMode = 'all' | 'any';

export type GrammarWritingWritingPrinciple = Readonly<{
  id: string;
  statement: string;
}>;

export type GrammarWritingWritingStage = Readonly<{
  id: string;
  order: number;
  label: string;
  stageKind: GrammarWritingWritingStageKind;
  outputUnit: string;
  purpose: string;
  requiredGr1SkillIds: readonly string[];
  supportingGr2TenseIds: readonly string[];
  prerequisiteMode: GrammarWritingWritingPrerequisiteMode;
  prerequisiteStageIds: readonly string[];
  nextStageIds: readonly string[];
  masterySignals: readonly string[];
  commonBreakdowns: readonly string[];
  teachingMoves: readonly string[];
  transferCheck: string;
  publicAnchorTopicIds: readonly string[];
  curriculumAnchors: readonly Readonly<GrammarWritingCurriculumAnchor>[];
}>;

export type GrammarWritingWritingNextEdge = Readonly<{
  sourceStageId: string;
  relation: 'next';
  targetStageId: string;
}>;

export type GrammarWritingWritingCurriculumStageAnchor = Readonly<GrammarWritingCurriculumAnchor & {
  stageId: string;
}>;

export const GRAMMAR_WRITING_WRITING_REVISION: string;
export const GRAMMAR_WRITING_WRITING_ROOT_ID: string;
export const GRAMMAR_WRITING_WRITING_TERMINAL_ID: string;
export const GRAMMAR_WRITING_WRITING_PRINCIPLES: readonly GrammarWritingWritingPrinciple[];
export const GRAMMAR_WRITING_WRITING_STAGES: readonly GrammarWritingWritingStage[];
export const GRAMMAR_WRITING_WRITING_NEXT_EDGES: readonly GrammarWritingWritingNextEdge[];
export const GRAMMAR_WRITING_WRITING_CURRICULUM_ANCHORS: readonly GrammarWritingWritingCurriculumStageAnchor[];

export function getGrammarWritingWritingStage(id: string): GrammarWritingWritingStage | null;
export function getGrammarWritingWritingPrerequisites(id: string): readonly GrammarWritingWritingStage[];
export function getGrammarWritingNextWritingStages(id: string): readonly GrammarWritingWritingStage[];
export function getGrammarWritingWritingStagesForSkill(skillId: string): readonly GrammarWritingWritingStage[];
export function getGrammarWritingWritingStagesForTense(tenseId: string): readonly GrammarWritingWritingStage[];
export function getGrammarWritingWritingStagesForPublicTopic(topicId: string): readonly GrammarWritingWritingStage[];
