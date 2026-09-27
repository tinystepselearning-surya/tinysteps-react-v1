import { GRAMMAR_KNOWLEDGE_FOUNDATIONS } from './grammarKnowledgeEnrichmentFoundations.js';
import { GRAMMAR_KNOWLEDGE_TENSES_AND_FORMS } from './grammarKnowledgeEnrichmentTenses.js';
import { GRAMMAR_KNOWLEDGE_SENTENCE_AND_WRITING } from './grammarKnowledgeEnrichmentWriting.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

const raw = {
  ...GRAMMAR_KNOWLEDGE_FOUNDATIONS,
  ...GRAMMAR_KNOWLEDGE_TENSES_AND_FORMS,
  ...GRAMMAR_KNOWLEDGE_SENTENCE_AND_WRITING,
};

const freezeWorkedExamples = (values = []) => freezeList(values.map((item) => freeze({ ...item })));
const freezeFaqs = (values = []) => freezeList(values.map((item) => freeze({ ...item })));

export const GRAMMAR_KNOWLEDGE_ENRICHMENT = freeze(
  Object.fromEntries(
    Object.entries(raw).map(([id, value]) => [
      id,
      freeze({
        sourceIds: freezeList(value.sourceIds),
        rulePoints: freezeList(value.rulePoints),
        workedExamples: freezeWorkedExamples(value.workedExamples),
        teachingNote: value.teachingNote,
        trickyCases: freezeList(value.trickyCases),
        faqs: freezeFaqs(value.faqs),
      }),
    ]),
  ),
);

export const GRAMMAR_KNOWLEDGE_ENRICHMENT_IDS = freezeList(Object.keys(GRAMMAR_KNOWLEDGE_ENRICHMENT));

export function getGrammarKnowledgeEnrichment(id) {
  return GRAMMAR_KNOWLEDGE_ENRICHMENT[id] || null;
}
