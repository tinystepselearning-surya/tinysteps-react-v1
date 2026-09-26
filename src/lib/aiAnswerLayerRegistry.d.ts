export type AiAnswerLayer = 1 | 2 | 3;
export type AiAnswerSubject =
  | 'phonics-reading'
  | 'grammar-writing'
  | 'speaking-communication';

export type AiAnswerLayerDefinition = Readonly<{
  id: string;
  layer: AiAnswerLayer;
  label: string;
  purpose: string;
}>;

export type AiAnswerLayerItem = Readonly<{
  id: string;
  layer: AiAnswerLayer;
  subject: AiAnswerSubject;
  query: string;
  answer: string | null;
  answerSource: string;
  canonicalPath: string;
  ownershipState: string;
  hubPath: string;
  supportingPaths: readonly string[];
  practicePaths: readonly string[];
}>;

export const AI_ANSWER_LAYER_REVISION: string;
export const AI_ANSWER_LAYER_MACHINE_JSON_PATH: '/ai-resource-index.json';
export const AI_ANSWER_LAYER_MACHINE_TEXT_PATH: '/ai-resource-index.txt';
export const AI_ANSWER_LAYER_DEFINITIONS: readonly AiAnswerLayerDefinition[];
export const AI_ANSWER_LAYER_1_PARENT_PROBLEMS: readonly AiAnswerLayerItem[];
export const AI_ANSWER_LAYER_2_LEARNING_CONCEPTS: readonly AiAnswerLayerItem[];
export const AI_ANSWER_LAYER_3_PRACTICE_ACTIONS: readonly AiAnswerLayerItem[];
export const AI_ANSWER_LAYERS: Readonly<Record<AiAnswerLayer, readonly AiAnswerLayerItem[]>>;
export const AI_ANSWER_LAYER_ALL_ITEMS: readonly AiAnswerLayerItem[];

export function getAiAnswerLayerItems(layer: number): readonly AiAnswerLayerItem[];
export function getAiAnswerLayerItemsForSubject(subject: AiAnswerSubject): readonly AiAnswerLayerItem[];
export function getAiAnswerLayerSubjectItems(layer: number, subject: AiAnswerSubject): readonly AiAnswerLayerItem[];
