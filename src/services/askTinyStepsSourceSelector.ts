import {
  ASK_TINY_STEPS_KNOWLEDGE_SOURCES,
  type AskTinyStepsAudience,
  type AskTinyStepsKnowledgeSource,
} from '../config/askTinyStepsKnowledgeSources';

export const ASK_TINY_STEPS_MAX_URL_CONTEXT_SOURCES = 3;

export type AskTinyStepsSelectionAudience = Extract<AskTinyStepsAudience, 'parents' | 'schools'>;
export type AskTinyStepsSelectionIntent =
  | 'assessment'
  | 'pricing'
  | 'courses'
  | 'phonics'
  | 'grammar'
  | 'speaking'
  | 'reading'
  | 'curriculum'
  | 'methodology'
  | 'school_program'
  | 'school_research'
  | 'testimonials'
  | 'class_samples'
  | 'contact'
  | 'summer_camp'
  | 'brand'
  | 'general';

export type AskTinyStepsSourceSelection = {
  audience: AskTinyStepsSelectionAudience;
  intent: AskTinyStepsSelectionIntent;
  sourceIds: string[];
  sources: AskTinyStepsKnowledgeSource[];
};

export type AskTinyStepsSourceSelectionOptions = {
  recentUserMessages?: readonly string[];
  currentPath?: string;
  maxSources?: number;
};

type IntentRule = {
  intent: AskTinyStepsSelectionIntent;
  pattern: RegExp;
};

const SCHOOL_CONTEXT_PATTERN =
  /\b(school|schools|cbse|ncf|principal|academic coordinator|school owner|campus|institution|institutional|teacher training|teachers training|scope and sequence|foundational literacy|fln|curriculum head|school partnership)\b/i;

const FOLLOW_UP_PATTERN =
  /^(what|how) about\b|^and\b|\b(this|that|it|those|same one|same thing)\b|\bhow much is it\b|\bhow long is it\b|\btell me more\b/i;

const INTENT_RULES: readonly IntentRule[] = [
  {
    intent: 'summer_camp',
    pattern: /\b(summer camp|summer camps|fast track|vacation course|holiday course)\b/i,
  },
  {
    intent: 'assessment',
    pattern: /\b(demo|assessment|free assessment|free demo|trial class|placement)\b/i,
  },
  {
    intent: 'pricing',
    pattern: /\b(price|prices|pricing|fee|fees|cost|package|packages|plan|plans|how much)\b/i,
  },
  {
    intent: 'class_samples',
    pattern: /\b(class sample|class samples|sample class|teaching sample|teaching example)\b/i,
  },
  {
    intent: 'testimonials',
    pattern: /\b(testimonial|testimonials|review|reviews|parent feedback)\b/i,
  },
  {
    intent: 'contact',
    pattern: /\b(contact|whatsapp|phone|call|advisor|support number|reach you)\b/i,
  },
  {
    intent: 'curriculum',
    pattern: /\b(curriculum|learning path|progression|syllabus)\b/i,
  },
  {
    intent: 'methodology',
    pattern: /\b(methodology|teaching method|how do you teach|how you teach|personalized|personalised)\b/i,
  },
  {
    intent: 'grammar',
    pattern: /\b(grammar|sentence formation|punctuation|writing skills|writing)\b/i,
  },
  {
    intent: 'speaking',
    pattern: /\b(public speaking|speaking confidence|communication|pronunciation|speaking skills)\b/i,
  },
  {
    intent: 'phonics',
    pattern: /\b(phonics|blending|decode|decoding|letter sounds?|cvc|digraph|phonemic awareness)\b/i,
  },
  {
    intent: 'reading',
    pattern: /\b(reading|read words|fluency|comprehension)\b/i,
  },
  {
    intent: 'courses',
    pattern: /\b(course|courses|program|programs|programme|programmes|track|tracks|classes do you offer|what do you teach)\b/i,
  },
  {
    intent: 'brand',
    pattern: /\b(what is tiny steps|who is tiny steps|tell me about tiny steps|why tiny steps)\b/i,
  },
] as const;

const STOP_WORDS = new Set([
  'a',
  'about',
  'am',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'can',
  'child',
  'do',
  'does',
  'for',
  'from',
  'how',
  'i',
  'in',
  'is',
  'it',
  'me',
  'my',
  'of',
  'on',
  'or',
  'our',
  'please',
  'tell',
  'that',
  'the',
  'their',
  'this',
  'to',
  'we',
  'what',
  'which',
  'with',
  'you',
  'your',
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function meaningfulTokens(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function detectAudience(text: string): AskTinyStepsSelectionAudience {
  return SCHOOL_CONTEXT_PATTERN.test(text) ? 'schools' : 'parents';
}

function detectIntent(text: string, audience: AskTinyStepsSelectionAudience): AskTinyStepsSelectionIntent {
  if (audience === 'schools') {
    if (/\b(cbse|ncf|foundational literacy|fln|scope and sequence|benchmark|research|systematic|cumulative|decoding|memorisation|teacher training)\b/i.test(text)) {
      return 'school_research';
    }
    if (/\b(school|schools|campus|institution|partnership|principal|school owner|curriculum head)\b/i.test(text)) {
      return 'school_program';
    }
  }

  return INTENT_RULES.find((rule) => rule.pattern.test(text))?.intent ?? 'general';
}

function directSourceIds(
  intent: AskTinyStepsSelectionIntent,
  audience: AskTinyStepsSelectionAudience,
  text: string,
): string[] {
  if (audience === 'schools') {
    if (/\b(scope and sequence)\b/i.test(text)) return ['school-scope-sequence', 'for-schools'];
    if (/\b(teacher training|teachers training)\b/i.test(text)) return ['teacher-training', 'for-schools'];
    if (/\b(benchmark|international)\b/i.test(text)) return ['international-benchmarks', 'for-schools'];
    if (/\b(memorisation|memorization|assess decoding|assessment)\b/i.test(text)) return ['assess-decoding', 'for-schools'];
    if (/\b(systematic|cumulative)\b/i.test(text)) return ['systematic-cumulative', 'for-schools'];
    if (/\b(cbse|ncf|foundational literacy|fln)\b/i.test(text)) return ['cbse-phonics-ncf', 'for-schools'];
    if (/\b(price|pricing|fee|fees|cost|package|packages|plan|plans|how much)\b/i.test(text)) return ['for-schools'];
    return ['for-schools'];
  }

  switch (intent) {
    case 'assessment':
      return ['book-demo', 'faq'];
    case 'pricing':
      return ['pricing', 'book-demo'];
    case 'courses':
      return ['courses', 'curriculum'];
    case 'phonics':
      if (/\b(letter sounds?|knows? sounds?|cannot read|can t read|cant read|blending)\b/i.test(text)) {
        return ['sounds-cannot-read', 'phonics', 'letter-sounds-not-enough'];
      }
      return ['phonics', 'courses'];
    case 'grammar':
      return ['grammar', 'courses'];
    case 'speaking':
      return ['speaking', 'courses'];
    case 'reading':
      if (/\b(fluency|slow reading|reads? slowly)\b/i.test(text)) {
        return ['reading-fluency-guide', 'reading-classes', 'phonics'];
      }
      if (/\b(cannot read|can t read|cant read|reading difficulty|not reading)\b/i.test(text)) {
        return ['child-not-reading', 'reading-classes', 'phonics'];
      }
      return ['reading-classes', 'phonics'];
    case 'curriculum':
      return ['curriculum', 'courses'];
    case 'methodology':
      return ['why-tiny-steps', 'class-samples'];
    case 'class_samples':
      return ['class-samples', 'why-tiny-steps'];
    case 'testimonials':
      return ['testimonials'];
    case 'contact':
      return ['contact'];
    case 'summer_camp':
      return ['summer-camps-2026'];
    case 'brand':
      return ['home', 'why-tiny-steps', 'courses'];
    default:
      return [];
  }
}

function sourceMatchesAudience(
  source: AskTinyStepsKnowledgeSource,
  audience: AskTinyStepsSelectionAudience,
): boolean {
  if (source.audience === 'both') return true;
  return source.audience === audience;
}

function scoreSource(source: AskTinyStepsKnowledgeSource, queryText: string): number {
  const query = normalize(queryText);
  if (!query) return 0;
  const queryTokens = new Set(meaningfulTokens(query));
  let relevance = 0;

  for (const canonical of source.canonicalFor ?? []) {
    const normalizedCanonical = normalize(canonical);
    if (normalizedCanonical && query.includes(normalizedCanonical)) relevance += 24;
    for (const token of meaningfulTokens(normalizedCanonical)) {
      if (queryTokens.has(token)) relevance += 4;
    }
  }

  for (const tag of source.tags) {
    const normalizedTag = normalize(tag);
    if (normalizedTag && query.includes(normalizedTag)) relevance += 12;
    for (const token of meaningfulTokens(normalizedTag)) {
      if (queryTokens.has(token)) relevance += 3;
    }
  }

  for (const token of meaningfulTokens(source.title)) {
    if (queryTokens.has(token)) relevance += 2;
  }

  for (const token of meaningfulTokens(source.path.replaceAll('/', ' '))) {
    if (queryTokens.has(token)) relevance += 2;
  }

  if (query.includes(normalize(source.category))) relevance += 5;
  if (relevance === 0) return 0;

  return relevance + (6 - source.priority);
}

function sourceById(id: string): AskTinyStepsKnowledgeSource | undefined {
  return ASK_TINY_STEPS_KNOWLEDGE_SOURCES.find((source) => source.id === id);
}

function normalizePath(path?: string): string {
  if (!path) return '';
  const withoutQuery = path.split(/[?#]/, 1)[0] || '/';
  if (withoutQuery === '/') return '/';
  return withoutQuery.replace(/\/+$/, '');
}

function isEligible(
  source: AskTinyStepsKnowledgeSource,
  audience: AskTinyStepsSelectionAudience,
  intent: AskTinyStepsSelectionIntent,
): boolean {
  if (!source.enabledForAI || source.retrievalPolicy === 'disabled') return false;
  if (!sourceMatchesAudience(source, audience)) return false;
  if (source.lifecycle === 'archived' && intent !== 'summer_camp') return false;
  return true;
}

export function selectAskTinyStepsSources(
  question: string,
  options: AskTinyStepsSourceSelectionOptions = {},
): AskTinyStepsSourceSelection {
  const currentQuestion = question.trim();
  const recentUserMessages = (options.recentUserMessages ?? [])
    .map((message) => message.trim())
    .filter(Boolean)
    .slice(-2);
  const isFollowUp = FOLLOW_UP_PATTERN.test(currentQuestion);
  const contextText = isFollowUp
    ? [...recentUserMessages, currentQuestion].join(' ')
    : currentQuestion;

  const audienceText = [recentUserMessages.at(-1), currentQuestion].filter(Boolean).join(' ');
  const audience = detectAudience(audienceText);
  const intent = detectIntent(contextText, audience);
  const maxSources = Math.min(
    ASK_TINY_STEPS_MAX_URL_CONTEXT_SOURCES,
    Math.max(1, options.maxSources ?? ASK_TINY_STEPS_MAX_URL_CONTEXT_SOURCES),
  );

  const selected: AskTinyStepsKnowledgeSource[] = [];
  const add = (source?: AskTinyStepsKnowledgeSource) => {
    if (!source || selected.some((candidate) => candidate.id === source.id)) return;
    if (!isEligible(source, audience, intent)) return;
    if (selected.length >= maxSources) return;
    selected.push(source);
  };

  directSourceIds(intent, audience, contextText).forEach((id) => add(sourceById(id)));

  const currentPath = normalizePath(options.currentPath);
  if (isFollowUp && currentPath) {
    const pageSource = ASK_TINY_STEPS_KNOWLEDGE_SOURCES.find(
      (source) => normalizePath(source.path) === currentPath,
    );
    add(pageSource);
  }

  if (selected.length < maxSources && intent !== 'general') {
    ASK_TINY_STEPS_KNOWLEDGE_SOURCES
      .filter((source) => isEligible(source, audience, intent))
      .map((source) => ({ source, score: scoreSource(source, contextText) }))
      .filter(({ source, score }) => {
        if (score <= 0) return false;
        if (source.retrievalPolicy === 'intent_only') return score >= 6;
        return true;
      })
      .sort((left, right) => right.score - left.score || left.source.priority - right.source.priority)
      .forEach(({ source }) => add(source));
  }

  // A deliberately unrelated/general question should not trigger arbitrary page retrieval.
  // This keeps URL Context focused, cheap, and resistant to user-supplied URL injection.
  return {
    audience,
    intent,
    sourceIds: selected.map((source) => source.id),
    sources: selected,
  };
}
