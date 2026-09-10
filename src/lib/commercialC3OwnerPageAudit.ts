import { COMMERCIAL_C2_OWNERSHIP_CLUSTERS, COMMERCIAL_C2_STATUS } from './commercialC2KeywordOwnership';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const COMMERCIAL_C3_REVISION = '2026-09-11-c3-r4';
export const COMMERCIAL_C3_STATUS = 'implementation-complete';
export const COMMERCIAL_C3_RECONCILIATION_STATUS = '15-of-15-reconciled';

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
 * Final C3 reconciliation after all 15 user-facing commercial ownership
 * boundaries were reviewed one-by-one. C2 remains the authority for query
 * ownership; C3 records the implemented page contract and must not create a
 * second owner for a researched cluster.
 */
export const COMMERCIAL_C3_OWNER_PAGE_AUDITS = freezeList<CommercialC3OwnerAudit>([
  audit({ clusterId:'phonics-provider', ownerPath:'/phonics', sourcePath:'src/pages/phonics.tsx', priority:'P1', action:'STRENGTHEN', seo:'strong', aeo:'strong', geo:'strong', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['online phonics classes for kids','live 1:1','ages 3–12','India and worldwide','35-minute standard 1:1'], protectedSignals:['self-canonical /phonics','generic phonics ownership','comparison handoff','fees handoff'], rationale:'Generic phonics remains on /phonics while best/comparison and fee/cost searches are handed to their dedicated owners. The page was strengthened for worldwide reach and source-level canonical facts.' }),
  audit({ clusterId:'phonics-comparison', ownerPath:'/best-online-phonics-classes-for-kids-in-india', sourcePath:'src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx', priority:'P1', action:'STRENGTHEN', seo:'strong', aeo:'strong', geo:'adequate', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['best online phonics classes for kids in India','provider comparison','1:1 vs group','publisher transparency'], protectedSignals:['self-canonical comparison owner','no unsupported #1 claim','scorecard/comparison framework','phonics-fee handoff'], rationale:'The established best/comparison owner keeps exact comparison intent, adds publisher transparency, and stops trying to own dedicated phonics fee searches.' }),
  audit({ clusterId:'phonics-price', ownerPath:'/phonics-fees-india', sourcePath:'src/pages/public/PhonicsFeesIndiaPage.tsx', priority:'P1', action:'REPAIR', seo:'strong', aeo:'strong', geo:'adequate', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['phonics class fees in India','₹400 standard live 1:1','35-minute standard 1:1','research benchmark'], protectedSignals:['August 2026 anonymised aggregate study','1:1 and group market bands','methodology disclosure','pricing and demo handoffs'], rationale:'The fee owner now renders canonical Tiny Steps pricing from source configuration and preserves the retained anonymised market benchmark without relying on build-time text replacement.' }),
  audit({ clusterId:'reading-provider', ownerPath:'/reading-classes-for-kids', sourcePath:'src/pages/public/ReadingClassesForKidsPage.tsx', priority:'P2', action:'STRENGTHEN', seo:'strong', aeo:'strong', geo:'strong', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['online reading classes for kids','reading tutor','struggling-reader support','India and worldwide'], protectedSignals:['generic reading owner','phonics boundary','specialist fluency handoff','writing handoff'], rationale:'Generic reading, tutor and near-me style class intent stays on /reading-classes-for-kids, while explicit fluency-programme intent is routed to the specialist fluency owner.' }),
  audit({ clusterId:'reading-fluency', ownerPath:'/reading-fluency-program', sourcePath:'src/pages/public/ReadingFluencyProgramPage.tsx', priority:'P3', action:'STRENGTHEN', seo:'strong', aeo:'strong', geo:'strong', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['reading fluency classes for kids online','live 1:1','35-minute class','India and worldwide'], protectedSignals:['fluency-only positioning','established-decoding fit','generic reading handoff','Course/WebPage schema'], rationale:'Explicit reading-fluency programme intent stays narrow: children whose decoding is reasonably secure but connected reading remains slow, hesitant or choppy.' }),
  audit({ clusterId:'grammar-provider', ownerPath:'/grammar', sourcePath:'src/pages/grammar.tsx', priority:'P2', action:'STRENGTHEN', seo:'strong', aeo:'strong', geo:'strong', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['online grammar classes for kids','sentence formation','35-minute live 1:1','India and worldwide'], protectedSignals:['Beginner Grammar ages 5–10 / 36 lessons','Advanced Grammar ages 8–12 / 36 lessons','writing boundary','spoken-English handoff'], rationale:'Grammar mechanics, sentence formation, tenses, punctuation and correction stay on /grammar; paragraph/creative-writing development is handed to /writing-classes-for-kids.' }),
  audit({ clusterId:'writing-provider', ownerPath:'/writing-classes-for-kids', sourcePath:'src/pages/public/WritingClassesForKidsPage.tsx', priority:'P2', action:'STRENGTHEN', seo:'strong', aeo:'strong', geo:'strong', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['creative writing classes for kids online','online writing classes for kids','live 1:1','India and worldwide'], protectedSignals:['idea-to-paragraph progression','story/school writing','editing and revision','grammar handoff'], rationale:'Writing owns idea development, paragraphs, stories, school writing, editing and independent expression while grammar mechanics stay on /grammar.' }),
  audit({ clusterId:'spoken-english-provider', ownerPath:'/spoken-english-classes-for-kids-online', sourcePath:'src/pages/public/SpokenEnglishClassesForKidsPage.tsx', priority:'P2', action:'STRENGTHEN', seo:'strong', aeo:'strong', geo:'strong', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['spoken English classes for kids online','conversational English','live 1:1','NRI and worldwide families'], protectedSignals:['everyday conversation owner','public-speaking handoff','grammar handoff','confidence-building handoff'], rationale:'Everyday spoken-English and conversational-fluency intent stays here; presentation/audience communication stays on /speaking and specialist confidence intent stays on its own owner.' }),
  audit({ clusterId:'public-speaking-provider', ownerPath:'/speaking', sourcePath:'src/pages/speaking.tsx', priority:'P2', action:'STRENGTHEN', seo:'strong', aeo:'strong', geo:'strong', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['public speaking classes for kids','storytelling','presentations','35-minute live 1:1'], protectedSignals:['Basic Public Speaking ages 4–7 / 36 lessons','Advanced Public Speaking ages 7–12 / 36 lessons','spoken-English handoff','confidence-building handoff'], rationale:'Public-speaking, storytelling, presentation and audience-facing communication intent stays on /speaking with the frozen two-level programme facts.' }),
  audit({ clusterId:'communication-provider', ownerPath:'/speaking', sourcePath:'src/pages/speaking.tsx', priority:'P2', action:'STRENGTHEN', seo:'strong', aeo:'strong', geo:'strong', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['communication skills classes for kids','structured answers','clear expression','speaking and communication'], protectedSignals:['same canonical as public speaking','no second communication URL','spoken-English boundary','confidence specialist exception'], rationale:'General communication skills share /speaking with public speaking; only explicit confidence-building programme intent is separated to the specialist page.' }),
  audit({ clusterId:'confidence-building', ownerPath:'/confidence-building-program-kids', sourcePath:'src/pages/public/ConfidenceBuildingProgramKidsPage.tsx', priority:'P3', action:'STRENGTHEN', seo:'strong', aeo:'strong', geo:'strong', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['confidence building classes for kids','speaking comfort','participation confidence','live 1:1'], protectedSignals:['commercial confidence-programme intent','shy-child informational handoff','public-speaking boundary','educational-not-clinical disclaimer'], rationale:'Confidence Building is kept deliberately narrow around speaking comfort, participation, prompting and independence rather than becoming a second general Speaking page.' }),
  audit({ clusterId:'broad-english-provider', ownerPath:'/online-english-classes-for-kids', sourcePath:'src/pages/public/OnlineEnglishClassesForKidsPage.tsx', priority:'P1', action:'STRENGTHEN', seo:'strong', aeo:'strong', geo:'strong', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['online English classes for kids','ages 3–12','live 1:1','India and worldwide'], protectedSignals:['global/NRI chooser','six programme-owner handoffs','Hyderabad local handoff','single worldwide canonical'], rationale:'Broad English and NRI/global intent stays on one chooser page that routes the child to the correct specialist owner after assessment.' }),
  audit({ clusterId:'broad-english-hyderabad', ownerPath:'/online-english-classes-hyderabad', sourcePath:'src/pages/public/OnlineEnglishClassesHyderabadPage.tsx', priority:'P1', action:'STRENGTHEN', seo:'strong', aeo:'strong', geo:'strong', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['online English classes for kids in Hyderabad','live online service','35-minute standard 1:1','Hyderabad service area'], protectedSignals:['broad local intent only','no physical-centre claim','subject-owner handoffs','self-canonical Hyderabad page'], rationale:'The local owner is explicitly an online service for Hyderabad families and no longer attempts to own subject-qualified Hyderabad queries that belong to programme pages.' }),
  audit({ clusterId:'english-tutor-provider', ownerPath:'/online-english-classes-for-kids', sourcePath:'src/pages/public/OnlineEnglishClassesForKidsPage.tsx', priority:'P2', action:'STRENGTHEN', seo:'strong', aeo:'strong', geo:'strong', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['online English tutor for kids','1 to 1 English tutor for kids online','individual teacher attention','assessment-led placement'], protectedSignals:['same URL as broad English','subject-qualified tutor handoffs','no competing tutor URL'], rationale:'Generic online English tutor intent is represented on the broad English owner without creating another URL; subject-qualified tutor searches continue to their programme owners.' }),
  audit({ clusterId:'general-pricing', ownerPath:'/pricing', sourcePath:'src/pages/PricingPage.tsx', priority:'P1', action:'REPAIR', seo:'strong', aeo:'strong', geo:'adequate', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['₹400 standard live 1:1','₹4,800 for 12 classes','small-group pricing','OfferCatalog'], protectedSignals:['canonical pricing configuration','1:1 vs group value comparison','Ultra Premium configured rates','phonics fee-research handoff'], rationale:'The pricing hub was rebuilt around canonical configuration, removing unsupported package benefits, payment guarantees and an incorrect game-subscription presentation.' }),
  audit({ clusterId:'free-demo-booking', ownerPath:'/book-demo', sourcePath:'src/pages/public/BookDemoPage.tsx', priority:'P1', action:'STRENGTHEN', seo:'strong', aeo:'strong', geo:'strong', conversion:'strong', schema:'strong', highIntent:'strong', requiredSignals:['free 35-minute 1:1 English assessment','one free assessment per child','programme recommendation','India and worldwide'], protectedSignals:['transactional demo/assessment/trial owner','₹0 Service offer','lead attribution','trial-vs-multi-class clarification'], rationale:'The conversion owner now matches the full programme architecture, captures demo/assessment/trial language, and avoids unsupported friction or slot-availability claims.' }),
]);

export const COMMERCIAL_C3_UNIQUE_OWNER_PATHS = freezeList(
  Array.from(new Set(COMMERCIAL_C3_OWNER_PAGE_AUDITS.map((entry) => entry.ownerPath))),
);

export const COMMERCIAL_C3_POLICY = freeze({
  c2Required: true,
  expectedClusterAudits: 16,
  expectedUserFacingOwnershipBoundaries: 15,
  expectedUniqueOwnerPages: 14,
  countryPagesCreated: 0,
  aiPromptPagesCreated: 0,
  sourceLevelFactsRequired: true,
  faqPolicy: 'Visible FAQs may improve parent clarity and answer extraction, but C3 does not rely on Google FAQ rich results.',
  geoPolicy: 'No special GEO markup is treated as a ranking shortcut; C3 uses crawlable, factual, answer-first content and descriptive structured data.',
});

if (COMMERCIAL_C2_STATUS !== 'ownership-complete') throw new Error('C3 requires completed C2 ownership.');
if (COMMERCIAL_C3_RECONCILIATION_STATUS !== '15-of-15-reconciled') throw new Error('C3 requires the final 15-owner reconciliation.');
if (COMMERCIAL_C3_OWNER_PAGE_AUDITS.length !== COMMERCIAL_C3_POLICY.expectedClusterAudits) throw new Error('C3 must audit all 16 machine-readable C2 clusters.');
if (COMMERCIAL_C3_UNIQUE_OWNER_PATHS.length !== COMMERCIAL_C3_POLICY.expectedUniqueOwnerPages) throw new Error('C3 must audit 14 unique commercial owner pages.');
for (const owner of COMMERCIAL_C2_OWNERSHIP_CLUSTERS) {
  if (COMMERCIAL_C3_OWNER_PAGE_AUDITS.filter((entry) => entry.clusterId === owner.id).length !== 1) {
    throw new Error(`C3 audit missing or duplicating C2 cluster ${owner.id}`);
  }
}
