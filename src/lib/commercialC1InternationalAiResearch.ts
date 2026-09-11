import { COMMERCIAL_C0_FACTS, COMMERCIAL_C0_STATUS } from './commercialC0Foundation';
import { COMMERCIAL_C1_STATUS } from './commercialC1SearchUniverse';
import type { CommercialIntent, CommercialSubject, ParentStage } from './commercialC1SearchUniverse';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const COMMERCIAL_C1_ENHANCEMENT_REVISION = '2026-09-10-c1-r2';
export const COMMERCIAL_C1_ENHANCEMENT_STATUS = 'research-complete';

export type InternationalMarketId = 'uae' | 'usa' | 'uk' | 'australia' | 'singapore' | 'nri';
export type InternationalEvidenceStrength = 'observed-market' | 'observed-provider-pattern' | 'research-hypothesis';

export type InternationalMarket = {
  id: InternationalMarketId;
  label: string;
  audiencePhrase: string;
  evidenceStrength: InternationalEvidenceStrength;
  evidence: readonly string[];
  parentDecisionFactors: readonly string[];
};

export const COMMERCIAL_C1_INTERNATIONAL_MARKETS = freezeList<InternationalMarket>([
  freeze({
    id: 'uae',
    label: 'UAE',
    audiencePhrase: 'kids in UAE',
    evidenceStrength: 'observed-provider-pattern',
    evidence: freezeList(['Rays global-family SERP evidence', 'Englishly Global country/timezone SERP evidence', 'WinQuest NRI/global-family SERP evidence']),
    parentDecisionFactors: freezeList(['Gulf-friendly timings', 'live teacher-led learning', '1:1 or small group', 'free trial/assessment', 'school-readiness and English confidence']),
  }),
  freeze({
    id: 'usa',
    label: 'United States',
    audiencePhrase: 'kids in USA',
    evidenceStrength: 'observed-provider-pattern',
    evidence: freezeList(['Rays global-family SERP evidence', 'Englishly Global US/timezone SERP evidence', 'Apna Tutor NRI-parent SERP evidence']),
    parentDecisionFactors: freezeList(['US timezone fit', '1:1 teacher attention', 'reading/phonics transfer', 'parent progress visibility', 'international-school compatibility']),
  }),
  freeze({
    id: 'uk',
    label: 'United Kingdom',
    audiencePhrase: 'kids in UK',
    evidenceStrength: 'observed-provider-pattern',
    evidence: freezeList(['Rays global-family SERP evidence', 'Englishly Global UK/timezone SERP evidence', 'WinQuest UK Letters and Sounds positioning']),
    parentDecisionFactors: freezeList(['UK timezone fit', 'synthetic phonics compatibility', 'reading confidence', '1:1 support', 'trial before commitment']),
  }),
  freeze({
    id: 'australia',
    label: 'Australia',
    audiencePhrase: 'kids in Australia',
    evidenceStrength: 'observed-provider-pattern',
    evidence: freezeList(['Rays global-family SERP evidence', 'Englishly Global Australia/timezone SERP evidence', 'WinQuest international-family SERP evidence']),
    parentDecisionFactors: freezeList(['Australia timezone fit', 'live teacher interaction', 'reading and spoken-English outcomes', '1:1 support', 'flexible scheduling']),
  }),
  freeze({
    id: 'singapore',
    label: 'Singapore',
    audiencePhrase: 'kids in Singapore',
    evidenceStrength: 'observed-market',
    evidence: freezeList(['BrightCHAMPS Singapore communication SERP evidence', 'British Council Singapore 1:1/small-group SERP evidence', 'OnePA phonics course evidence']),
    parentDecisionFactors: freezeList(['school oral communication', 'phonics/reading foundation', '1:1 or small group', 'consultation/level fit', 'clear speaking and presentation confidence']),
  }),
  freeze({
    id: 'nri',
    label: 'NRI families',
    audiencePhrase: 'NRI kids',
    evidenceStrength: 'observed-market',
    evidence: freezeList(['WinQuest NRI programme SERP evidence', 'Apna Tutor NRI-parent/tutor SERP evidence', 'Englishly Global multi-timezone SERP evidence']),
    parentDecisionFactors: freezeList(['timezone flexibility', 'India-based teacher access', 'school-fit abroad', '1:1 continuity', 'free demo before commitment']),
  }),
]);

const INTERNATIONAL_QUERY_TEMPLATES: ReadonlyArray<{
  key: string;
  build: (audiencePhrase: string) => string;
  subject: CommercialSubject;
  intent: CommercialIntent;
  parentStage: ParentStage;
  commercialStrength: 'high' | 'very_high';
}> = freezeList([
  freeze({ key:'english', build:(audience) => `online english classes for ${audience}`, subject:'broad_english', intent:'provider-research', parentStage:'provider_research', commercialStrength:'very_high' }),
  freeze({ key:'phonics', build:(audience) => `online phonics classes for ${audience}`, subject:'phonics', intent:'provider-research', parentStage:'provider_research', commercialStrength:'very_high' }),
  freeze({ key:'reading', build:(audience) => `online reading classes for ${audience}`, subject:'reading', intent:'provider-research', parentStage:'provider_research', commercialStrength:'high' }),
  freeze({ key:'grammar', build:(audience) => `online grammar classes for ${audience}`, subject:'grammar', intent:'provider-research', parentStage:'provider_research', commercialStrength:'high' }),
  freeze({ key:'speaking', build:(audience) => `online public speaking classes for ${audience}`, subject:'public_speaking', intent:'provider-research', parentStage:'provider_research', commercialStrength:'very_high' }),
  freeze({ key:'communication', build:(audience) => `online communication skills classes for ${audience}`, subject:'communication', intent:'provider-research', parentStage:'provider_research', commercialStrength:'high' }),
  freeze({ key:'tutor', build:(audience) => `1 to 1 english tutor for ${audience} online`, subject:'tutor', intent:'provider-research', parentStage:'provider_research', commercialStrength:'very_high' }),
  freeze({ key:'fees', build:(audience) => `online english classes fees for ${audience}`, subject:'broad_english', intent:'price', parentStage:'price', commercialStrength:'very_high' }),
  freeze({ key:'trial', build:(audience) => `free trial online english class for ${audience}`, subject:'broad_english', intent:'trial-demo', parentStage:'trial_demo', commercialStrength:'very_high' }),
]);

export type InternationalQueryResearchRow = {
  id: string;
  market: InternationalMarketId;
  query: string;
  subject: CommercialSubject;
  intent: CommercialIntent;
  parentStage: ParentStage;
  commercialStrength: 'high' | 'very_high';
  evidenceStrength: InternationalEvidenceStrength;
  status: 'RESEARCHED';
  ownershipDeferredTo: 'C2';
};

export const COMMERCIAL_C1_INTERNATIONAL_QUERIES = freezeList<InternationalQueryResearchRow>(
  COMMERCIAL_C1_INTERNATIONAL_MARKETS.flatMap((market) =>
    INTERNATIONAL_QUERY_TEMPLATES.map((template) => freeze({
      id: `intl-${market.id}-${template.key}`,
      market: market.id,
      query: template.build(market.audiencePhrase),
      subject: template.subject,
      intent: template.intent,
      parentStage: template.parentStage,
      commercialStrength: template.commercialStrength,
      evidenceStrength: market.evidenceStrength,
      status: 'RESEARCHED' as const,
      ownershipDeferredTo: 'C2' as const,
    })),
  ),
);

export type AiStyleCommercialQuery = {
  id: string;
  market: InternationalMarketId | 'global' | 'india';
  prompt: string;
  subject: CommercialSubject;
  intent: CommercialIntent;
  parentStage: ParentStage;
  decisionFactors: readonly string[];
  evidenceClass: 'ai-style-research-query';
  ownershipDeferredTo: 'C2';
};

export const COMMERCIAL_C1_AI_STYLE_QUERIES = freezeList<AiStyleCommercialQuery>([
  freeze({ id:'ai-uae-phonics', market:'uae', prompt:'What are the best live online phonics classes for a 5-year-old in Dubai who knows letter sounds but still cannot blend words?', subject:'phonics', intent:'comparison', parentStage:'comparison', decisionFactors:freezeList(['blending outcome','live teacher','age fit','UAE timing']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),
  freeze({ id:'ai-uae-speaking', market:'uae', prompt:'Which 1 to 1 online English speaking class would help a shy child in the UAE answer in full sentences and speak confidently at school?', subject:'spoken_english', intent:'solution-aware', parentStage:'solution', decisionFactors:freezeList(['1:1','confidence','sentence formation','school speaking']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),
  freeze({ id:'ai-uae-demo', market:'uae', prompt:'Can I book a free online English assessment for my child in the UAE before paying for classes?', subject:'broad_english', intent:'trial-demo', parentStage:'trial_demo', decisionFactors:freezeList(['free assessment','no commitment','UAE access']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),

  freeze({ id:'ai-us-reading', market:'usa', prompt:'My 7-year-old in the US reads slowly and guesses words. Should I choose phonics tutoring or a reading fluency class online?', subject:'reading', intent:'problem-aware', parentStage:'problem', decisionFactors:freezeList(['diagnosis','phonics vs reading','1:1 support','US timing']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),
  freeze({ id:'ai-us-tutor', market:'usa', prompt:'What should I look for in a live 1 to 1 online English tutor for an elementary-school child in the US?', subject:'tutor', intent:'provider-research', parentStage:'provider_research', decisionFactors:freezeList(['teacher quality','1:1','progress updates','US timezone']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),
  freeze({ id:'ai-us-price', market:'usa', prompt:'How do I compare the price and value of online English classes for kids in the US when some are group classes and others are 1 to 1?', subject:'broad_english', intent:'price', parentStage:'price', decisionFactors:freezeList(['price','1:1 vs group','class length','value']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),

  freeze({ id:'ai-uk-phonics', market:'uk', prompt:'Which online phonics classes for kids in the UK use a structured synthetic phonics approach and also teach children to blend independently?', subject:'phonics', intent:'provider-research', parentStage:'provider_research', decisionFactors:freezeList(['synthetic phonics','blending','UK fit','structured sequence']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),
  freeze({ id:'ai-uk-reading', market:'uk', prompt:'My child in the UK knows phonics sounds but cannot read unfamiliar words confidently. What kind of online reading support should I choose?', subject:'reading', intent:'problem-aware', parentStage:'problem', decisionFactors:freezeList(['decoding transfer','reading confidence','assessment','UK timing']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),
  freeze({ id:'ai-uk-demo', market:'uk', prompt:'Which online English classes for children in the UK let us try a live assessment or demo before enrolment?', subject:'broad_english', intent:'trial-demo', parentStage:'trial_demo', decisionFactors:freezeList(['demo','assessment','live teacher','UK access']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),

  freeze({ id:'ai-au-english', market:'australia', prompt:'What are good live online English classes for a primary-school child in Australia who needs reading, grammar and speaking support together?', subject:'broad_english', intent:'provider-research', parentStage:'provider_research', decisionFactors:freezeList(['multi-skill path','Australia timing','live teacher','age fit']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),
  freeze({ id:'ai-au-speaking', market:'australia', prompt:'Which online public speaking classes for kids in Australia give each child enough speaking time instead of only watching a group lesson?', subject:'public_speaking', intent:'comparison', parentStage:'comparison', decisionFactors:freezeList(['speaking turns','1:1 vs group','Australia timing','feedback']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),
  freeze({ id:'ai-au-tutor', market:'australia', prompt:'Can an India-based 1 to 1 English tutor work well for a child in Australia if the timing and curriculum fit?', subject:'tutor', intent:'comparison', parentStage:'comparison', decisionFactors:freezeList(['teacher location','timezone','curriculum fit','1:1']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),

  freeze({ id:'ai-sg-speaking', market:'singapore', prompt:'My child in Singapore reads well but gives very short answers during oral work. Which online communication class can help with clear structured speaking?', subject:'communication', intent:'problem-aware', parentStage:'problem', decisionFactors:freezeList(['oral communication','structured answers','Singapore school context','live practice']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),
  freeze({ id:'ai-sg-grammar', market:'singapore', prompt:'What online grammar and writing classes for kids in Singapore focus on sentence formation instead of only worksheets?', subject:'grammar', intent:'comparison', parentStage:'comparison', decisionFactors:freezeList(['sentence formation','writing transfer','live correction','Singapore fit']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),
  freeze({ id:'ai-sg-1to1', market:'singapore', prompt:'Are 1 to 1 online English lessons better than small groups for a child in Singapore who needs both school English and speaking confidence?', subject:'broad_english', intent:'comparison', parentStage:'comparison', decisionFactors:freezeList(['1:1 vs group','school English','confidence','Singapore timing']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),

  freeze({ id:'ai-nri-timezone', market:'nri', prompt:'Which online English classes for NRI kids offer live India-based teachers with timings that work in the US, UK, UAE or Australia?', subject:'broad_english', intent:'provider-research', parentStage:'provider_research', decisionFactors:freezeList(['India-based teacher','timezone flexibility','NRI family','live classes']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),
  freeze({ id:'ai-nri-phonics', market:'nri', prompt:'What is a good online phonics programme for an NRI child who needs structured blending and reading practice with a live teacher?', subject:'phonics', intent:'provider-research', parentStage:'provider_research', decisionFactors:freezeList(['NRI','blending','reading','live teacher']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),
  freeze({ id:'ai-nri-value', market:'nri', prompt:'How should NRI parents compare an India-based online English teacher with local tutoring for price, quality, timing and progress?', subject:'tutor', intent:'comparison', parentStage:'comparison', decisionFactors:freezeList(['price','quality','timezone','progress']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),

  freeze({ id:'ai-india-budget', market:'india', prompt:`Is ₹${COMMERCIAL_C0_FACTS.pricing.standardOneToOnePerClassInr} per class reasonable for live 1 to 1 English classes for a child if the teacher gives a structured plan and progress updates?`, subject:'broad_english', intent:'price', parentStage:'price', decisionFactors:freezeList(['price objection','1:1 value','progress visibility','class quality']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),
  freeze({ id:'ai-global-demo-to-enrol', market:'global', prompt:'We completed an online English demo for our child and liked the teacher. What should we check before enrolling and paying for the first set of classes?', subject:'broad_english', intent:'enrolment', parentStage:'enrolment', decisionFactors:freezeList(['teacher fit','price','schedule','programme fit','progress expectations']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),
  freeze({ id:'ai-global-phonics-enrol', market:'global', prompt:'After a phonics assessment shows that my child struggles with blending, should I enrol in phonics classes or a general English course?', subject:'phonics', intent:'enrolment', parentStage:'enrolment', decisionFactors:freezeList(['assessment result','programme choice','blending need','enrolment']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),
  freeze({ id:'ai-global-speaking-enrol', market:'global', prompt:'My child enjoyed the public speaking trial class. What results and class structure should I confirm before enrolling?', subject:'public_speaking', intent:'enrolment', parentStage:'enrolment', decisionFactors:freezeList(['trial experience','outcomes','class structure','enrolment']), evidenceClass:'ai-style-research-query', ownershipDeferredTo:'C2' }),
]);

export const COMMERCIAL_C1_ENROLMENT_QUERY_FAMILY = freezeList([
  freeze({ query:'enrol child in online english classes after demo', subject:'broad_english' as const, intent:'enrolment' as const, parentStage:'enrolment' as const }),
  freeze({ query:'join online phonics classes after trial', subject:'phonics' as const, intent:'enrolment' as const, parentStage:'enrolment' as const }),
  freeze({ query:'register for online public speaking classes for kids', subject:'public_speaking' as const, intent:'enrolment' as const, parentStage:'enrolment' as const }),
  freeze({ query:'start 1 to 1 english classes for child', subject:'tutor' as const, intent:'enrolment' as const, parentStage:'enrolment' as const }),
]);

/**
 * These are declared operating priors supplied by the business owner because
 * systematic CRM tracking is not yet reliable. They are planning heuristics,
 * not measured conversion analytics, and must never be presented as audited
 * funnel performance.
 */
export const COMMERCIAL_C1_DECLARED_OPERATING_PRIORS = freeze({
  trackingStatus: 'not-systematically-measured',
  demoToEnrolment: freeze({
    numerator: 1,
    denominator: 3,
    approximateRatePct: 33.3,
    kind: 'declared-operating-heuristic',
    interpretation: 'Approximately one enrolment is expected for every three completed demos based on current operating experience.',
  }),
  leadBudgetDropOff: freeze({
    numerator: 1,
    denominator: 5,
    approximateRatePct: 20,
    kind: 'declared-operating-heuristic',
    pricePerClassInr: COMMERCIAL_C0_FACTS.pricing.standardOneToOnePerClassInr,
    interpretation: 'Approximately one parent in five leads is expected to drop because the standard per-class price is outside budget.',
  }),
  doNotCombineIntoObservedFunnel: true,
  rule: 'Use these priors for commercial prioritisation and objection research only until reliable lead-to-demo-to-enrolment tracking exists.',
});

export const COMMERCIAL_C1_ENHANCEMENT_GUARDRAILS = freeze({
  researchOnly: true,
  newCountryPagesAuthorized: false,
  aiPromptPagesAuthorized: false,
  canonicalOwnershipAuthorized: false,
  ownershipBeginsAt: 'C2',
  rule: 'International and AI-style queries expand the research universe only. Geographic or AI-specific pages require C2 ownership evidence and later implementation approval.',
});

export function getCommercialC1InternationalAiSnapshot() {
  return freeze({
    revision: COMMERCIAL_C1_ENHANCEMENT_REVISION,
    status: COMMERCIAL_C1_ENHANCEMENT_STATUS,
    markets: COMMERCIAL_C1_INTERNATIONAL_MARKETS,
    internationalQueries: COMMERCIAL_C1_INTERNATIONAL_QUERIES,
    aiStyleQueries: COMMERCIAL_C1_AI_STYLE_QUERIES,
    enrolmentQueries: COMMERCIAL_C1_ENROLMENT_QUERY_FAMILY,
    operatingPriors: COMMERCIAL_C1_DECLARED_OPERATING_PRIORS,
    guardrails: COMMERCIAL_C1_ENHANCEMENT_GUARDRAILS,
  });
}

if (COMMERCIAL_C0_STATUS !== 'frozen') throw new Error('C1 international/AI research requires frozen C0.');
if (COMMERCIAL_C1_STATUS !== 'research-complete') throw new Error('C1 international/AI research requires the base C1 research registry.');
if (COMMERCIAL_C1_INTERNATIONAL_MARKETS.length !== 6) throw new Error('C1 international research must cover UAE, USA, UK, Australia, Singapore and NRI families.');
if (COMMERCIAL_C1_INTERNATIONAL_QUERIES.length !== 54) throw new Error('C1 international research must cover nine commercial query families across six markets.');
if (!COMMERCIAL_C1_AI_STYLE_QUERIES.some((item) => item.parentStage === 'enrolment')) throw new Error('C1 AI-style research must cover enrolment intent.');
if (COMMERCIAL_C1_DECLARED_OPERATING_PRIORS.leadBudgetDropOff.pricePerClassInr !== 400) throw new Error('C1 budget-objection prior must stay linked to the current C0 standard price.');
