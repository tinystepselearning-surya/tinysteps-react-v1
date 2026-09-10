const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);
const item = (config) => freeze({ ...config });

export const SPEAKING_COMMUNICATION_COMPLETION_REVISION = '2026-09-10-sp6';

export const SPEAKING_COMMUNICATION_COMPLETION_BRICKS = freezeList([
  item({ id: 'SP0', label: 'Post-R22 gap audit', state: 'complete' }),
  item({ id: 'SP1', label: 'Conversation & response depth', state: 'complete' }),
  item({ id: 'SP2', label: 'Storytelling & organisation', state: 'complete' }),
  item({ id: 'SP3', label: 'Discussion, reasoning & opinions', state: 'complete' }),
  item({ id: 'SP4', label: 'Public speaking & delivery', state: 'complete' }),
  item({ id: 'SP5', label: 'Parent problem coverage + practice', state: 'complete' }),
  item({ id: 'SP6', label: 'Closure audit', state: 'frozen' }),
]);

/**
 * SP0 found five post-R22 gaps. None requires a new article URL. The remaining
 * work is owner registration, narrow refreshes, parent routing and practice
 * continuity. This keeps R20-R22 as the protected foundation.
 */
export const SPEAKING_COMMUNICATION_POST_R22_GAPS = freezeList([
  item({
    id: 'classroom-communication-semantic-integration',
    priority: 'high',
    action: 'register-existing-owner',
    ownerPath: '/blog/back-to-school-english-confidence-plan',
    rationale: 'The existing page already owns classroom participation routines; the gap is semantic registration, not missing content.',
  }),
  item({
    id: 'spoken-vocabulary-retrieval-transfer',
    priority: 'medium',
    action: 'refresh-existing-owner',
    ownerPath: '/blog/conversation-skills-for-kids',
    supportingPath: '/blog/child-gives-one-word-answers',
    rationale: 'Vocabulary retrieval is already diagnosed; conversation needs a practical retrieve-use-reuse bridge without a new vocabulary page.',
  }),
  item({
    id: 'oral-summarising',
    priority: 'medium-low',
    action: 'refresh-existing-owner',
    ownerPath: '/blog/how-to-teach-storytelling-to-kids',
    rationale: 'Retelling is strong; the existing owner only needs an explicit contrast between full retelling and concise oral summarising.',
  }),
  item({
    id: 'parent-problem-routing',
    priority: 'medium',
    action: 'connect-existing-owners',
    ownerPath: '/resources/speaking',
    rationale: 'The parent problems are already covered across established owners and need a deterministic routing layer rather than duplicate articles.',
  }),
  item({
    id: 'practice-continuity',
    priority: 'medium',
    action: 'connect-existing-practice',
    ownerPath: '/free-speaking-games-for-kids',
    rationale: 'Existing games, Story Cards, family practice, classroom routines and video feedback should be connected to the skill they practise.',
  }),
]);

export const SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS = freezeList([
  item({ id: 'response-initiation', domainId: 'response-initiation-independence', ownerPath: '/blog/child-understands-english-but-does-not-speak' }),
  item({ id: 'response-expansion', domainId: 'response-expansion-language', ownerPath: '/blog/child-gives-one-word-answers' }),
  item({ id: 'conversation', domainId: 'conversation-listening', ownerPath: '/blog/conversation-skills-for-kids' }),
  item({ id: 'spoken-vocabulary-transfer', domainId: 'response-expansion-language', ownerPath: '/blog/conversation-skills-for-kids', supportingPaths: freezeList(['/blog/child-gives-one-word-answers', '/blog/how-to-improve-sentence-formation-in-kids']) }),
  item({ id: 'confidence-context-transfer', domainId: 'confidence-context-transfer', ownerPath: '/blog/speaking-confidence-seeds' }),
  item({ id: 'classroom-communication', domainId: 'confidence-context-transfer', ownerPath: '/blog/back-to-school-english-confidence-plan' }),
  item({ id: 'storytelling-retelling', domainId: 'storytelling-retelling', ownerPath: '/blog/how-to-teach-storytelling-to-kids' }),
  item({ id: 'speech-organisation', domainId: 'speech-organisation', ownerPath: '/blog/speaking-structure' }),
  item({ id: 'discussion-reasoning', domainId: 'discussion-reasoning', ownerPath: '/blog/speaking-debate-starters' }),
  item({ id: 'delivery', domainId: 'delivery-audience-connection', ownerPath: '/blog/public-speaking-delivery-for-kids' }),
  item({ id: 'visual-aids', domainId: 'delivery-audience-connection', ownerPath: '/blog/speaking-visual-aids' }),
  item({ id: 'rehearsal-feedback', domainId: 'rehearsal-feedback-transfer', ownerPath: '/blog/speaking-video-feedback' }),
  item({ id: 'competition-preparation', domainId: 'rehearsal-feedback-transfer', ownerPath: '/blog/speaking-competition-prep' }),
  item({ id: 'familiar-audience-practice', domainId: 'rehearsal-feedback-transfer', ownerPath: '/blog/speaking-family-showcase' }),
  item({ id: 'story-card-practice', domainId: 'storytelling-retelling', ownerPath: '/blog/grammar-speaking-bridge' }),
]);

export const SPEAKING_COMMUNICATION_PARENT_PROBLEM_ROUTES = freezeList([
  item({ id: 'understands-but-does-not-speak', problem: 'Understands English but does not speak', ownerPath: '/blog/child-understands-english-but-does-not-speak', practicePath: '/blog/conversation-skills-for-kids' }),
  item({ id: 'one-word-answers', problem: 'Gives one-word answers', ownerPath: '/blog/child-gives-one-word-answers', practicePath: '/blog/conversation-skills-for-kids' }),
  item({ id: 'hesitates', problem: 'Hesitates or needs constant prompting', ownerPath: '/blog/child-understands-english-but-does-not-speak', practicePath: '/blog/back-to-school-english-confidence-plan' }),
  item({ id: 'cannot-explain-ideas', problem: 'Cannot explain ideas clearly', ownerPath: '/blog/how-to-improve-sentence-formation-in-kids', practicePath: '/blog/conversation-skills-for-kids' }),
  item({ id: 'cannot-tell-stories', problem: 'Cannot tell stories clearly', ownerPath: '/blog/how-to-teach-storytelling-to-kids', practicePath: '/blog/grammar-speaking-bridge' }),
  item({ id: 'vocabulary-disappears', problem: 'Vocabulary disappears while speaking', ownerPath: '/blog/conversation-skills-for-kids', practicePath: '/free-speaking-games-for-kids' }),
  item({ id: 'unfamiliar-people', problem: 'Struggles speaking to unfamiliar people', ownerPath: '/blog/speaking-confidence-seeds', practicePath: '/blog/speaking-family-showcase' }),
  item({ id: 'cannot-express-opinions', problem: 'Cannot express or support opinions', ownerPath: '/blog/speaking-debate-starters', practicePath: '/free-speaking-games-for-kids' }),
  item({ id: 'presentation-difficulty', problem: 'Has difficulty with presentations or show-and-tell', ownerPath: '/blog/speaking-structure', supportingPath: '/blog/public-speaking-delivery-for-kids', practicePath: '/blog/speaking-video-feedback' }),
]);

export const SPEAKING_COMMUNICATION_PRACTICE_ROUTES = freezeList([
  item({ domainId: 'response-initiation-independence', practicePath: '/blog/back-to-school-english-confidence-plan' }),
  item({ domainId: 'response-expansion-language', practicePath: '/free-speaking-games-for-kids' }),
  item({ domainId: 'confidence-context-transfer', practicePath: '/blog/speaking-family-showcase' }),
  item({ domainId: 'conversation-listening', practicePath: '/free-speaking-games-for-kids' }),
  item({ domainId: 'storytelling-retelling', practicePath: '/blog/grammar-speaking-bridge' }),
  item({ domainId: 'speech-organisation', practicePath: '/blog/speaking-video-feedback' }),
  item({ domainId: 'delivery-audience-connection', practicePath: '/blog/speaking-video-feedback' }),
  item({ domainId: 'discussion-reasoning', practicePath: '/free-speaking-games-for-kids' }),
  item({ domainId: 'rehearsal-feedback-transfer', practicePath: '/blog/speaking-family-showcase' }),
]);

export const SPEAKING_COMMUNICATION_FREEZE = freeze({
  state: 'frozen',
  revision: SPEAKING_COMMUNICATION_COMPLETION_REVISION,
  reason: 'All Tier-1 speaking clusters have an established owner, the remaining post-R22 gaps are closed without thin-page expansion, parent problems route to existing owners and practice, and R20-R22 ownership boundaries remain protected.',
  protectedCommercialOwner: '/speaking',
  protectedSubjectHub: '/resources/speaking',
  protectedSpokenEnglishCommercialOwner: '/spoken-english-classes-for-kids-online',
  contentExpansionAllowed: false,
});

for (const [label, values] of [
  ['brick id', SPEAKING_COMMUNICATION_COMPLETION_BRICKS.map((entry) => entry.id)],
  ['gap id', SPEAKING_COMMUNICATION_POST_R22_GAPS.map((entry) => entry.id)],
  ['cluster id', SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS.map((entry) => entry.id)],
  ['parent problem id', SPEAKING_COMMUNICATION_PARENT_PROBLEM_ROUTES.map((entry) => entry.id)],
]) {
  if (new Set(values).size !== values.length) throw new Error(`Speaking completion architecture contains duplicate ${label}.`);
}

if (SPEAKING_COMMUNICATION_POST_R22_GAPS.some((entry) => entry.action === 'create')) {
  throw new Error('Session C closure must not create a new page for any post-R22 gap.');
}
