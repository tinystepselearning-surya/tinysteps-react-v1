import { COMMERCIAL_C2_OWNERSHIP_CLUSTERS, COMMERCIAL_C2_STATUS } from './commercialC2KeywordOwnership';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const COMMERCIAL_C3_REVISION = '2026-09-10-c3-r1';
export const COMMERCIAL_C3_STATUS = 'implementation-in-progress';

export type CommercialC3AuditAction = 'PROTECT' | 'STRENGTHEN' | 'REPAIR';
export type CommercialC3SignalStatus = 'strong' | 'adequate' | 'needs-strengthening';

export type CommercialC3OwnerAudit = {
  clusterId: string;
  ownerPath: string;
  sourcePath: string;
  priority: 'P1' | 'P2' | 'P3';
  action: CommercialC3AuditAction;
  seo: CommercialC3SignalStatus;
  aeo: CommercialC3SignalStatus;
  geo: CommercialC3SignalStatus;
  conversion: CommercialC3SignalStatus;
  schema: CommercialC3SignalStatus;
  highIntent: CommercialC3SignalStatus;
  requiredSignals: readonly string[];
  protectedSignals: readonly string[];
  rationale: string;
};

const audit = (value: CommercialC3OwnerAudit) => freeze({
  ...value,
  requiredSignals: freezeList(value.requiredSignals),
  protectedSignals: freezeList(value.protectedSignals),
});

/**
 * C3 audits the 15 C2 ownership clusters across 14 unique owner pages.
 * `/speaking` appears twice because it owns both public-speaking and general
 * communication commercial intent. A PROTECT decision is intentional: winning
 * pages are not rewritten merely to create churn.
 */
export const COMMERCIAL_C3_OWNER_PAGE_AUDITS = freezeList<CommercialC3OwnerAudit>([
  audit({ clusterId:'phonics-provider', ownerPath:'/phonics', sourcePath:'src/pages/phonics.tsx', priority:'P1', action:'PROTECT', seo:'strong', aeo:'strong', geo:'adequate', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['online phonics classes for kids','live 1:1','free 35-minute assessment','blending and decoding'], protectedSignals:['proven canonical','existing high-intent title','Course + FAQ structured data','parent problem sections'], rationale:'Highest-maturity commercial owner in C1 evidence. Preserve established title, canonical and broad provider positioning; avoid unnecessary rewrite risk.' }),
  audit({ clusterId:'phonics-comparison', ownerPath:'/best-online-phonics-classes-for-kids-in-india', sourcePath:'src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx', priority:'P1', action:'PROTECT', seo:'strong', aeo:'strong', geo:'adequate', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['best online phonics classes','provider comparison','1:1 vs group','fees and demo questions'], protectedSignals:['comparison framework','provider scorecard','transparent Tiny Steps evidence','no unsupported #1 claim'], rationale:'Dedicated comparison intent already earns first-party Google/Bing visibility and is differentiated from the generic phonics owner.' }),
  audit({ clusterId:'phonics-price', ownerPath:'/phonics-fees-india', sourcePath:'src/pages/public/PhonicsFeesIndiaPage.tsx', priority:'P1', action:'REPAIR', seo:'strong', aeo:'strong', geo:'adequate', conversion:'strong', schema:'needs-strengthening', highIntent:'strong', requiredSignals:['phonics class fees India','₹400 per live 1:1 class','35-minute standard class','price comparison context'], protectedSignals:['market fee bands','quality checks','assessment-first guidance'], rationale:'Strong price-research content, but public duration drift must be corrected from 35–40 to exactly 35 minutes and page semantics strengthened.' }),
  audit({ clusterId:'reading-provider', ownerPath:'/reading-classes-for-kids', sourcePath:'src/pages/public/ReadingClassesForKidsPage.tsx', priority:'P2', action:'PROTECT', seo:'strong', aeo:'strong', geo:'adequate', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['online reading classes for kids','reading tutor','struggling readers','decoding to comprehension'], protectedSignals:['reading SEO query set','WebPage + pathway schema','quality criteria','fluency boundary'], rationale:'Source is already comprehensive and correctly separates broad reading intent from specialist fluency intent; weak ranking is not evidence that wholesale rewriting is needed.' }),
  audit({ clusterId:'reading-fluency', ownerPath:'/reading-fluency-program', sourcePath:'src/pages/public/ReadingFluencyProgramPage.tsx', priority:'P3', action:'STRENGTHEN', seo:'adequate', aeo:'strong', geo:'needs-strengthening', conversion:'adequate', schema:'needs-strengthening', highIntent:'adequate', requiredSignals:['reading fluency classes for kids online','live 1:1','35-minute class','India and worldwide','Course schema'], protectedSignals:['explicit fluency-only positioning','slow-reader diagnostic boundary','reading owner links'], rationale:'Useful specialist content but currently only FAQ structured data and limited commercial/international signals.' }),
  audit({ clusterId:'grammar-provider', ownerPath:'/grammar', sourcePath:'src/pages/grammar.tsx', priority:'P2', action:'PROTECT', seo:'strong', aeo:'strong', geo:'adequate', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['online grammar classes for kids','sentence formation','school answers','free 35-minute assessment'], protectedSignals:['Course + pathway schema','answer-first grammar sections','writing boundary','spoken-English cross-link'], rationale:'Structurally strong canonical grammar programme. Protect title/canonical while downstream content links can support international discovery without changing ownership.' }),
  audit({ clusterId:'writing-provider', ownerPath:'/writing-classes-for-kids', sourcePath:'src/pages/public/WritingClassesForKidsPage.tsx', priority:'P2', action:'STRENGTHEN', seo:'adequate', aeo:'strong', geo:'needs-strengthening', conversion:'adequate', schema:'needs-strengthening', highIntent:'needs-strengthening', requiredSignals:['creative writing classes for kids online','online writing classes for kids','1:1 writing support','India and worldwide','Course schema'], protectedSignals:['sentence-to-paragraph progression','school writing transfer','editing feedback loop'], rationale:'Strong educational content but the dedicated owner under-represents creative-writing/provider language and lacks Course semantics.' }),
  audit({ clusterId:'spoken-english-provider', ownerPath:'/spoken-english-classes-for-kids-online', sourcePath:'src/pages/public/SpokenEnglishClassesForKidsPage.tsx', priority:'P2', action:'STRENGTHEN', seo:'strong', aeo:'strong', geo:'adequate', conversion:'strong', schema:'strong', highIntent:'adequate', requiredSignals:['spoken English classes for kids online','1:1 spoken English','English fluency','NRI and worldwide families','spoken English vs public speaking'], protectedSignals:['Course + FAQ schema','₹400/₹4,800 clarity','sentence-expansion problem framing'], rationale:'Core page is sound; strengthen international/NRI and provider-query language while keeping public-speaking intent on /speaking.' }),
  audit({ clusterId:'public-speaking-provider', ownerPath:'/speaking', sourcePath:'src/pages/speaking.tsx', priority:'P2', action:'PROTECT', seo:'strong', aeo:'strong', geo:'adequate', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['public speaking classes for kids','storytelling','presentation confidence','free 35-minute assessment'], protectedSignals:['Course + pathway schema','communication-rich H1','existing GSC visibility'], rationale:'Existing /speaking page is a proven commercial programme owner and already covers public-speaking intent comprehensively.' }),
  audit({ clusterId:'communication-provider', ownerPath:'/speaking', sourcePath:'src/pages/speaking.tsx', priority:'P2', action:'PROTECT', seo:'strong', aeo:'strong', geo:'adequate', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['communication classes for kids','clear expression','structured answers','speaking confidence'], protectedSignals:['Public Speaking & Communication H1','communication confidence sections','storytelling and school-speaking coverage'], rationale:'The same /speaking page already expresses general communication intent; C3 protects it and keeps the legacy combined page from becoming a second owner.' }),
  audit({ clusterId:'confidence-building', ownerPath:'/confidence-building-program-kids', sourcePath:'src/pages/public/ConfidenceBuildingProgramKidsPage.tsx', priority:'P3', action:'STRENGTHEN', seo:'adequate', aeo:'strong', geo:'needs-strengthening', conversion:'adequate', schema:'needs-strengthening', highIntent:'adequate', requiredSignals:['confidence building classes for kids','online confidence programme','live 1:1','35-minute assessment','specialist boundary to /speaking'], protectedSignals:['shyness vs confidence distinction','structured communication pathway'], rationale:'Specialist intent is useful but needs Course/WebPage semantics, clearer commercial programme facts and an explicit boundary from broad communication classes.' }),
  audit({ clusterId:'broad-english-provider', ownerPath:'/online-english-classes-for-kids', sourcePath:'src/pages/public/OnlineEnglishClassesForKidsPage.tsx', priority:'P1', action:'STRENGTHEN', seo:'strong', aeo:'strong', geo:'adequate', conversion:'strong', schema:'strong', highIntent:'adequate', requiredSignals:['online English classes for kids','online English tutor for kids','1:1 English classes','NRI families','UAE USA UK Australia Singapore'], protectedSignals:['global programme chooser','India and worldwide canonical','transparent pricing','Course schema'], rationale:'Strong broad programme owner; strengthen international/NRI/tutor language so six-market C1 research resolves semantically without creating country pages.' }),
  audit({ clusterId:'broad-english-hyderabad', ownerPath:'/online-english-classes-hyderabad', sourcePath:'src/pages/public/OnlineEnglishClassesHyderabadPage.tsx', priority:'P1', action:'PROTECT', seo:'strong', aeo:'strong', geo:'strong', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['online English classes Hyderabad','online-only local context','free 35-minute assessment','₹400 pricing preview'], protectedSignals:['Service schema','Hyderabad areaServed','local-vs-global boundary','no physical-centre claim'], rationale:'Established evidence-backed local owner already has strong local semantics. Protect from generic/global expansion.' }),
  audit({ clusterId:'english-tutor-provider', ownerPath:'/online-english-classes-for-kids', sourcePath:'src/pages/public/OnlineEnglishClassesForKidsPage.tsx', priority:'P2', action:'STRENGTHEN', seo:'strong', aeo:'strong', geo:'adequate', conversion:'strong', schema:'strong', highIntent:'needs-strengthening', requiredSignals:['online English tutor for kids','live 1:1 English tutor','teacher-led personalised support'], protectedSignals:['broad programme chooser','assessment-first path'], rationale:'Generic tutor intent shares the broad English owner; add natural tutor-language rather than launch a competing tutor URL.' }),
  audit({ clusterId:'general-pricing', ownerPath:'/pricing', sourcePath:'src/pages/PricingPage.tsx', priority:'P1', action:'PROTECT', seo:'strong', aeo:'strong', geo:'adequate', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['₹400 per standard 1:1 class','₹4,800 for 12 classes','free demo before enrolment','1:1 vs group value'], protectedSignals:['central pricing config','OfferCatalog','pricing FAQ','programme links'], rationale:'Strong cross-programme pricing hub using centralized price facts. Preserve rather than duplicate subject-specific fee ownership beyond phonics.' }),
  audit({ clusterId:'free-demo-booking', ownerPath:'/book-demo', sourcePath:'src/pages/public/BookDemoPage.tsx', priority:'P1', action:'PROTECT', seo:'strong', aeo:'strong', geo:'adequate', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['free 35-minute 1:1 demo assessment','no commitment','programme recommendation','assessment booking form'], protectedSignals:['Service Offer price 0','WebPage + breadcrumb + decision schema','conversion attribution'], rationale:'Transactional owner is already purpose-built for demo/assessment intent and conversion measurement. Avoid distracting SEO copy changes.' }),
]);

export const COMMERCIAL_C3_UNIQUE_OWNER_PATHS = freezeList(
  Array.from(new Set(COMMERCIAL_C3_OWNER_PAGE_AUDITS.map((entry) => entry.ownerPath))),
);

export const COMMERCIAL_C3_POLICY = freeze({
  c2Required: true,
  expectedClusterAudits: 15,
  expectedUniqueOwnerPages: 14,
  countryPagesCreated: 0,
  aiPromptPagesCreated: 0,
  faqPolicy: 'Visible FAQs may improve parent clarity and answer extraction, but C3 does not rely on Google FAQ rich results.',
  geoPolicy: 'No special GEO markup is treated as a ranking shortcut; C3 uses crawlable, factual, answer-first content and descriptive structured data.',
});

if (COMMERCIAL_C2_STATUS !== 'ownership-complete') throw new Error('C3 requires completed C2 ownership.');
if (COMMERCIAL_C3_OWNER_PAGE_AUDITS.length !== COMMERCIAL_C3_POLICY.expectedClusterAudits) throw new Error('C3 must audit all 15 C2 clusters.');
if (COMMERCIAL_C3_UNIQUE_OWNER_PATHS.length !== COMMERCIAL_C3_POLICY.expectedUniqueOwnerPages) throw new Error('C3 must audit 14 unique commercial owner pages.');
for (const owner of COMMERCIAL_C2_OWNERSHIP_CLUSTERS) {
  if (COMMERCIAL_C3_OWNER_PAGE_AUDITS.filter((entry) => entry.clusterId === owner.id).length !== 1) {
    throw new Error(`C3 audit missing or duplicating C2 cluster ${owner.id}`);
  }
}
