export type GrammarWorkedExample = Readonly<{
  example: string;
  explanation: string;
}>;

export type GrammarFaq = Readonly<{
  question: string;
  answer: string;
}>;

export type GrammarKnowledgeEnrichment = Readonly<{
  sourceIds: readonly string[];
  whyItMatters: string;
  rulePoints: readonly string[];
  workedExamples: readonly GrammarWorkedExample[];
  teachingNote: string;
  trickyCases: readonly string[];
  faqs: readonly GrammarFaq[];
}>;

export const GRAMMAR_KNOWLEDGE_ENRICHMENT: Readonly<Record<string, GrammarKnowledgeEnrichment>>;
export const GRAMMAR_KNOWLEDGE_ENRICHMENT_IDS: readonly string[];
export function getGrammarKnowledgeEnrichment(id: string): GrammarKnowledgeEnrichment | null;
