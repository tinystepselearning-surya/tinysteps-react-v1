import { READING_CONTENT_AUDIT } from './readingKnowledgeArchitecture.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const READING_CONTENT_EXECUTION_REVISION = '2026-09-09-r15';
export const READING_CONTENT_EXECUTION_STATES = freezeList(['published', 'already-satisfied']);

const plannedById = new Map(READING_CONTENT_AUDIT.map((item) => [item.id, item]));

function execute(id, state, config = {}) {
  const planned = plannedById.get(id);
  if (!planned) throw new Error(`R15 execution references unknown R14 decision: ${id}`);
  if (state === 'published' && planned.action !== 'create') throw new Error(`R15 cannot publish non-CREATE decision ${id}.`);
  if (state === 'already-satisfied' && planned.action !== 'refresh') throw new Error(`R15 cannot mark non-REFRESH decision ${id} already satisfied.`);
  return freeze({
    id,
    state,
    domainId: planned.domainId,
    path: state === 'published' ? planned.proposedPath : planned.path,
    priorAction: planned.action,
    rationale: config.rationale,
    contentRevision: config.contentRevision ?? null,
  });
}

export const READING_CONTENT_EXECUTION = freezeList([
  execute('phonological-phonemic-phonics-boundary', 'published', {
    rationale: 'Creates the missing parent-facing owner for the oral-sound hierarchy and the point where print enters, without fragmenting the topic into thin definition pages.',
    contentRevision: READING_CONTENT_EXECUTION_REVISION,
  }),
  execute('vocabulary-reading-connection', 'published', {
    rationale: 'Creates a reading-specific vocabulary owner focused on meaning during reading and comprehension, not a competing general vocabulary page.',
    contentRevision: READING_CONTENT_EXECUTION_REVISION,
  }),
  execute('automatic-word-recognition', 'published', {
    rationale: 'Creates the missing parent guide for the transition from effortful decoding to rapid familiar-word recognition while explicitly rejecting picture/shape guessing.',
    contentRevision: READING_CONTENT_EXECUTION_REVISION,
  }),
  execute('reading-fluency-guide', 'already-satisfied', {
    rationale: 'Inspection found the established fluency owner already distinguishes accuracy, automaticity/ease, phrasing/prosody and meaning; includes purposeful repeated-reading boundaries, transfer checks and evidence. Rewriting it would add churn rather than value.',
  }),
  execute('reading-comprehension-guide', 'already-satisfied', {
    rationale: 'Inspection found the established decoding-to-comprehension owner already separates word-reading, effort, vocabulary, sentence/idea integration and inference bottlenecks, including listening-versus-independent-reading checks. Rewriting it would duplicate existing value.',
  }),
]);

const byId = new Map(READING_CONTENT_EXECUTION.map((item) => [item.id, item]));
const byPath = new Map(READING_CONTENT_EXECUTION.map((item) => [item.path, item]));

export const getReadingContentExecution = (id) => byId.get(String(id || '')) ?? null;
export const getReadingContentExecutionByPath = (pathname) => byPath.get(String(pathname || '').split(/[?#]/, 1)[0].replace(/\/+$/, '')) ?? null;
export const getPublishedReadingContentExecutions = () => freezeList(READING_CONTENT_EXECUTION.filter((item) => item.state === 'published'));
