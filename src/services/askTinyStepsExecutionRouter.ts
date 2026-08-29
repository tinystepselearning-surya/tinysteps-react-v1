import {
  ASK_TINY_STEPS_KNOWLEDGE_SOURCES,
  type AskTinyStepsKnowledgeSource,
} from '../config/askTinyStepsKnowledgeSources';
import {
  FREE_DEMO_DURATION_MINUTES,
  FREE_DEMO_FULL_DESCRIPTION,
  FREE_DEMO_OFFER_NAME,
  FREE_DEMO_PRICE,
  STANDARD_SMALL_GROUP_MAX_PER_CLASS,
  STANDARD_SMALL_GROUP_MIN_PER_CLASS,
} from '../config/publicOffer';
import {
  GROUP_MONTHLY_FEES,
  ONE_TO_ONE_MONTHLY_PACKAGES,
  PER_CLASS_PRICE,
  formatINR,
} from '../config/pricing';
import { PUBLIC_SITE_FACTS } from '../config/publicFacts';
import {
  isAskTinyStepsAgeRangeQuestion,
  isAskTinyStepsContextualFollowUp,
  isAskTinyStepsDurationQuestion,
  isAskTinyStepsProgrammeFactQuestion,
  selectAskTinyStepsSources,
  type AskTinyStepsSelectionAudience,
  type AskTinyStepsSelectionIntent,
} from './askTinyStepsSourceSelector';

export const ASK_TINY_STEPS_EXTERNAL_RESEARCH_ENABLED = false;

export type AskTinyStepsExecutionMode =
  | 'deterministic'
  | 'first_party_grounded'
  | 'general_guidance'
  | 'external_research_disabled';

export type AskTinyStepsExecutionPlan = {
  mode: AskTinyStepsExecutionMode;
  audience: AskTinyStepsSelectionAudience;
  intent: AskTinyStepsSelectionIntent;
  sourceIds: string[];
  isFollowUp: boolean;
  deterministicAnswer?: string;
  reason:
    | 'verified_fact'
    | 'private_account_boundary'
    | 'visitor_url_boundary'
    | 'out_of_scope_boundary'
    | 'external_research_not_enabled'
    | 'first_party_source_required'
    | 'general_learning_guidance';
};

export type AskTinyStepsExecutionOptions = {
  recentUserMessages?: readonly string[];
  currentPath?: string;
};

const VISITOR_URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>()]+/i;
const GREETING_PATTERN =
  /^(hi|hello|hey|hii+|heyy+|hola|namaste|good morning|good afternoon|good evening)[!.\s]*$/i;
const PRIVATE_ACCOUNT_PATTERN =
  /\b(my|our) (child|son|daughter|kid)(?:'s)?\b.*\b(attendance|progress|record|records|teacher|session|sessions|lesson|lessons|payment|payments|invoice|invoices|enrolment|enrollment)\b|\b(my|our)\b.*\b(attendance|progress records?|class records?|session records?)\b/i;
const EXTERNAL_RESEARCH_PATTERN =
  /\b(search (?:the )?web|google search|external sources?|outside sources?|latest research|current research|recent research|latest studies|current studies|latest evidence|current evidence|latest cbse|current cbse|latest ncf|current ncf|latest government|current government|latest guideline|current guideline|latest circular)\b/i;
const ENGLISH_LEARNING_PATTERN =
  /\b(phonics|letter sounds?|blending|decode|decoding|cvc|digraph|reading|reads?|fluency|comprehension|grammar|sentence|sentences|writing|public speaking|speaking|pronunciation|communication|vocabulary|spell|spelling|english learning|english skills?)\b/i;
const OBVIOUS_OUT_OF_SCOPE_PATTERN =
  /\b(weather|temperature|forecast|cricket|football|stock market|share price|recipe|bitcoin|cryptocurrency|election|politics|horoscope|movie review|flight status)\b/i;
const SLOT_OR_SCHEDULE_PATTERN =
  /\b(slot|slots|schedule|scheduling|weekend|weekday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|time zone|timezone|available time|available timings?|teacher availability)\b/i;
const PRICING_PATTERN =
  /\b(price|prices|pricing|fee|fees|cost|package|packages|plan|plans|how much)\b/i;

function sourceById(id: string): AskTinyStepsKnowledgeSource | undefined {
  return ASK_TINY_STEPS_KNOWLEDGE_SOURCES.find((source) => source.id === id);
}

function sourceUrl(id: string): string | undefined {
  return sourceById(id)?.canonicalUrl;
}

function withSource(answer: string, sourceId: string): string {
  const url = sourceUrl(sourceId);
  return url ? `${answer}\n\nSource: ${url}` : answer;
}

function greetingAnswer(): string {
  return (
    'Hi! 👋 I’m Ask TinySteps. You can ask about courses, pricing, the free demo, class formats, ' +
    'school programmes, or a child’s English-learning difficulty.'
  );
}

function parentPricingAnswer(): string {
  const starter = ONE_TO_ONE_MONTHLY_PACKAGES[0];
  return withSource(
    `Standard live 1:1 classes are ${formatINR(PER_CLASS_PRICE)} per class. ` +
      `The ${starter.classes}-class starter plan is ${formatINR(starter.monthlyFee)}. ` +
      `Small-group classes currently work out to about ${formatINR(STANDARD_SMALL_GROUP_MIN_PER_CLASS)}–${formatINR(STANDARD_SMALL_GROUP_MAX_PER_CLASS)} per child per class, depending on group size.`,
    'pricing',
  );
}

function schoolPricingAnswer(): string {
  const school = PUBLIC_SITE_FACTS.schoolPartnership;
  return withSource(
    `Current school partnership reference pricing is ${formatINR(school.focusedLaunchInr)} for Focused Launch, ` +
      `${formatINR(school.wholeSchoolInr)} for Whole-School, and ${formatINR(school.multiCampusInr)} for Multi-Campus. ` +
      `The ${school.pilotDurationWeeks}-week pilot is ${formatINR(school.pilotInr)}. GST is extra.`,
    'for-schools',
  );
}

function assessmentAnswer(): string {
  return withSource(
    `${FREE_DEMO_OFFER_NAME} is free (₹${FREE_DEMO_PRICE}) and lasts ${FREE_DEMO_DURATION_MINUTES} minutes. ` +
      FREE_DEMO_FULL_DESCRIPTION,
    'book-demo',
  );
}

function classModeAnswer(): string {
  const smallGroupRatios = GROUP_MONTHLY_FEES.filter((row) => row.ratio !== '1:1').map(
    (row) => row.ratio,
  );
  return withSource(
    `Yes. Tiny Steps offers live 1:1 online classes. Small-group formats are also available (${smallGroupRatios.join(', ')}), subject to suitable level-matched placement.`,
    'pricing',
  );
}

function durationAnswer(question: string): string {
  if (/\bdemo|assessment|trial\b/i.test(question)) {
    return withSource(
      `The free 1:1 demo assessment lasts ${FREE_DEMO_DURATION_MINUTES} minutes.`,
      'book-demo',
    );
  }

  const oneToOneMinutes = ONE_TO_ONE_MONTHLY_PACKAGES[0].durationMinutes;
  const smallGroups = GROUP_MONTHLY_FEES.filter((row) => row.ratio !== '1:1');
  const smallGroupMin = Math.min(...smallGroups.map((row) => row.durationMinutes));
  const smallGroupMax = Math.max(...smallGroups.map((row) => row.durationMinutes));

  return withSource(
    `Standard 1:1 classes are ${oneToOneMinutes} minutes. Small-group sessions vary by group size, currently ${smallGroupMin}–${smallGroupMax} minutes.`,
    'pricing',
  );
}

function coursesAnswer(): string {
  const programs = PUBLIC_SITE_FACTS.corePrograms;
  return withSource(
    `Tiny Steps offers three core English-learning programmes: ${programs[0]}, ${programs[1]}, and ${programs[2]}. ` +
      `They are delivered as live online classes for ${PUBLIC_SITE_FACTS.audience.label}.`,
    'courses',
  );
}

function ageRangeAnswer(): string {
  return withSource(
    `Tiny Steps teaches ${PUBLIC_SITE_FACTS.audience.label} through live online English programmes. ` +
      'The right starting point depends on the child’s current level and learning need.',
    'courses',
  );
}

function programmeAvailabilityAnswer(intent: AskTinyStepsSelectionIntent): string | undefined {
  switch (intent) {
    case 'phonics':
      return withSource(
        `Yes. Tiny Steps offers live online Phonics classes for ${PUBLIC_SITE_FACTS.audience.label}.`,
        'phonics',
      );
    case 'grammar':
      return withSource(
        `Yes. Tiny Steps offers live online Grammar classes for ${PUBLIC_SITE_FACTS.audience.label}.`,
        'grammar',
      );
    case 'speaking':
      return withSource(
        `Yes. Tiny Steps offers live online Public Speaking classes for ${PUBLIC_SITE_FACTS.audience.label}.`,
        'speaking',
      );
    case 'reading':
      return withSource(
        `Yes. Tiny Steps offers live online Reading classes for ${PUBLIC_SITE_FACTS.audience.label}.`,
        'reading-classes',
      );
    case 'courses':
      return coursesAnswer();
    default:
      return undefined;
  }
}

function schoolProgrammeAnswer(): string {
  return withSource(
    'Yes. Tiny Steps has a dedicated For Schools programme with phonics implementation, teacher training, and school partnership options.',
    'for-schools',
  );
}

function summerCampArchiveAnswer(): string {
  return withSource(
    `Summer Camp 2026 is concluded. It ended on ${PUBLIC_SITE_FACTS.summerCamp2026.endDateLabel}; enrolment is closed.`,
    'summer-camps-2026',
  );
}

function privateAccountAnswer(): string {
  return (
    'I do not have access to private child, attendance, progress, teacher, payment, or enrolment records. ' +
    'Please use the secure Parent Dashboard for child-specific information.'
  );
}

function visitorUrlAnswer(): string {
  return (
    'I can’t open or summarize links supplied by visitors. I can help with Tiny Steps and children’s English learning ' +
    'using approved Tiny Steps sources.'
  );
}

function externalResearchDisabledAnswer(): string {
  return (
    'Live external web research is not enabled in this chat. I can answer from approved Tiny Steps sources and give ' +
    'general children’s English-learning guidance. For current external research or policy evidence, please ask the Tiny Steps team to verify it separately.'
  );
}

function outOfScopeAnswer(): string {
  return (
    'I’m focused on Tiny Steps and children’s English learning, including phonics, reading, grammar, writing, and speaking. ' +
    'I can help with one of those topics.'
  );
}

function explicitDeterministicAnswer(
  question: string,
  audience: AskTinyStepsSelectionAudience,
  intent: AskTinyStepsSelectionIntent,
): string | undefined {
  if (GREETING_PATTERN.test(question.trim())) return greetingAnswer();
  if (PRIVATE_ACCOUNT_PATTERN.test(question)) return privateAccountAnswer();
  if (OBVIOUS_OUT_OF_SCOPE_PATTERN.test(question) && !ENGLISH_LEARNING_PATTERN.test(question)) {
    return outOfScopeAnswer();
  }

  // Current-turn pricing language wins inside established school context. This
  // prevents the previous word "schools" from masking a genuine pricing follow-up.
  if (audience === 'schools' && PRICING_PATTERN.test(question)) return schoolPricingAnswer();

  if (intent === 'assessment') return assessmentAnswer();
  if (intent === 'pricing') return parentPricingAnswer();
  if (intent === 'class_mode') return classModeAnswer();
  if (
    intent === 'timings' &&
    isAskTinyStepsDurationQuestion(question) &&
    !SLOT_OR_SCHEDULE_PATTERN.test(question)
  ) {
    return durationAnswer(question);
  }
  if (isAskTinyStepsAgeRangeQuestion(question) && audience === 'parents') return ageRangeAnswer();
  if (isAskTinyStepsProgrammeFactQuestion(question) && audience === 'parents') {
    const answer = programmeAvailabilityAnswer(intent);
    if (answer) return answer;
  }
  if (intent === 'school_program' && audience === 'schools') return schoolProgrammeAnswer();
  if (intent === 'summer_camp') return summerCampArchiveAnswer();

  return undefined;
}

export function planAskTinyStepsExecution(
  question: string,
  options: AskTinyStepsExecutionOptions = {},
): AskTinyStepsExecutionPlan {
  const currentQuestion = question.trim();
  const recentUserMessages = (options.recentUserMessages ?? [])
    .map((message) => message.trim())
    .filter(Boolean)
    .slice(-1);
  const isFollowUp =
    recentUserMessages.length > 0 && isAskTinyStepsContextualFollowUp(currentQuestion);

  if (VISITOR_URL_PATTERN.test(currentQuestion)) {
    return {
      mode: 'deterministic',
      audience: 'parents',
      intent: 'general',
      sourceIds: [],
      isFollowUp: false,
      deterministicAnswer: visitorUrlAnswer(),
      reason: 'visitor_url_boundary',
    };
  }

  const selection = selectAskTinyStepsSources(currentQuestion, {
    recentUserMessages,
    currentPath: options.currentPath,
  });

  if (EXTERNAL_RESEARCH_PATTERN.test(currentQuestion) && !ASK_TINY_STEPS_EXTERNAL_RESEARCH_ENABLED) {
    return {
      mode: 'external_research_disabled',
      audience: selection.audience,
      intent: selection.intent,
      sourceIds: [],
      isFollowUp,
      deterministicAnswer: externalResearchDisabledAnswer(),
      reason: 'external_research_not_enabled',
    };
  }

  const deterministicAnswer = explicitDeterministicAnswer(
    currentQuestion,
    selection.audience,
    selection.intent,
  );
  if (deterministicAnswer) {
    const privateBoundary = PRIVATE_ACCOUNT_PATTERN.test(currentQuestion);
    const outOfScope =
      OBVIOUS_OUT_OF_SCOPE_PATTERN.test(currentQuestion) && !ENGLISH_LEARNING_PATTERN.test(currentQuestion);
    return {
      mode: 'deterministic',
      audience: selection.audience,
      intent: selection.intent,
      sourceIds: selection.sourceIds,
      isFollowUp,
      deterministicAnswer,
      reason: privateBoundary
        ? 'private_account_boundary'
        : outOfScope
          ? 'out_of_scope_boundary'
          : 'verified_fact',
    };
  }

  if (selection.sourceIds.length > 0) {
    return {
      mode: 'first_party_grounded',
      audience: selection.audience,
      intent: selection.intent,
      sourceIds: selection.sourceIds,
      isFollowUp,
      reason: 'first_party_source_required',
    };
  }

  if (ENGLISH_LEARNING_PATTERN.test(currentQuestion)) {
    return {
      mode: 'general_guidance',
      audience: selection.audience,
      intent: selection.intent,
      sourceIds: [],
      isFollowUp,
      reason: 'general_learning_guidance',
    };
  }

  return {
    mode: 'deterministic',
    audience: selection.audience,
    intent: selection.intent,
    sourceIds: [],
    isFollowUp,
    deterministicAnswer: outOfScopeAnswer(),
    reason: 'out_of_scope_boundary',
  };
}

export function buildAskTinyStepsLocalFallback(plan: AskTinyStepsExecutionPlan): string {
  if (plan.deterministicAnswer) return plan.deterministicAnswer;

  switch (plan.intent) {
    case 'phonics':
      return (
        'General guidance: if a child knows letter sounds but cannot blend, practise hearing and joining 2–3 sounds orally first, ' +
        'then use short decodable words and keep the sounds continuous rather than naming the letters. Accuracy should come before speed.'
      );
    case 'reading':
      return (
        'General guidance: if reading is accurate but slow, work on short decodable passages, phrase-by-phrase reading, and a small amount of repeated reading. ' +
        'Keep accuracy high and build speed gradually rather than asking the child to rush.'
      );
    case 'grammar':
      return (
        'General guidance: use one sentence pattern at a time, model a correct example, then ask the child to make a fresh sentence independently. ' +
        'Correct the specific grammar target without rewriting the whole response for the child.'
      );
    case 'speaking':
      return (
        'General guidance: use predictable prompts, picture talk, and short full-sentence answers before moving to longer speaking tasks. ' +
        'Build confidence through repeated low-pressure practice rather than forcing long responses immediately.'
      );
    case 'school_program':
    case 'school_research':
      return schoolProgrammeAnswer();
    default: {
      const primarySource = plan.sourceIds[0];
      const url = primarySource ? sourceUrl(primarySource) : undefined;
      return url
        ? `I couldn’t retrieve the full answer just now. The most relevant approved Tiny Steps page is: ${url}`
        : 'I couldn’t retrieve a reliable answer just now. Please try again or contact Tiny Steps for the exact detail.';
    }
  }
}
