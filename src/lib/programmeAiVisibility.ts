import { ASK_TINY_STEPS_KNOWLEDGE_SOURCES } from '../config/askTinyStepsKnowledgeSources';
import { COMMERCIAL_C2_OWNERSHIP_CLUSTERS } from './commercialC2KeywordOwnership';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const PROGRAMME_AI_VISIBILITY_REVISION = '2026-09-27-programme-ai-v1';

export type ProgrammeAiHandoff = {
  readonly path: string;
  readonly label: string;
  readonly when: string;
};

export type ProgrammeAiVisibility = {
  readonly path: '/reading-classes-for-kids' | '/grammar' | '/speaking';
  readonly ownerLabel: string;
  readonly ownerIntent: string;
  readonly useFor: readonly string[];
  readonly doNotOwn: readonly string[];
  readonly handoffs: readonly Readonly<ProgrammeAiHandoff>[];
};

export const PROGRAMME_AI_VISIBILITY = freezeList<Readonly<ProgrammeAiVisibility>>([
  freeze({
    path: '/reading-classes-for-kids',
    ownerLabel: 'Reading Classes',
    ownerIntent:
      'connected-text reading support: accurate reading, fluency, phrasing, vocabulary, comprehension, retelling and reading confidence',
    useFor: freezeList([
      'connected-text reading remains slow, hesitant or effortful',
      'the child reads words but struggles with phrasing, vocabulary or meaning',
      'the main need is comprehension, retelling, inference or reading confidence',
    ]),
    doNotOwn: freezeList([
      'phonics, blending or unfamiliar-word decoding',
      'a dedicated fluency-only intervention when word reading is already accurate',
    ]),
    handoffs: freezeList([
      freeze({
        path: '/phonics',
        label: 'Phonics',
        when: 'unfamiliar-word decoding, sound–spelling knowledge or blending is not secure',
      }),
      freeze({
        path: '/reading-fluency-program',
        label: 'Reading Fluency',
        when: 'word reading is reasonably accurate but connected reading remains slow or choppy',
      }),
    ]),
  }),
  freeze({
    path: '/grammar',
    ownerLabel: 'Grammar Classes',
    ownerIntent:
      'grammar mechanics and sentence control: sentence formation, parts of speech, tenses, punctuation, correction and grammar accuracy in short spoken or written responses',
    useFor: freezeList([
      'the child knows rules but does not apply them accurately',
      'sentence structure, tense control or punctuation is the main gap',
      'short school answers need clearer grammar and sentence accuracy',
    ]),
    doNotOwn: freezeList([
      'paragraph development, creative writing or composition',
      'everyday conversational fluency as the primary need',
    ]),
    handoffs: freezeList([
      freeze({
        path: '/writing-classes-for-kids',
        label: 'Writing',
        when: 'idea development, paragraphs, stories, editing or longer written composition is the main need',
      }),
      freeze({
        path: '/spoken-english-classes-for-kids-online',
        label: 'Spoken English',
        when: 'everyday conversational fluency and fuller spontaneous responses are the main need',
      }),
    ]),
  }),
  freeze({
    path: '/speaking',
    ownerLabel: 'Public Speaking & Communication',
    ownerIntent:
      'public speaking and structured communication: organised answers, storytelling, show-and-tell, presentations, audience awareness and communication skills',
    useFor: freezeList([
      'the child needs help organising spoken ideas and structured answers',
      'storytelling, show-and-tell or presentation skills are the main goal',
      'the child needs audience-facing communication practice',
    ]),
    doNotOwn: freezeList([
      'everyday conversational fluency as the primary need',
      'confidence-only support when language and speaking structure are otherwise adequate',
      'grammar accuracy or sentence control as the primary barrier',
    ]),
    handoffs: freezeList([
      freeze({
        path: '/spoken-english-classes-for-kids-online',
        label: 'Spoken English',
        when: 'everyday conversation, fuller responses or conversational fluency is the main goal',
      }),
      freeze({
        path: '/confidence-building-program-kids',
        label: 'Confidence Building',
        when: 'participation comfort, hesitation or confidence is the primary barrier',
      }),
      freeze({
        path: '/grammar',
        label: 'Grammar',
        when: 'sentence accuracy, tense control or grammar use is the primary barrier',
      }),
    ]),
  }),
]);

export const PROGRAMME_AI_DISCOVERY_SURFACES = freezeList([
  '/llms.txt',
  '/llms-full.txt',
  '/robots.txt',
  '/rss.xml',
  '/feed.xml',
]);

export const PROGRAMME_AI_ENGINE_POLICY = freeze({
  searchOwnersStayCanonical: true,
  newAiPromptPagesAllowed: false,
  newEngineSpecificPagesAllowed: false,
  faqRichResultExpectation: false,
  phonicsProtectedFromReadingExpansion: true,
  rule:
    'Improve answer extraction and entity clarity on existing canonical owners. Do not create ChatGPT/Gemini/Perplexity-specific landing pages and do not broaden Reading into phonics/decoding ownership.',
});

const byPath = new Map(PROGRAMME_AI_VISIBILITY.map((item) => [item.path, item]));

export function getProgrammeAiVisibility(path: ProgrammeAiVisibility['path']) {
  return byPath.get(path) ?? null;
}

const c2Owners = new Set(COMMERCIAL_C2_OWNERSHIP_CLUSTERS.map((item) => item.canonicalOwnerPath));
for (const item of PROGRAMME_AI_VISIBILITY) {
  if (!c2Owners.has(item.path)) {
    throw new Error(`Programme AI visibility path ${item.path} must remain a frozen C2 commercial owner.`);
  }
}

const phonicsOwner = COMMERCIAL_C2_OWNERSHIP_CLUSTERS.find(
  (item) => item.id === 'phonics-provider' && item.canonicalOwnerPath === '/phonics',
);
if (!phonicsOwner || phonicsOwner.priority !== 'P1') {
  throw new Error('Programme AI visibility requires /phonics to remain the protected P1 phonics owner.');
}

const aiSources = new Map(ASK_TINY_STEPS_KNOWLEDGE_SOURCES.map((item) => [item.path, item]));
for (const item of PROGRAMME_AI_VISIBILITY) {
  const source = aiSources.get(item.path);
  if (!source?.enabledForAI || source.retrievalPolicy !== 'always') {
    throw new Error(`Programme AI visibility requires ${item.path} to remain an always-on Ask Tiny Steps source.`);
  }
}

if (PROGRAMME_AI_VISIBILITY.some((item) => String(item.path) === '/phonics')) {
  throw new Error('Reading/Grammar/Speaking growth must not redefine the protected /phonics owner.');
}
