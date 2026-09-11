import { COMMERCIAL_C0_STATUS } from './commercialC0Foundation';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const COMMERCIAL_C1_REVISION = '2026-09-10-c1-r1';
export const COMMERCIAL_C1_STATUS = 'research-complete';

export type CommercialSubject =
  | 'phonics'
  | 'reading'
  | 'grammar'
  | 'writing'
  | 'spoken_english'
  | 'public_speaking'
  | 'communication'
  | 'broad_english'
  | 'tutor';

export type CommercialIntent =
  | 'problem-aware'
  | 'solution-aware'
  | 'provider-research'
  | 'comparison'
  | 'price'
  | 'trial-demo'
  | 'enrolment';

export type ParentStage =
  | 'problem'
  | 'solution'
  | 'provider_research'
  | 'comparison'
  | 'price'
  | 'trial_demo'
  | 'enrolment';

export type DemandSignal = 'observed-serp' | 'observed-ai' | 'observed-site' | 'hypothesis';
export type CommercialStrength = 'low' | 'medium' | 'high' | 'very_high';
export type ResearchAction = 'KEEP' | 'OPTIMISE' | 'CONSOLIDATE' | 'BUILD' | 'HOLD';

export type CommercialKeywordResearchRow = {
  id: string;
  query: string;
  subject: CommercialSubject;
  intent: CommercialIntent;
  parentStage: ParentStage;
  demandSignal: DemandSignal;
  commercialStrength: CommercialStrength;
  existingSurface: string | null;
  currentRank: number | null;
  impressions: number | null;
  ctr: number | null;
  conversionRelevance: 'low' | 'medium' | 'high' | 'very_high';
  recommendedAction: ResearchAction;
  evidence: readonly string[];
  notes: string;
};

const row = (value: CommercialKeywordResearchRow) => freeze(value);

/**
 * C1 is deliberately research-only. `existingSurface` is an observed current
 * Tiny Steps surface, not a canonical keyword owner. C2 decides ownership.
 * Numeric GSC query metrics stay null unless directly observed from an
 * authenticated query-level export; C1 never invents them.
 */
export const COMMERCIAL_C1_KEYWORD_UNIVERSE = freezeList<CommercialKeywordResearchRow>([
  row({ id:'ph-online', query:'online phonics classes for kids', subject:'phonics', intent:'provider-research', parentStage:'provider_research', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/phonics', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'OPTIMISE', evidence:['fresh-serp-2026-09-10','site-current'], notes:'Core provider-intent phonics term.' }),
  row({ id:'ph-india', query:'online phonics classes for kids in india', subject:'phonics', intent:'provider-research', parentStage:'provider_research', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/phonics', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'OPTIMISE', evidence:['fresh-serp-2026-09-10','ai-page-evidence'], notes:'Strong India commercial modifier.' }),
  row({ id:'ph-best', query:'best online phonics classes for kids in india', subject:'phonics', intent:'comparison', parentStage:'comparison', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/best-online-phonics-classes-for-kids-in-india', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'KEEP', evidence:['fresh-serp-2026-09-10','ai-page-evidence'], notes:'Distinct comparison/buyer intent already has a comparison surface.' }),
  row({ id:'ph-fees', query:'phonics classes fees', subject:'phonics', intent:'price', parentStage:'price', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/phonics-fees-india', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'KEEP', evidence:['fresh-serp-2026-09-10','site-current'], notes:'Price-led parent query.' }),
  row({ id:'ph-1to1', query:'1 to 1 phonics classes online', subject:'phonics', intent:'provider-research', parentStage:'provider_research', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/phonics', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'OPTIMISE', evidence:['fresh-serp-2026-09-10'], notes:'Format-specific high-intent query.' }),
  row({ id:'ph-demo', query:'free phonics demo class online', subject:'phonics', intent:'trial-demo', parentStage:'trial_demo', demandSignal:'observed-site', commercialStrength:'very_high', existingSurface:'/book-demo', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'KEEP', evidence:['site-current'], notes:'Transaction-adjacent trial intent.' }),
  row({ id:'ph-age3', query:'phonics classes for 3 year old', subject:'phonics', intent:'solution-aware', parentStage:'solution', demandSignal:'hypothesis', commercialStrength:'high', existingSurface:'/phonics', currentRank:null, impressions:null, ctr:null, conversionRelevance:'high', recommendedAction:'HOLD', evidence:['semantic-facts'], notes:'Age modifier requires demand validation before any new surface.' }),
  row({ id:'ph-blending', query:'phonics classes for child who cannot blend words', subject:'phonics', intent:'problem-aware', parentStage:'problem', demandSignal:'observed-site', commercialStrength:'high', existingSurface:'/child-not-reading-properly', currentRank:null, impressions:null, ctr:null, conversionRelevance:'high', recommendedAction:'KEEP', evidence:['site-current','knowledge-base'], notes:'Problem-to-commercial journey; do not create a duplicate page in C1.' }),

  row({ id:'rd-online', query:'online reading classes for kids', subject:'reading', intent:'provider-research', parentStage:'provider_research', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/reading-classes-for-kids', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'OPTIMISE', evidence:['fresh-serp-2026-09-10'], notes:'Core reading provider intent.' }),
  row({ id:'rd-struggling', query:'reading classes for struggling readers', subject:'reading', intent:'solution-aware', parentStage:'solution', demandSignal:'observed-serp', commercialStrength:'high', existingSurface:'/reading-classes-for-kids', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'OPTIMISE', evidence:['fresh-serp-2026-09-10'], notes:'Strong problem/solution modifier.' }),
  row({ id:'rd-fluency', query:'reading fluency classes for kids online', subject:'reading', intent:'solution-aware', parentStage:'solution', demandSignal:'observed-site', commercialStrength:'high', existingSurface:'/reading-fluency-program', currentRank:null, impressions:null, ctr:null, conversionRelevance:'high', recommendedAction:'KEEP', evidence:['site-current'], notes:'Specific outcome-driven intent.' }),
  row({ id:'rd-comprehension', query:'reading comprehension classes for kids online', subject:'reading', intent:'solution-aware', parentStage:'solution', demandSignal:'observed-site', commercialStrength:'high', existingSurface:'/reading-classes-for-kids', currentRank:null, impressions:null, ctr:null, conversionRelevance:'high', recommendedAction:'OPTIMISE', evidence:['site-current'], notes:'Distinct need but likely same commercial owner unless C2 evidence proves otherwise.' }),
  row({ id:'rd-tutor', query:'online reading tutor for kids', subject:'reading', intent:'provider-research', parentStage:'provider_research', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/reading-classes-for-kids', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'OPTIMISE', evidence:['fresh-serp-2026-09-10'], notes:'Tutor wording maps to same parent need.' }),
  row({ id:'rd-price', query:'online reading classes fees for kids', subject:'reading', intent:'price', parentStage:'price', demandSignal:'hypothesis', commercialStrength:'very_high', existingSurface:'/pricing', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'HOLD', evidence:['site-current'], notes:'Validate whether subject-specific price intent warrants a dedicated owner in C2.' }),

  row({ id:'gr-online', query:'online grammar classes for kids', subject:'grammar', intent:'provider-research', parentStage:'provider_research', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/grammar', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'OPTIMISE', evidence:['fresh-serp-2026-09-10','site-current'], notes:'Core grammar provider term.' }),
  row({ id:'gr-india', query:'grammar classes for kids in india', subject:'grammar', intent:'provider-research', parentStage:'provider_research', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/grammar', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'OPTIMISE', evidence:['fresh-serp-2026-09-10'], notes:'India modifier currently represented by main grammar page.' }),
  row({ id:'gr-sentence', query:'sentence formation classes for kids', subject:'grammar', intent:'solution-aware', parentStage:'solution', demandSignal:'observed-site', commercialStrength:'high', existingSurface:'/grammar', currentRank:null, impressions:null, ctr:null, conversionRelevance:'high', recommendedAction:'OPTIMISE', evidence:['site-current'], notes:'Outcome-oriented grammar need.' }),
  row({ id:'gr-school', query:'grammar classes to improve school answers', subject:'grammar', intent:'solution-aware', parentStage:'solution', demandSignal:'observed-site', commercialStrength:'medium', existingSurface:'/grammar', currentRank:null, impressions:null, ctr:null, conversionRelevance:'high', recommendedAction:'KEEP', evidence:['site-current'], notes:'Parent-language use case, likely semantic rather than exact-match target.' }),
  row({ id:'gr-fees', query:'online grammar classes fees for kids', subject:'grammar', intent:'price', parentStage:'price', demandSignal:'hypothesis', commercialStrength:'very_high', existingSurface:'/pricing', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'HOLD', evidence:['site-current'], notes:'Needs real demand before deciding dedicated fee ownership.' }),
  row({ id:'gr-demo', query:'free grammar demo class for kids', subject:'grammar', intent:'trial-demo', parentStage:'trial_demo', demandSignal:'observed-site', commercialStrength:'very_high', existingSurface:'/book-demo', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'KEEP', evidence:['site-current'], notes:'Trial intent handled transactionally.' }),

  row({ id:'wr-online', query:'creative writing classes for kids online', subject:'writing', intent:'provider-research', parentStage:'provider_research', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/writing-classes-for-kids', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'OPTIMISE', evidence:['fresh-serp-2026-09-10'], notes:'Strong standalone writing provider market.' }),
  row({ id:'wr-paragraph', query:'paragraph writing classes for kids', subject:'writing', intent:'solution-aware', parentStage:'solution', demandSignal:'observed-site', commercialStrength:'high', existingSurface:'/writing-classes-for-kids', currentRank:null, impressions:null, ctr:null, conversionRelevance:'high', recommendedAction:'KEEP', evidence:['knowledge-base'], notes:'Likely semantic sub-intent of writing owner.' }),
  row({ id:'wr-school', query:'writing classes to improve school answers', subject:'writing', intent:'solution-aware', parentStage:'solution', demandSignal:'hypothesis', commercialStrength:'medium', existingSurface:'/writing-classes-for-kids', currentRank:null, impressions:null, ctr:null, conversionRelevance:'high', recommendedAction:'HOLD', evidence:['site-current'], notes:'Validate phrasing before optimization.' }),
  row({ id:'wr-1to1', query:'1 to 1 creative writing classes for kids', subject:'writing', intent:'provider-research', parentStage:'provider_research', demandSignal:'observed-serp', commercialStrength:'high', existingSurface:'/writing-classes-for-kids', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'OPTIMISE', evidence:['fresh-serp-2026-09-10'], notes:'Format modifier is commercially strong.' }),
  row({ id:'wr-fees', query:'creative writing classes for kids fees', subject:'writing', intent:'price', parentStage:'price', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/pricing', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'HOLD', evidence:['fresh-serp-2026-09-10'], notes:'Competitor SERPs expose explicit fees; C2 decides ownership.' }),

  row({ id:'se-online', query:'spoken english classes for kids online', subject:'spoken_english', intent:'provider-research', parentStage:'provider_research', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/spoken-english-classes-for-kids-online', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'KEEP', evidence:['fresh-serp-2026-09-10'], notes:'Core spoken-English provider intent.' }),
  row({ id:'se-fluency', query:'english speaking classes for kids to improve fluency', subject:'spoken_english', intent:'solution-aware', parentStage:'solution', demandSignal:'observed-serp', commercialStrength:'high', existingSurface:'/spoken-english-classes-for-kids-online', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'OPTIMISE', evidence:['fresh-serp-2026-09-10'], notes:'Outcome-driven spoken English query.' }),
  row({ id:'se-shy', query:'spoken english classes for shy child', subject:'spoken_english', intent:'problem-aware', parentStage:'problem', demandSignal:'observed-site', commercialStrength:'high', existingSurface:'/shy-child-speaking-confidence', currentRank:null, impressions:null, ctr:null, conversionRelevance:'high', recommendedAction:'KEEP', evidence:['site-current','knowledge-base'], notes:'Problem path should support, not compete with, commercial spoken-English owner.' }),
  row({ id:'se-fees', query:'spoken english classes for kids fees', subject:'spoken_english', intent:'price', parentStage:'price', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/pricing', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'HOLD', evidence:['fresh-serp-2026-09-10'], notes:'Price intent is important; owner decision deferred to C2.' }),
  row({ id:'se-demo', query:'free spoken english demo class for kids', subject:'spoken_english', intent:'trial-demo', parentStage:'trial_demo', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/book-demo', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'KEEP', evidence:['fresh-serp-2026-09-10','site-current'], notes:'Free-demo language is common competitor SERP behaviour.' }),

  row({ id:'ps-online', query:'public speaking classes for kids online', subject:'public_speaking', intent:'provider-research', parentStage:'provider_research', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/speaking', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'OPTIMISE', evidence:['fresh-serp-2026-09-10','ai-page-evidence'], notes:'Core speaking commercial query.' }),
  row({ id:'ps-india', query:'public speaking classes for kids in india', subject:'public_speaking', intent:'provider-research', parentStage:'provider_research', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/speaking', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'OPTIMISE', evidence:['fresh-serp-2026-09-10'], notes:'India modifier appears directly in provider SERPs.' }),
  row({ id:'ps-stage', query:'public speaking classes for child with stage fear', subject:'public_speaking', intent:'problem-aware', parentStage:'problem', demandSignal:'observed-serp', commercialStrength:'high', existingSurface:'/shy-child-speaking-confidence', currentRank:null, impressions:null, ctr:null, conversionRelevance:'high', recommendedAction:'KEEP', evidence:['fresh-serp-2026-09-10','site-current'], notes:'Problem page should route toward speaking programme.' }),
  row({ id:'ps-story', query:'storytelling classes for kids online', subject:'public_speaking', intent:'solution-aware', parentStage:'solution', demandSignal:'observed-serp', commercialStrength:'high', existingSurface:'/speaking', currentRank:null, impressions:null, ctr:null, conversionRelevance:'high', recommendedAction:'OPTIMISE', evidence:['fresh-serp-2026-09-10'], notes:'Common component of competitor speaking offers.' }),
  row({ id:'ps-debate', query:'debate and public speaking classes for kids', subject:'public_speaking', intent:'solution-aware', parentStage:'solution', demandSignal:'observed-serp', commercialStrength:'high', existingSurface:'/speaking', currentRank:null, impressions:null, ctr:null, conversionRelevance:'high', recommendedAction:'KEEP', evidence:['fresh-serp-2026-09-10'], notes:'Likely semantic sub-intent rather than new owner.' }),
  row({ id:'ps-fees', query:'public speaking classes for kids fees', subject:'public_speaking', intent:'price', parentStage:'price', demandSignal:'hypothesis', commercialStrength:'very_high', existingSurface:'/pricing', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'HOLD', evidence:['competitor-serp'], notes:'Commercially strong modifier; quantify before ownership.' }),

  row({ id:'cm-online', query:'communication skills classes for kids online', subject:'communication', intent:'provider-research', parentStage:'provider_research', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/speaking', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'OPTIMISE', evidence:['fresh-serp-2026-09-10'], notes:'Large adjacent market used by PlanetSpark/BrightCHAMPS-style offers.' }),
  row({ id:'cm-confidence', query:'confidence building classes for kids', subject:'communication', intent:'solution-aware', parentStage:'solution', demandSignal:'observed-site', commercialStrength:'high', existingSurface:'/confidence-building-program-kids', currentRank:null, impressions:null, ctr:null, conversionRelevance:'high', recommendedAction:'KEEP', evidence:['site-current'], notes:'Outcome-led programme intent.' }),
  row({ id:'cm-expression', query:'classes to help child express ideas clearly', subject:'communication', intent:'problem-aware', parentStage:'problem', demandSignal:'observed-site', commercialStrength:'medium', existingSurface:'/speaking', currentRank:null, impressions:null, ctr:null, conversionRelevance:'high', recommendedAction:'KEEP', evidence:['knowledge-base'], notes:'Natural-language parent query; semantic coverage more important than exact phrase.' }),
  row({ id:'cm-1to1', query:'1 to 1 communication classes for kids', subject:'communication', intent:'provider-research', parentStage:'provider_research', demandSignal:'observed-serp', commercialStrength:'high', existingSurface:'/speaking', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'OPTIMISE', evidence:['fresh-serp-2026-09-10'], notes:'Personalization modifier can differentiate Tiny Steps.' }),

  row({ id:'en-online', query:'online english classes for kids', subject:'broad_english', intent:'provider-research', parentStage:'provider_research', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/online-english-classes-for-kids', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'KEEP', evidence:['fresh-serp-2026-09-10','site-current'], notes:'Broad category demand should route to programme chooser.' }),
  row({ id:'en-india', query:'online english classes for kids in india', subject:'broad_english', intent:'provider-research', parentStage:'provider_research', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/online-english-classes-for-kids', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'OPTIMISE', evidence:['fresh-serp-2026-09-10'], notes:'India modifier is high-value and broad.' }),
  row({ id:'en-hyd', query:'online english classes for kids in hyderabad', subject:'broad_english', intent:'provider-research', parentStage:'provider_research', demandSignal:'observed-serp', commercialStrength:'high', existingSurface:'/online-english-classes-hyderabad', currentRank:null, impressions:null, ctr:null, conversionRelevance:'high', recommendedAction:'KEEP', evidence:['fresh-serp-2026-09-10','ai-page-evidence'], notes:'Existing local surface has observed AI visibility.' }),
  row({ id:'en-best', query:'best online english classes for kids in india', subject:'broad_english', intent:'comparison', parentStage:'comparison', demandSignal:'hypothesis', commercialStrength:'very_high', existingSurface:'/online-english-classes-for-kids', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'HOLD', evidence:['competitor-serp'], notes:'Comparison intent may justify a separate owner only after C2 validation.' }),
  row({ id:'en-fees', query:'online english classes for kids fees', subject:'broad_english', intent:'price', parentStage:'price', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/pricing', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'KEEP', evidence:['fresh-serp-2026-09-10'], notes:'Broad pricing intent fits central pricing surface unless C2 proves a stronger pattern.' }),
  row({ id:'en-demo', query:'free trial online english classes for kids', subject:'broad_english', intent:'trial-demo', parentStage:'trial_demo', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/book-demo', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'KEEP', evidence:['fresh-serp-2026-09-10'], notes:'Direct trial intent.' }),

  row({ id:'tu-english', query:'online english tutor for kids', subject:'tutor', intent:'provider-research', parentStage:'provider_research', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/online-english-classes-for-kids', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'OPTIMISE', evidence:['fresh-serp-2026-09-10'], notes:'Tutor wording signals preference for teacher-led personalization.' }),
  row({ id:'tu-1to1', query:'1 to 1 english tutor for kids online', subject:'tutor', intent:'provider-research', parentStage:'provider_research', demandSignal:'observed-serp', commercialStrength:'very_high', existingSurface:'/online-english-classes-for-kids', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'OPTIMISE', evidence:['fresh-serp-2026-09-10'], notes:'Matches Tiny Steps primary live 1:1 delivery.' }),
  row({ id:'tu-reading', query:'online reading tutor for child', subject:'tutor', intent:'solution-aware', parentStage:'solution', demandSignal:'observed-serp', commercialStrength:'high', existingSurface:'/reading-classes-for-kids', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'KEEP', evidence:['fresh-serp-2026-09-10'], notes:'Tutor term with reading-specific need.' }),
  row({ id:'tu-grammar', query:'online grammar tutor for kids', subject:'tutor', intent:'provider-research', parentStage:'provider_research', demandSignal:'hypothesis', commercialStrength:'high', existingSurface:'/grammar', currentRank:null, impressions:null, ctr:null, conversionRelevance:'high', recommendedAction:'HOLD', evidence:['site-current'], notes:'Validate actual query demand before explicit targeting.' }),
  row({ id:'tu-demo', query:'book free english tutor demo for child', subject:'tutor', intent:'trial-demo', parentStage:'trial_demo', demandSignal:'observed-site', commercialStrength:'very_high', existingSurface:'/book-demo', currentRank:null, impressions:null, ctr:null, conversionRelevance:'very_high', recommendedAction:'KEEP', evidence:['site-current'], notes:'Conversion intent belongs with assessment flow.' }),
]);

export const COMMERCIAL_C1_AI_VISIBILITY = freezeList([
  freeze({ period:'2026-05-18..2026-05-31', impressions:1037, observedDays:14, impressionsPerObservedDay:74.1 }),
  freeze({ period:'2026-06-01..2026-06-30', impressions:3037, observedDays:30, impressionsPerObservedDay:101.2 }),
  freeze({ period:'2026-07-01..2026-07-31', impressions:7207, observedDays:31, impressionsPerObservedDay:232.5 }),
  freeze({ period:'2026-08-01..2026-08-31', impressions:9756, observedDays:31, impressionsPerObservedDay:314.7 }),
  freeze({ period:'2026-09-01..2026-09-09', impressions:2722, observedDays:9, impressionsPerObservedDay:302.4 }),
]);

export const COMMERCIAL_C1_AI_TOP_SURFACES_SEP = freezeList([
  freeze({ path:'/free-letter-tracing-game-for-kids', impressions:802, role:'informational-utility' }),
  freeze({ path:'/phonics', impressions:408, role:'commercial-programme' }),
  freeze({ path:'/blog/satpin-phonics-guide', impressions:325, role:'informational' }),
  freeze({ path:'/', impressions:193, role:'brand-entry' }),
  freeze({ path:'/letter-tracing-with-sounds-game', impressions:86, role:'informational-utility' }),
  freeze({ path:'/speaking', impressions:51, role:'commercial-programme' }),
  freeze({ path:'/best-online-phonics-classes-for-kids-in-india', impressions:43, role:'commercial-comparison' }),
]);

export const COMMERCIAL_C1_SOURCE_STATUS = freeze({
  authenticatedQueryLevelGsc: 'unavailable-in-this-execution',
  rule: 'Never fabricate current rank, query impressions or CTR when authenticated query-level GSC data is unavailable.',
  availableEvidence: freezeList([
    'current Tiny Steps public SERP surfaces',
    'fresh commercial SERP observations on 2026-09-10',
    'five user-provided Google Search Generative AI Features exports covering May-Sep 2026',
    'frozen knowledge-base architecture',
    'C0 commercial facts and lead-measurement contract',
  ]),
});

export const COMMERCIAL_C1_POLICY = freeze({
  researchOnly: true,
  titleChangesAllowed: false,
  h1ChangesAllowed: false,
  copyChangesAllowed: false,
  newUrlsAllowed: false,
  canonicalKeywordOwnershipAllowed: false,
  ownershipBeginsAt: 'C2',
  allowedActions: freezeList<ResearchAction>(['KEEP','OPTIMISE','CONSOLIDATE','BUILD','HOLD']),
  rule: 'C1 discovers and classifies the parent commercial search universe. C2, not C1, assigns canonical keyword ownership or authorizes architecture changes.',
});

export function getCommercialC1Snapshot() {
  return freeze({
    revision: COMMERCIAL_C1_REVISION,
    status: COMMERCIAL_C1_STATUS,
    keywords: COMMERCIAL_C1_KEYWORD_UNIVERSE,
    aiVisibility: COMMERCIAL_C1_AI_VISIBILITY,
    aiTopSurfacesSep: COMMERCIAL_C1_AI_TOP_SURFACES_SEP,
    sourceStatus: COMMERCIAL_C1_SOURCE_STATUS,
    policy: COMMERCIAL_C1_POLICY,
  });
}

if (COMMERCIAL_C0_STATUS !== 'frozen') throw new Error('C1 requires frozen C0 foundation.');
if (!COMMERCIAL_C1_KEYWORD_UNIVERSE.length) throw new Error('C1 keyword universe cannot be empty.');
if (COMMERCIAL_C1_KEYWORD_UNIVERSE.some((item) => !item.subject || !item.intent || !item.parentStage || !item.recommendedAction)) {
  throw new Error('C1 requires every researched query to be fully classified.');
}
if (COMMERCIAL_C1_KEYWORD_UNIVERSE.some((item) => item.currentRank !== null || item.impressions !== null || item.ctr !== null)) {
  throw new Error('C1 must not invent authenticated GSC metrics.');
}
