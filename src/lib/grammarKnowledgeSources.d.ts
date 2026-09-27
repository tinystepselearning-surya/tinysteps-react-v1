export type GrammarKnowledgeSource = Readonly<{
  id: string;
  publisher: string;
  title: string;
  url: string;
  note: string;
}>;

export const GRAMMAR_KNOWLEDGE_SOURCES: Readonly<Record<string, GrammarKnowledgeSource>>;
export function getGrammarKnowledgeSources(sourceIds?: readonly string[]): readonly GrammarKnowledgeSource[];
