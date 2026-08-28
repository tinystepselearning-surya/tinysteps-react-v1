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
  | 'timings'
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
  /\b(cbse|ncf|principal|academic coordinator|academic dean|school owner|curriculum head|campus|institution|institutional|teacher training|teachers training|train our teachers|train teachers|teacher workshop|scope and sequence|foundational literacy|fln|school partnership|school programme|school program|school implementation|school proposal|school pilot|preschool|pre-school|kindergarten|schools)\b|\b(?:our|my|a|the) school\b|\bwe are (?:a |an )?(?:cbse )?(?:school|preschool|pre-school|kindergarten)\b/i;

const PARENT_CONTEXT_PATTERN =
  /\b(my child|for my child|my son|my daughter|our child|our son|our daughter|my kid|our kid|as a parent|at home)\b/i;

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
    intent: 'timings',
    pattern: /\b(minute|minutes|duration|class length|time per class|how long(?: is| are)? (?:a |the )?class|how long is it)\b/i,
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

function hasSchoolContext(text: string): boolean {
  return SCHOOL_CONTEXT_PATTERN.test(text);
}

function hasParentContext(text: string): boolean {
  return PARENT_CONTEXT_PATTERN.test(text);
}

function detectIntent(text: string, audience: AskTinyStepsSelectionAudience): AskTinyStepsSelectionIntent {
  if (audience === 'schools') {
    if (/\b(cbse|ncf|foundational literacy|fln|scope and sequence|benchmark|research|systematic|cumulative|decoding|memorisation|teacher training|teacher workshop)\b/i.test(text)) {
      return 'school_research';
    }
    if (/\b(school|schools|preschool|pre-school|kindergarten|campus|institution|partnership|principal|school owner|curriculum head)\b/i.test(text)) {
      return 'school_program';
    }
  }

  return INTENT_RULES.find((rule) => rule.pattern.test(text))?.intent ?? 'general';
}

function directSourceIds(
  intent: AskTinyStepsSelectionIntent,
  audience: AskTinyStepsSelectionAudience,
  contextText: string,
  currentQuestion: string,
): string[] {
  if (audience === 'schools') {
    if (/\b(price|pricing|fee|fees|cost|package|packages|plan|plans|how much)\b/i.test(currentQuestion)) {
      return ['for-schools'];
    }
    if (/\b(scope and sequence)\b/i.test(contextText)) return ['school-scope-sequence', 'for-schools'];
    if (/\b(teacher training|teachers training|train our teachers|train teachers|teacher workshop)\b/i.test(contextText)) {
      return ['teacher-training', 'for-schools'];
    }
    if (/\b(benchmark|international)\b/i.test(contextText)) return ['international-benchmarks', 'for-schools'];
    if (/\b(memorisation|memorization|assess decoding|assessment)\b/i.test(contextText)) return ['assess-decoding', 'for-schools'];
    if (/\b(systematic|cumulative)\b/i.test(contextText)) return ['systematic-cumulative', 'for-schools'];
    if (/\b(cbse|ncf|foundational literacy|fln)\b/i.test(contextText)) return ['cbse-phonics-ncf', 'for-schools'];
    return ['for-schools'];
  }

  switch (intent) {
    case 'assessment':
      return ['book-demo', 'faq'];
    case 'pricing':
      return ['pricing', 'book-demo'];
    case 'timings':
      return ['book-demo', 'faq'];
    case 'courses':
      return ['courses', 'curriculum'];
    case 'phonics':
      if (/\b(letter sounds?|knows? sounds?|cannot read|can t read|cant read|blending)\b/i.test(contextText)) {
        return ['sounds-cannot-read', 'phonics', 'letter-sounds-not-enough'];
      }
      return ['phonics', 'courses'];
    case 'grammar':
      return ['grammar', 'courses'];
    case 'speaking':
      return ['speaking', 'courses'];
    case 'reading':
      if (/\b(fluency|slow reading|reads? slowly)\b/i.test(contextText)) {
        return ['reading-fluency-guide', 'reading-classes', 'phonics'];
      }
      if (/\b(cannot read|can t read|cant read|reading difficulty|not reading)\b/i.test(contextText)) {
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

  const currentPath = normalizePath(options.currentPath);
  const currentPageSource = currentPath
    ? ASK_TINY_STEPS_KNOWLEDGE_SOURCES.find(
        (source) => normalizePath(source.path) === currentPath,
      )
    : undefined;
  const lastUserMessage = recentUserMessages.at(-1) ?? '';

  const audience: AskTinyStepsSelectionAudience = hasParentContext(currentQuestion)
    ? 'parents'
    : hasSchoolContext(currentQuestion)
      ? 'schools'
      : currentPageSource?.audience === 'schools'
        ? 'schools'
        : isFollowUp && hasSchoolContext(lastUserMessage)
          ? 'schools'
          : 'parents';

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

  directSourceIds(intent, audience, contextText, currentQuestion).forEach((id) => add(sourceById(id)));

  // Current-page context is useful for a vague "tell me more" continuation, but
  // must not make an unrelated standalone question consume URL Context tokens.
  if (currentPageSource && isFollowUp) {
    add(currentPageSource);
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

  return {
    audience,
    intent,
    sourceIds: selected.map((source) => source.id),
    sources: selected,
  };
}
