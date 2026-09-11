import { COMMERCIAL_C1_STATUS } from './commercialC1SearchUniverse';
import { COMMERCIAL_C1_ENHANCEMENT_STATUS } from './commercialC1InternationalAiResearch';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const COMMERCIAL_C1_OBSERVED_EVIDENCE_REVISION = '2026-09-10-c1-r3';
export const COMMERCIAL_C1_OBSERVED_EVIDENCE_STATUS = 'evidence-complete';

export type SearchEvidenceSource = 'google-gsc-web' | 'bing-web' | 'bing-ai';

export type ObservedQueryMetric = {
  source: SearchEvidenceSource;
  query: string;
  clicks: number | null;
  impressions: number | null;
  ctr: number | null;
  position: number | null;
  citations: number | null;
  citationShare: number | null;
  intent?: string | null;
  topic?: string | null;
};

export type ObservedPageMetric = {
  source: SearchEvidenceSource;
  path: string;
  clicks: number | null;
  impressions: number | null;
  ctr: number | null;
  position: number | null;
  citations: number | null;
};

export const COMMERCIAL_C1_GSC_EXPORT = freeze({
  sourceFile: 'tinystepslearning.com-Performance-on-Search-2026-09-10.zip',
  searchType: 'Web',
  filterLabel: 'Last 3 months',
  observedFrom: '2026-06-09',
  observedThrough: '2026-09-08',
  observedDays: 92,
  queryRows: 1000,
  pageRows: 181,
  countryRows: 212,
  clicks: 6612,
  impressions: 107515,
  ctr: 0.0615,
  impressionWeightedPosition: 7.55,
  note: 'Totals come from Chart.csv. The 1,000-row query table is a dimensioned extract and should not be expected to sum to whole-property totals.',
});

export const COMMERCIAL_C1_GSC_COMMERCIAL_FAMILY_EVIDENCE = freezeList([
  freeze({ family:'phonics', queryRows:103, impressions:7604, clicks:124 }),
  freeze({ family:'broad_english', queryRows:86, impressions:1216, clicks:21 }),
  freeze({ family:'public_speaking', queryRows:22, impressions:502, clicks:3 }),
  freeze({ family:'spoken_english', queryRows:31, impressions:465, clicks:2 }),
  freeze({ family:'reading', queryRows:30, impressions:465, clicks:8 }),
  freeze({ family:'grammar', queryRows:5, impressions:29, clicks:0 }),
  freeze({ family:'writing_classes', queryRows:6, impressions:30, clicks:2 }),
  freeze({ family:'communication', queryRows:2, impressions:12, clicks:1 }),
]);

export const COMMERCIAL_C1_GSC_FAMILY_METHOD = freeze({
  definition: 'Commercial family rows require a programme term plus a commercial token such as class, course, tutor, tuition, programme, fee/cost/price, demo/trial or near-me. Obvious game, worksheet, tracing and practice queries are excluded.',
  overlapWarning: 'Families intentionally overlap; broad English can include spoken-English or subject combinations. Do not sum family totals into a site total.',
});

export const COMMERCIAL_C1_GSC_CORE_QUERY_EVIDENCE = freezeList<ObservedQueryMetric>([
  freeze({ source:'google-gsc-web', query:'phonics classes', clicks:6, impressions:1056, ctr:0.0057, position:4.88, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'phonics classes online', clicks:18, impressions:764, ctr:0.0236, position:4.86, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'best phonics classes online', clicks:16, impressions:600, ctr:0.0267, position:2.42, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'phonics classes for kids', clicks:3, impressions:511, ctr:0.0059, position:4.71, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'online phonics classes for kids', clicks:11, impressions:443, ctr:0.0248, position:6.98, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'online phonics classes', clicks:3, impressions:359, ctr:0.0084, position:9.19, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'phonics online classes for kids', clicks:4, impressions:315, ctr:0.0127, position:1.81, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'phonics classes for kids near me', clicks:0, impressions:315, ctr:0, position:10.37, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'best online phonics classes for kids in india', clicks:6, impressions:172, ctr:0.0349, position:10.59, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'best online phonics classes in india', clicks:6, impressions:166, ctr:0.0361, position:2.14, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'best online phonics classes in india with fees', clicks:11, impressions:117, ctr:0.094, position:2.72, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'online phonics classes fees', clicks:0, impressions:25, ctr:0, position:25.84, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'phonics classes near me with fees', clicks:1, impressions:12, ctr:0.0833, position:4.33, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'online english classes for kids', clicks:5, impressions:98, ctr:0.051, position:9.41, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'english online classes for kids', clicks:3, impressions:73, ctr:0.0411, position:8.77, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'english classes for kids near me', clicks:1, impressions:62, ctr:0.0161, position:8.27, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'best online english classes for kids', clicks:1, impressions:15, ctr:0.0667, position:5.4, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'online english classes for kids in india', clicks:0, impressions:16, ctr:0, position:12.88, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'online reading classes for kids', clicks:1, impressions:38, ctr:0.0263, position:12.76, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'reading classes for kids near me', clicks:0, impressions:50, ctr:0, position:6.14, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'online grammar classes for kids', clicks:0, impressions:4, ctr:0, position:7.25, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'spoken english classes for kids online', clicks:0, impressions:10, ctr:0, position:7.2, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'public speaking classes for kids', clicks:0, impressions:74, ctr:0, position:23.59, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'public speaking classes for kids online india', clicks:1, impressions:16, ctr:0.0625, position:10.44, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'public speaking classes for kids usa', clicks:0, impressions:22, ctr:0, position:54.73, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'communication classes for kids', clicks:1, impressions:9, ctr:0.1111, position:17.22, citations:null, citationShare:null }),
  freeze({ source:'google-gsc-web', query:'what online course helps a 6-year-old in jeddah move from memorizing english words to speaking complete sentences?', clicks:0, impressions:11, ctr:0, position:3.45, citations:null, citationShare:null }),
]);

export const COMMERCIAL_C1_GSC_COMMERCIAL_PAGE_EVIDENCE = freezeList<ObservedPageMetric>([
  freeze({ source:'google-gsc-web', path:'/phonics', clicks:371, impressions:11306, ctr:0.0328, position:4.86, citations:null }),
  freeze({ source:'google-gsc-web', path:'/best-online-phonics-classes-for-kids-in-india', clicks:101, impressions:3835, ctr:0.0263, position:8.69, citations:null }),
  freeze({ source:'google-gsc-web', path:'/online-english-classes-hyderabad', clicks:86, impressions:3556, ctr:0.0242, position:7.94, citations:null }),
  freeze({ source:'google-gsc-web', path:'/speaking', clicks:62, impressions:2602, ctr:0.0238, position:9.1, citations:null }),
  freeze({ source:'google-gsc-web', path:'/pricing', clicks:16, impressions:1551, ctr:0.0103, position:5.09, citations:null }),
  freeze({ source:'google-gsc-web', path:'/grammar', clicks:12, impressions:811, ctr:0.0148, position:7.08, citations:null }),
  freeze({ source:'google-gsc-web', path:'/online-english-classes-for-kids', clicks:8, impressions:359, ctr:0.0223, position:9.86, citations:null }),
  freeze({ source:'google-gsc-web', path:'/phonics-fees-india', clicks:6, impressions:308, ctr:0.0195, position:7.78, citations:null }),
  freeze({ source:'google-gsc-web', path:'/spoken-english-classes-for-kids-online', clicks:2, impressions:233, ctr:0.0086, position:11.41, citations:null }),
  freeze({ source:'google-gsc-web', path:'/reading-classes-for-kids', clicks:2, impressions:71, ctr:0.0282, position:17.15, citations:null }),
  freeze({ source:'google-gsc-web', path:'/book-demo', clicks:0, impressions:39, ctr:0, position:3.72, citations:null }),
  freeze({ source:'google-gsc-web', path:'/reading-fluency-program', clicks:0, impressions:23, ctr:0, position:12.96, citations:null }),
  freeze({ source:'google-gsc-web', path:'/online-english-classes-for-kids-india', clicks:0, impressions:8, ctr:0, position:15.25, citations:null }),
  freeze({ source:'google-gsc-web', path:'/writing-classes-for-kids', clicks:0, impressions:4, ctr:0, position:7.25, citations:null }),
  freeze({ source:'google-gsc-web', path:'/confidence-building-program-kids', clicks:0, impressions:3, ctr:0, position:13.33, citations:null }),
]);

export const COMMERCIAL_C1_GSC_PRIORITY_COUNTRIES = freezeList([
  freeze({ country:'India', clicks:1909, impressions:33025, ctr:0.0578, position:6.87 }),
  freeze({ country:'United States', clicks:1587, impressions:26641, ctr:0.0596, position:8.39 }),
  freeze({ country:'United Kingdom', clicks:264, impressions:5254, ctr:0.0502, position:9.57 }),
  freeze({ country:'Australia', clicks:280, impressions:3873, ctr:0.0723, position:8.2 }),
  freeze({ country:'United Arab Emirates', clicks:104, impressions:1700, ctr:0.0612, position:6.46 }),
  freeze({ country:'Singapore', clicks:73, impressions:1041, ctr:0.0701, position:6.77 }),
]);

export const COMMERCIAL_C1_BING_WEB_EXPORT = freeze({
  keywordSourceFile: 'tinystepslearning.com_KeywordReport_9_10_2026.csv',
  pageSourceFile: 'tinystepslearning.com_PageTrafficReport_9_10_2026.csv',
  reportPeriod: null,
  reportPeriodRule: 'The exported CSVs do not encode their selected date range, so C1 must not compare Bing totals directly with the 92-day Google totals.',
  keywordRows: 830,
  keywordDimensionClicks: 426,
  keywordDimensionImpressions: 3167,
  pageRows: 59,
  pageDimensionClicks: 514,
  pageDimensionImpressions: 9509,
});

export const COMMERCIAL_C1_BING_CORE_QUERY_EVIDENCE = freezeList<ObservedQueryMetric>([
  freeze({ source:'bing-web', query:'best phonics class for kids', clicks:0, impressions:14, ctr:0, position:2.7857, citations:null, citationShare:null }),
  freeze({ source:'bing-web', query:'phonics classes online', clicks:0, impressions:9, ctr:0, position:5.2222, citations:null, citationShare:null }),
  freeze({ source:'bing-web', query:'online phonics classes', clicks:1, impressions:8, ctr:0.125, position:2.625, citations:null, citationShare:null }),
  freeze({ source:'bing-web', query:'phonics class demo questions parents should ask', clicks:0, impressions:8, ctr:0, position:3, citations:null, citationShare:null }),
  freeze({ source:'bing-web', query:'cost of phonics classes in india', clicks:0, impressions:8, ctr:0, position:3.25, citations:null, citationShare:null }),
  freeze({ source:'bing-web', query:'phonics classes for kids', clicks:0, impressions:7, ctr:0, position:2.8571, citations:null, citationShare:null }),
  freeze({ source:'bing-web', query:'english classes 1-1 for kids india', clicks:1, impressions:6, ctr:0.1667, position:1.5, citations:null, citationShare:null }),
  freeze({ source:'bing-web', query:'review of tiny steps online english courses', clicks:1, impressions:5, ctr:0.2, position:5.8, citations:null, citationShare:null }),
  freeze({ source:'bing-web', query:'one on one english classes for 7 years old child', clicks:1, impressions:2, ctr:0.5, position:3.5, citations:null, citationShare:null }),
  freeze({ source:'bing-web', query:'online public speaking course outline for kids india', clicks:0, impressions:4, ctr:0, position:5.5, citations:null, citationShare:null }),
  freeze({ source:'bing-web', query:'communication confidence building program steps', clicks:0, impressions:4, ctr:0, position:1, citations:null, citationShare:null }),
]);

export const COMMERCIAL_C1_BING_COMMERCIAL_PAGE_EVIDENCE = freezeList<ObservedPageMetric>([
  freeze({ source:'bing-web', path:'/phonics', clicks:11, impressions:236, ctr:0.0466, position:3.6525, citations:null }),
  freeze({ source:'bing-web', path:'/best-online-phonics-classes-for-kids-in-india', clicks:1, impressions:16, ctr:0.0625, position:4.0625, citations:null }),
  freeze({ source:'bing-web', path:'/phonics-fees-india', clicks:1, impressions:15, ctr:0.0667, position:2.6, citations:null }),
  freeze({ source:'bing-web', path:'/online-english-classes-for-kids', clicks:2, impressions:14, ctr:0.1429, position:4.0714, citations:null }),
  freeze({ source:'bing-web', path:'/speaking', clicks:1, impressions:5, ctr:0.2, position:7.4, citations:null }),
  freeze({ source:'bing-web', path:'/grammar', clicks:1, impressions:1, ctr:1, position:1, citations:null }),
  freeze({ source:'bing-web', path:'/reading-fluency-program', clicks:0, impressions:1, ctr:0, position:9, citations:null }),
  freeze({ source:'bing-web', path:'/online-english-classes-for-kids-india', clicks:0, impressions:1, ctr:0, position:10, citations:null }),
]);

export const COMMERCIAL_C1_BING_AI_EXPORT = freeze({
  querySourceFile: 'tinystepslearning.com_AISearchQueriesReport_9_10_2026.csv',
  pageSourceFile: 'tinystepslearning.com_AIPageStatsReport_9_10_2026.csv',
  groundingQueryRows: 31,
  aiPageRows: 71,
  groundingQueryCitations: 1405,
  aiPageCitations: 2962,
  reportPeriod: null,
  reportPeriodRule: 'The AI CSVs do not encode their selected date range; citation counts are retained as observed evidence without time-normalized comparison.',
});

export const COMMERCIAL_C1_BING_AI_QUERY_EVIDENCE = freezeList<ObservedQueryMetric>([
  freeze({ source:'bing-ai', query:'tiny steps learning', clicks:null, impressions:null, ctr:null, position:null, citations:742, citationShare:0.7844, intent:'Navigational', topic:'Language Courses & Tutoring' }),
  freeze({ source:'bing-ai', query:'beginner phonics program age range', clicks:null, impressions:null, ctr:null, position:null, citations:26, citationShare:0.4333, intent:'Informational', topic:'Language Courses & Tutoring' }),
  freeze({ source:'bing-ai', query:'phonics classes for kids', clicks:null, impressions:null, ctr:null, position:null, citations:25, citationShare:0.1623, intent:'Informational', topic:'K-12 Education' }),
  freeze({ source:'bing-ai', query:'online phonics classes', clicks:null, impressions:null, ctr:null, position:null, citations:24, citationShare:0.2034, intent:'Informational', topic:'Language Courses & Tutoring' }),
  freeze({ source:'bing-ai', query:'grammar games for kids', clicks:null, impressions:null, ctr:null, position:null, citations:12, citationShare:0.2, intent:null, topic:null }),
]);

export const COMMERCIAL_C1_BING_AI_PAGE_EVIDENCE = freezeList<ObservedPageMetric>([
  freeze({ source:'bing-ai', path:'/', clicks:null, impressions:null, ctr:null, position:null, citations:339 }),
  freeze({ source:'bing-ai', path:'/courses', clicks:null, impressions:null, ctr:null, position:null, citations:241 }),
  freeze({ source:'bing-ai', path:'/phonics', clicks:null, impressions:null, ctr:null, position:null, citations:120 }),
  freeze({ source:'bing-ai', path:'/online-english-classes-for-kids', clicks:null, impressions:null, ctr:null, position:null, citations:34 }),
  freeze({ source:'bing-ai', path:'/best-online-phonics-classes-for-kids-in-india', clicks:null, impressions:null, ctr:null, position:null, citations:17 }),
  freeze({ source:'bing-ai', path:'/speaking', clicks:null, impressions:null, ctr:null, position:null, citations:15 }),
  freeze({ source:'bing-ai', path:'/reading-classes-for-kids', clicks:null, impressions:null, ctr:null, position:null, citations:3 }),
  freeze({ source:'bing-ai', path:'/pricing', clicks:null, impressions:null, ctr:null, position:null, citations:2 }),
]);

export const COMMERCIAL_C1_OBSERVED_SEARCH_FINDINGS = freezeList([
  'Phonics is the only currently mature commercial search family: Google exposes 103 commercial phonics rows in the top-1,000 query export and 7,604 impressions across those classified rows.',
  'The Google phonics opportunity is primarily click capture and intent alignment, not basic discoverability: large class terms already rank on page one but have low CTR.',
  'The query “best online phonics classes in india with fees” is unusually valuable: 117 Google impressions, 11 clicks, 9.4% CTR and average position 2.72.',
  'Broad English has emerging Google demand; reading, public speaking and spoken English are visible but materially weaker; grammar, writing-class and communication demand is still thin in the current top-1,000 extract.',
  'International visibility is already substantial at the country level even though country-modified commercial queries are sparse: USA, UK, Australia, UAE and Singapore all generate meaningful whole-site Google traffic.',
  'Bing web corroborates phonics commercial relevance, including online phonics, cost, demo-question and 1:1 English variants.',
  'Bing AI already grounds on Tiny Steps for “phonics classes for kids” and “online phonics classes”, so AI commercial visibility is observed rather than hypothetical.',
  'Bing AI citations remain concentrated in free resources, homepage/courses and phonics; writing, spoken-English and book-demo surfaces have no observed citation presence in the supplied AI page export.',
]);

export const COMMERCIAL_C1_FINAL_SOURCE_STATUS = freeze({
  googleQueryLevelEvidence: 'available-from-user-export',
  googlePageLevelEvidence: 'available-from-user-export',
  googleCountryEvidence: 'available-from-user-export',
  bingKeywordEvidence: 'available-from-user-export',
  bingPageEvidence: 'available-from-user-export',
  bingAiGroundingEvidence: 'available-from-user-export',
  conversionEvidence: 'declared-operating-priors-only',
  ownershipDecision: 'deferred-to-C2',
  publicImplementationAllowed: false,
});

export function getCommercialC1ObservedEvidenceSnapshot() {
  return freeze({
    revision: COMMERCIAL_C1_OBSERVED_EVIDENCE_REVISION,
    status: COMMERCIAL_C1_OBSERVED_EVIDENCE_STATUS,
    gsc: COMMERCIAL_C1_GSC_EXPORT,
    gscFamilies: COMMERCIAL_C1_GSC_COMMERCIAL_FAMILY_EVIDENCE,
    gscQueries: COMMERCIAL_C1_GSC_CORE_QUERY_EVIDENCE,
    gscPages: COMMERCIAL_C1_GSC_COMMERCIAL_PAGE_EVIDENCE,
    gscCountries: COMMERCIAL_C1_GSC_PRIORITY_COUNTRIES,
    bingWeb: COMMERCIAL_C1_BING_WEB_EXPORT,
    bingQueries: COMMERCIAL_C1_BING_CORE_QUERY_EVIDENCE,
    bingPages: COMMERCIAL_C1_BING_COMMERCIAL_PAGE_EVIDENCE,
    bingAi: COMMERCIAL_C1_BING_AI_EXPORT,
    bingAiQueries: COMMERCIAL_C1_BING_AI_QUERY_EVIDENCE,
    bingAiPages: COMMERCIAL_C1_BING_AI_PAGE_EVIDENCE,
    findings: COMMERCIAL_C1_OBSERVED_SEARCH_FINDINGS,
    sourceStatus: COMMERCIAL_C1_FINAL_SOURCE_STATUS,
  });
}

if (COMMERCIAL_C1_STATUS !== 'research-complete') throw new Error('Observed evidence requires base C1 research.');
if (COMMERCIAL_C1_ENHANCEMENT_STATUS !== 'research-complete') throw new Error('Observed evidence requires international/AI C1 enhancement.');
if (COMMERCIAL_C1_GSC_EXPORT.queryRows !== 1000 || COMMERCIAL_C1_GSC_EXPORT.clicks !== 6612 || COMMERCIAL_C1_GSC_EXPORT.impressions !== 107515) throw new Error('GSC export contract drifted.');
if (COMMERCIAL_C1_BING_WEB_EXPORT.keywordRows !== 830 || COMMERCIAL_C1_BING_AI_EXPORT.groundingQueryRows !== 31) throw new Error('Bing export contract drifted.');
if (!COMMERCIAL_C1_BING_AI_QUERY_EVIDENCE.some((row) => row.query === 'online phonics classes' && row.citations === 24)) throw new Error('Bing AI commercial evidence missing.');
if (COMMERCIAL_C1_FINAL_SOURCE_STATUS.ownershipDecision !== 'deferred-to-C2') throw new Error('C1 cannot assign canonical ownership.');
