import { SPEAKING_COMMUNICATION_CONTENT_AUDIT } from './speakingCommunicationKnowledgeArchitecture.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const SPEAKING_COMMUNICATION_CONTENT_EXECUTION_REVISION = '2026-09-10-r21';
export const SPEAKING_COMMUNICATION_CONTENT_EXECUTION_STATES = freezeList(['published']);

const plannedById = new Map(SPEAKING_COMMUNICATION_CONTENT_AUDIT.map((item) => [item.id, item]));

function publish(id, rationale) {
  const planned = plannedById.get(id);
  if (!planned) throw new Error(`R21 execution references unknown R20 decision: ${id}`);
  if (planned.action !== 'create') throw new Error(`R21 cannot publish non-CREATE decision ${id}.`);
  return freeze({
    id,
    state: 'published',
    domainId: planned.domainId,
    path: planned.proposedPath,
    priorAction: planned.action,
    rationale,
    contentRevision: SPEAKING_COMMUNICATION_CONTENT_EXECUTION_REVISION,
  });
}

export const SPEAKING_COMMUNICATION_CONTENT_EXECUTION = freezeList([
  publish('conversation-skills-parent-guide', 'Creates one substantial parent owner for two-way conversation: listening, turn-taking, staying on topic, follow-up questions and communication repair rather than fragmenting each subskill into a thin page.'),
  publish('storytelling-retelling-parent-guide', 'Creates the missing parent pathway for oral storytelling and retelling, with sequence, relevant detail, listener clarity and increasing independence while preserving the existing Story Cards activity as a supporting practice owner.'),
  publish('speaking-delivery-parent-guide', 'Creates one parent owner for intelligible delivery—pace, audible volume, pausing, emphasis and audience connection—without treating accent conformity, forced eye contact or theatrical performance as universal requirements.'),
]);

const byId = new Map(SPEAKING_COMMUNICATION_CONTENT_EXECUTION.map((item) => [item.id, item]));
const byPath = new Map(SPEAKING_COMMUNICATION_CONTENT_EXECUTION.map((item) => [item.path, item]));

export const getSpeakingCommunicationContentExecution = (id) => byId.get(String(id || '')) ?? null;
export const getSpeakingCommunicationContentExecutionByPath = (pathname) => byPath.get(String(pathname || '').split(/[?#]/, 1)[0].replace(/\/+$/, '')) ?? null;
export const getPublishedSpeakingCommunicationContentExecutions = () => freezeList(SPEAKING_COMMUNICATION_CONTENT_EXECUTION);
