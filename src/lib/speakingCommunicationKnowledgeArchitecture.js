const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);
const domain = (id, order, label, summary, adjacentDomainIds = []) => freeze({
  id,
  order,
  label,
  summary,
  adjacentDomainIds: freezeList(adjacentDomainIds),
});
const auditRecord = (config) => freeze({
  canonicalTopicId: null,
  path: null,
  proposedPath: null,
  consolidationTarget: null,
  implementationState: config.action === 'create' ? 'proposal-only' : config.action === 'consolidate' ? 'hold' : 'established',
  publicationApproved: false,
  urlChangeAuthorized: false,
  reasons: freezeList(config.reasons),
  ...config,
});

export const SPEAKING_COMMUNICATION_KNOWLEDGE_REVISION = '2026-09-09-r20';
export const SPEAKING_COMMUNICATION_CONTENT_ACTIONS = Object.freeze(['keep', 'refresh', 'consolidate', 'create']);

/**
 * R20 is a communication knowledge map, not a claim that confident speaking
 * develops through one rigid ladder. Children may have different profiles for
 * language formulation, confidence, conversation, narrative, presentation and
 * audience demands, and multilingual performance can differ by setting/topic.
 */
export const SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS = freezeList([
  domain('response-initiation-independence', 1, 'Response initiation & independence', 'How children move from understanding an idea or question into starting and completing an independent spoken response, including planning time, word retrieval, sentence formulation and prompt fading.', ['response-expansion-language', 'confidence-context-transfer']),
  domain('response-expansion-language', 2, 'Response expansion & spoken language', 'How brief answers grow into complete messages with relevant detail, reasons, examples and sequences while vocabulary and sentence structure serve communication rather than answer length for its own sake.', ['response-initiation-independence', 'conversation-listening', 'storytelling-retelling']),
  domain('confidence-context-transfer', 3, 'Confidence, participation & context transfer', 'How speaking changes across familiar listeners, groups, classrooms and performance settings, with confidence measured through increasing independence and participation rather than loudness, extroversion or forced eye contact.', ['response-initiation-independence', 'delivery-audience-connection', 'rehearsal-feedback-transfer']),
  domain('conversation-listening', 4, 'Conversation, listening & turn-taking', 'How children start and sustain two-way interaction by listening to the other speaker, taking turns, staying on topic, asking follow-up questions, clarifying misunderstandings and repairing communication when needed.', ['response-expansion-language', 'discussion-reasoning', 'confidence-context-transfer']),
  domain('storytelling-retelling', 5, 'Storytelling & retelling', 'How children organise an oral narrative around a clear situation, meaningful sequence, relevant details and an ending, and how retelling a known event differs from inventing a new story.', ['response-expansion-language', 'speech-organisation', 'rehearsal-feedback-transfer']),
  domain('speech-organisation', 6, 'Speech & presentation organisation', 'How children plan a short talk around purpose, opening, a small number of useful points, transitions and a conclusion without memorising a rigid script or overloading the message.', ['storytelling-retelling', 'delivery-audience-connection', 'discussion-reasoning']),
  domain('delivery-audience-connection', 7, 'Delivery & audience connection', 'How pace, audible volume, pausing, emphasis, intelligibility, posture, visuals and audience awareness support meaning without treating accent conformity, constant eye contact or theatrical performance as the definition of good speaking.', ['speech-organisation', 'confidence-context-transfer', 'rehearsal-feedback-transfer']),
  domain('discussion-reasoning', 8, 'Discussion, opinions & reasoning', 'How children state a position, give reasons and examples, listen to another perspective, ask or answer questions and respond respectfully rather than treating debate as simply speaking longer or winning.', ['conversation-listening', 'speech-organisation', 'rehearsal-feedback-transfer']),
  domain('rehearsal-feedback-transfer', 9, 'Rehearsal, feedback & transfer', 'How children use focused feedback, optional recording, retries, self-reflection and changing audiences/topics to improve one observable speaking target and transfer it beyond a practised script.', ['delivery-audience-connection', 'confidence-context-transfer', 'storytelling-retelling', 'discussion-reasoning']),
]);

/**
 * High-value speaking/communication audit. Existing substantial pages stay in
 * place. CREATE is limited to missing parent utilities; the older hidden
 * confidence article is marked for controlled consolidation rather than being
 * promoted as a second authority owner.
 */
export const SPEAKING_COMMUNICATION_CONTENT_AUDIT = freezeList([
  auditRecord({
    id: 'speaking-confidence-roadmap',
    domainId: 'confidence-context-transfer',
    action: 'keep',
    path: '/blog/speaking-confidence-seeds',
    canonicalTopicId: 'speaking-confidence-progression',
    reasons: ['Established broad parent roadmap for confidence, response expansion, voice, audience practice and transfer.', 'Explicitly avoids equating confidence with loudness, extroversion, perfect grammar or one-week transformation.'],
  }),
  auditRecord({
    id: 'one-word-answer-diagnostic',
    domainId: 'response-expansion-language',
    action: 'keep',
    path: '/blog/child-gives-one-word-answers',
    canonicalTopicId: 'one-word-answers',
    reasons: ['Established diagnostic owner when the child answers independently but responses remain too brief.', 'Separates question design, wait time, vocabulary retrieval, formulation, confidence and multilingual load before choosing a response-expansion strategy.'],
  }),
  auditRecord({
    id: 'understands-but-does-not-speak-diagnostic',
    domainId: 'response-initiation-independence',
    action: 'keep',
    path: '/blog/child-understands-english-but-does-not-speak',
    canonicalTopicId: 'understands-english-does-not-speak',
    reasons: ['Established owner for the comprehension-versus-independent-speaking bottleneck.', 'Uses modelled, prompted and independent response checks plus setting/language comparisons rather than assuming silence is simply shyness.'],
  }),
  auditRecord({
    id: 'speech-structure-guide',
    domainId: 'speech-organisation',
    action: 'keep',
    path: '/blog/speaking-structure',
    reasons: ['Existing substantial guide owns purpose, hook, body points, conclusion, rehearsal and adaptation for short planned speeches.', 'A second generic presentation-structure article would duplicate a clear established owner.'],
  }),
  auditRecord({
    id: 'visual-aids-guide',
    domainId: 'delivery-audience-connection',
    action: 'keep',
    path: '/blog/speaking-visual-aids',
    reasons: ['Existing guide owns audience-facing pictures, props, charts and slides as supports for meaning.', 'It clearly distinguishes visuals from cue cards and keeps the speaker/message primary.'],
  }),
  auditRecord({
    id: 'debate-guide',
    domainId: 'discussion-reasoning',
    action: 'keep',
    path: '/blog/speaking-debate-starters',
    reasons: ['Existing parent guide covers position, reason, example, listening, response and reflection.', 'It treats debate as reciprocal reasoning rather than a list of topics or a confidence guarantee.'],
  }),
  auditRecord({
    id: 'video-feedback-guide',
    domainId: 'rehearsal-feedback-transfer',
    action: 'keep',
    path: '/blog/speaking-video-feedback',
    reasons: ['Existing guide owns the record-notice-target-retry-compare-transfer feedback cycle.', 'It correctly treats video as optional and focused feedback—not as a treatment for shyness or a requirement for every child.'],
  }),
  auditRecord({
    id: 'competition-preparation-guide',
    domainId: 'rehearsal-feedback-transfer',
    action: 'keep',
    path: '/blog/speaking-competition-prep',
    reasons: ['Existing resource owns competition-specific preparation, rehearsal and readiness rather than generic speaking development.', 'Keeps event preparation separate from speech construction and broad confidence.'],
  }),
  auditRecord({
    id: 'family-showcase-practice',
    domainId: 'confidence-context-transfer',
    action: 'keep',
    path: '/blog/speaking-family-showcase',
    reasons: ['Existing home-practice resource gives children a low-stakes audience and structured speaking opportunities.', 'Useful as a practice context without becoming the canonical owner for confidence, storytelling or presentations.'],
  }),
  auditRecord({
    id: 'story-card-speaking-bridge',
    domainId: 'storytelling-retelling',
    action: 'keep',
    path: '/blog/grammar-speaking-bridge',
    reasons: ['Existing cross-domain Story Cards activity supports oral sentence rehearsal, sequencing and storytelling practice.', 'Keep it as a useful activity bridge, but it does not fully own the parent intent for teaching oral storytelling and retelling.'],
  }),
  auditRecord({
    id: 'legacy-hidden-confidence-article',
    domainId: 'confidence-context-transfer',
    action: 'consolidate',
    path: '/blog/spoken-english-classes-for-kids-confidence',
    consolidationTarget: '/blog/speaking-confidence-seeds',
    reasons: ['Older hidden short article substantially overlaps the stronger speaking-confidence roadmap and understanding-versus-speaking diagnostic.', 'Do not promote it as a second authority owner; any redirect or removal should happen only in a controlled downstream consolidation step after checking URL/search history.'],
  }),
  auditRecord({
    id: 'conversation-skills-parent-guide',
    domainId: 'conversation-listening',
    action: 'create',
    proposedPath: '/blog/conversation-skills-for-kids',
    reasons: ['The library has strong one-way response, confidence and debate resources but no clear parent owner for ordinary two-way conversation skills.', 'One useful guide should combine listening, turn-taking, staying on topic, follow-up questions and communication repair instead of creating thin pages for each subskill.'],
  }),
  auditRecord({
    id: 'storytelling-retelling-parent-guide',
    domainId: 'storytelling-retelling',
    action: 'create',
    proposedPath: '/blog/how-to-teach-storytelling-to-kids',
    reasons: ['Story cards and speech-structure resources support nearby skills, but no page owns oral storytelling/retelling as a parent teaching pathway.', 'A future guide should distinguish retelling known events from inventing stories and focus on sequence, relevant detail, listener clarity and increasing independence.'],
  }),
  auditRecord({
    id: 'speaking-delivery-parent-guide',
    domainId: 'delivery-audience-connection',
    action: 'create',
    proposedPath: '/blog/public-speaking-delivery-for-kids',
    reasons: ['Pace, volume, pausing and audience connection appear across confidence, feedback and competition pages but lack one clear parent-facing owner.', 'The guide should focus on intelligibility and meaning, avoid accent-correction promises, and avoid presenting constant eye contact or theatrical delivery as universal requirements.'],
  }),
]);

const domainsById = new Map(SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS.map((item) => [item.id, item]));
const auditsById = new Map(SPEAKING_COMMUNICATION_CONTENT_AUDIT.map((item) => [item.id, item]));

export const getSpeakingCommunicationKnowledgeDomain = (id) => domainsById.get(String(id || '')) ?? null;
export const getSpeakingCommunicationContentAuditRecord = (id) => auditsById.get(String(id || '')) ?? null;
export const getSpeakingCommunicationContentAuditForDomain = (domainId) => freezeList(SPEAKING_COMMUNICATION_CONTENT_AUDIT.filter((item) => item.domainId === String(domainId || '')));
export const getSpeakingCommunicationContentAuditByAction = (action) => freezeList(SPEAKING_COMMUNICATION_CONTENT_AUDIT.filter((item) => item.action === String(action || '')));

if (domainsById.size !== SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS.length) throw new Error('R20 contains duplicate speaking domain IDs.');
if (auditsById.size !== SPEAKING_COMMUNICATION_CONTENT_AUDIT.length) throw new Error('R20 contains duplicate content-audit IDs.');
for (const item of SPEAKING_COMMUNICATION_CONTENT_AUDIT) {
  if (!domainsById.has(item.domainId)) throw new Error(`R20 audit record has an unknown domain: ${item.id}.`);
  if (!SPEAKING_COMMUNICATION_CONTENT_ACTIONS.includes(item.action)) throw new Error(`R20 audit record has an invalid action: ${item.id}.`);
  if (item.action === 'create' && (item.path || item.canonicalTopicId || item.publicationApproved || item.implementationState !== 'proposal-only')) {
    throw new Error(`R20 CREATE proposal crossed the publication boundary: ${item.id}.`);
  }
  if (item.action === 'consolidate' && (item.urlChangeAuthorized || item.implementationState !== 'hold')) {
    throw new Error(`R20 consolidation candidate must remain on hold: ${item.id}.`);
  }
}
