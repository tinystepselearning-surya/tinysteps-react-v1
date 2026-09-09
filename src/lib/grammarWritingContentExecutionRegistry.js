import { GRAMMAR_WRITING_CONTENT_AUDIT } from './grammarWritingKnowledgeArchitecture.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const GRAMMAR_WRITING_CONTENT_EXECUTION_REVISION = '2026-09-09-r18';
export const GRAMMAR_WRITING_CONTENT_EXECUTION_STATES = freezeList(['published']);

const plannedById = new Map(GRAMMAR_WRITING_CONTENT_AUDIT.map((item) => [item.id, item]));

function publish(id, rationale) {
  const planned = plannedById.get(id);
  if (!planned) throw new Error(`R18 execution references unknown R17 decision: ${id}`);
  if (planned.action !== 'create') throw new Error(`R18 cannot publish non-CREATE decision ${id}.`);
  return freeze({
    id,
    state: 'published',
    domainId: planned.domainId,
    path: planned.proposedPath,
    priorAction: planned.action,
    rationale,
    contentRevision: GRAMMAR_WRITING_CONTENT_EXECUTION_REVISION,
  });
}

export const GRAMMAR_WRITING_CONTENT_EXECUTION = freezeList([
  publish('punctuation-capitalisation-parent-guide', 'Creates one substantial parent owner for sentence boundaries, capitals and beginner punctuation choices instead of fragmenting the topic into thin pages for individual marks.'),
  publish('paragraph-writing-parent-guide', 'Creates the missing parent owner for the transition from complete sentences to one coherent paragraph, with focus, relevant detail, order, cohesion and revision rather than a fixed sentence-count formula.'),
]);

const byId = new Map(GRAMMAR_WRITING_CONTENT_EXECUTION.map((item) => [item.id, item]));
const byPath = new Map(GRAMMAR_WRITING_CONTENT_EXECUTION.map((item) => [item.path, item]));

export const getGrammarWritingContentExecution = (id) => byId.get(String(id || '')) ?? null;
export const getGrammarWritingContentExecutionByPath = (pathname) => byPath.get(String(pathname || '').split(/[?#]/, 1)[0].replace(/\/+$/, '')) ?? null;
export const getPublishedGrammarWritingContentExecutions = () => freezeList(GRAMMAR_WRITING_CONTENT_EXECUTION);
