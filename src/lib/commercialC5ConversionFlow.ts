import {
  COMMERCIAL_C0_FACTS,
  COMMERCIAL_C0_MEASUREMENT,
  COMMERCIAL_C0_STATUS,
} from './commercialC0Foundation';
import {
  COMMERCIAL_C2_OWNERSHIP_CLUSTERS,
  COMMERCIAL_C2_STATUS,
  type CommercialOwnerPriority,
  type CommercialOwnerRole,
} from './commercialC2KeywordOwnership';
import {
  COMMERCIAL_C3_OWNER_PAGE_AUDITS,
  COMMERCIAL_C3_STATUS,
  COMMERCIAL_C3_UNIQUE_OWNER_PATHS,
} from './commercialC3OwnerPageAudit';
import { COMMERCIAL_C4_STATUS } from './commercialC4CtrOptimization';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const COMMERCIAL_C5_REVISION = '2026-09-11-c5-r1';
export const COMMERCIAL_C5_STATUS = 'decision-flow-implemented';

export type CommercialC5DecisionStage =
  | 'programme-fit'
  | 'provider-comparison'
  | 'price-evaluation'
  | 'specialist-fit'
  | 'local-fit'
  | 'conversion';

export type CommercialC5PrimaryActionKind = 'book-assessment' | 'submit-assessment';

export type CommercialC5DecisionKind =
  | 'assessment'
  | 'assessment-submit-attempt'
  | 'pricing'
  | 'programme-handoff'
  | 'comparison-handoff'
  | 'contact';

export type CommercialC5DecisionAlignment =
  | 'primary'
  | 'secondary'
  | 'supporting-contact'
  | 'off-contract';

export type CommercialC5PrimaryAction = {
  kind: CommercialC5PrimaryActionKind;
  labelIntent: string;
  destinationPath: string | null;
};

export type CommercialC5OwnerFlow = {
  ownerPath: string;
  sourcePath: string;
  priority: CommercialOwnerPriority;
  clusterIds: readonly string[];
  ownerRoles: readonly CommercialOwnerRole[];
  stage: CommercialC5DecisionStage;
  parentQuestion: string;
  primaryAction: Readonly<CommercialC5PrimaryAction>;
  secondaryDestinations: readonly string[];
  directAssessmentPathRequired: boolean;
};

type CommercialC5FlowInput = {
  ownerPath: string;
  stage: CommercialC5DecisionStage;
  parentQuestion: string;
  primaryAction?: CommercialC5PrimaryAction;
  secondaryDestinations: readonly string[];
};

export type CommercialC5DecisionResolution = {
  kind: CommercialC5DecisionKind;
  alignment: CommercialC5DecisionAlignment;
  fromPath: string;
  destinationPath: string | null;
};

const PRIORITY_ORDER: Record<CommercialOwnerPriority, number> = { P1: 1, P2: 2, P3: 3 };

export function normalizeCommercialC5Path(pathname: string | null | undefined): string {
  if (!pathname) return '/';
  const withoutQuery = pathname.split(/[?#]/, 1)[0] || '/';
  const lower = withoutQuery.trim().toLowerCase() || '/';
  if (lower !== '/' && lower.endsWith('/')) return lower.replace(/\/+$/, '');
  return lower;
}

function sourcePathForOwner(ownerPath: string): string {
  const sourcePaths = Array.from(
    new Set(
      COMMERCIAL_C3_OWNER_PAGE_AUDITS
        .filter((entry) => entry.ownerPath === ownerPath)
        .map((entry) => entry.sourcePath),
    ),
  );

  if (sourcePaths.length !== 1) {
    throw new Error(`C5 requires exactly one C3 source path for ${ownerPath}.`);
  }

  return sourcePaths[0];
}

function clustersForOwner(ownerPath: string) {
  const clusters = COMMERCIAL_C2_OWNERSHIP_CLUSTERS.filter(
    (entry) => entry.canonicalOwnerPath === ownerPath,
  );
  if (!clusters.length) throw new Error(`C5 owner ${ownerPath} has no C2 ownership cluster.`);
  return clusters;
}

function priorityForOwner(ownerPath: string): CommercialOwnerPriority {
  return [...clustersForOwner(ownerPath)]
    .map((entry) => entry.priority)
    .sort((a, b) => PRIORITY_ORDER[a] - PRIORITY_ORDER[b])[0];
}

function flow(input: CommercialC5FlowInput): Readonly<CommercialC5OwnerFlow> {
  const ownerPath = normalizeCommercialC5Path(input.ownerPath);
  const clusters = clustersForOwner(ownerPath);
  const isConversionOwner = ownerPath === '/book-demo';
  const assessmentMinutes = COMMERCIAL_C0_FACTS.delivery.assessmentDurationMinutes;

  const primaryAction = input.primaryAction ?? {
    kind: 'book-assessment' as const,
    labelIntent: `Book free ${assessmentMinutes}-minute 1:1 assessment`,
    destinationPath: '/book-demo',
  };

  return freeze({
    ownerPath,
    sourcePath: sourcePathForOwner(ownerPath),
    priority: priorityForOwner(ownerPath),
    clusterIds: freezeList(clusters.map((entry) => entry.id)),
    ownerRoles: freezeList(Array.from(new Set(clusters.map((entry) => entry.ownerRole)))),
    stage: input.stage,
    parentQuestion: input.parentQuestion,
    primaryAction: freeze({ ...primaryAction }),
    secondaryDestinations: freezeList(
      input.secondaryDestinations.map((path) => normalizeCommercialC5Path(path)),
    ),
    directAssessmentPathRequired: !isConversionOwner,
  });
}

/**
 * C5 does not create another landing-page architecture. It takes the 14 unique
 * C2/C3 commercial owners and gives each one a single next-step contract.
 * Every pre-conversion owner can move directly to the one assessment owner;
 * secondary links exist only to answer the parent's remaining decision question.
 */
export const COMMERCIAL_C5_OWNER_FLOWS = freezeList<Readonly<CommercialC5OwnerFlow>>([
  flow({
    ownerPath: '/phonics',
    stage: 'programme-fit',
    parentQuestion: 'Does this child need phonics support, and where should they start?',
    secondaryDestinations: [
      '/best-online-phonics-classes-for-kids-in-india',
      '/phonics-fees-india',
      '/pricing',
    ],
  }),
  flow({
    ownerPath: '/best-online-phonics-classes-for-kids-in-india',
    stage: 'provider-comparison',
    parentQuestion: 'Which phonics class format and provider approach best fits this child?',
    secondaryDestinations: ['/phonics', '/phonics-fees-india', '/pricing'],
  }),
  flow({
    ownerPath: '/phonics-fees-india',
    stage: 'price-evaluation',
    parentQuestion: 'What should phonics classes cost, and what does Tiny Steps charge?',
    secondaryDestinations: ['/phonics', '/pricing'],
  }),
  flow({
    ownerPath: '/reading-classes-for-kids',
    stage: 'programme-fit',
    parentQuestion: 'Does this child need broad reading support or a narrower fluency intervention?',
    secondaryDestinations: ['/reading-fluency-program', '/pricing'],
  }),
  flow({
    ownerPath: '/reading-fluency-program',
    stage: 'specialist-fit',
    parentQuestion: 'Is decoding reasonably secure while connected reading remains slow or hesitant?',
    secondaryDestinations: ['/reading-classes-for-kids', '/pricing'],
  }),
  flow({
    ownerPath: '/grammar',
    stage: 'programme-fit',
    parentQuestion: 'Is grammar and sentence accuracy the main need rather than writing development?',
    secondaryDestinations: ['/writing-classes-for-kids', '/pricing'],
  }),
  flow({
    ownerPath: '/writing-classes-for-kids',
    stage: 'programme-fit',
    parentQuestion: 'Does the child need help developing ideas, paragraphs, stories and independent writing?',
    secondaryDestinations: ['/grammar', '/pricing'],
  }),
  flow({
    ownerPath: '/spoken-english-classes-for-kids-online',
    stage: 'programme-fit',
    parentQuestion: 'Is everyday conversational fluency the main goal rather than audience-facing speaking?',
    secondaryDestinations: ['/speaking', '/pricing'],
  }),
  flow({
    ownerPath: '/speaking',
    stage: 'programme-fit',
    parentQuestion: 'Does the child need public speaking, storytelling, presentations or broader communication practice?',
    secondaryDestinations: [
      '/spoken-english-classes-for-kids-online',
      '/confidence-building-program-kids',
      '/pricing',
    ],
  }),
  flow({
    ownerPath: '/confidence-building-program-kids',
    stage: 'specialist-fit',
    parentQuestion: 'Is speaking comfort, participation confidence or dependence on prompting the main barrier?',
    secondaryDestinations: ['/speaking', '/pricing'],
  }),
  flow({
    ownerPath: '/online-english-classes-for-kids',
    stage: 'programme-fit',
    parentQuestion: 'Which Tiny Steps English programme best matches the child’s current need?',
    secondaryDestinations: [
      '/phonics',
      '/reading-classes-for-kids',
      '/grammar',
      '/writing-classes-for-kids',
      '/spoken-english-classes-for-kids-online',
      '/speaking',
      '/pricing',
    ],
  }),
  flow({
    ownerPath: '/online-english-classes-hyderabad',
    stage: 'local-fit',
    parentQuestion: 'Can a Hyderabad family use the same live online Tiny Steps programme and assessment flow?',
    secondaryDestinations: ['/online-english-classes-for-kids', '/pricing'],
  }),
  flow({
    ownerPath: '/pricing',
    stage: 'price-evaluation',
    parentQuestion: 'Which class format offers the right fit and value before the parent requests an assessment?',
    secondaryDestinations: ['/online-english-classes-for-kids', '/phonics', '/grammar', '/speaking'],
  }),
  flow({
    ownerPath: '/book-demo',
    stage: 'conversion',
    parentQuestion: 'What does the child need, and what is the right programme and starting point?',
    primaryAction: {
      kind: 'submit-assessment',
      labelIntent: 'Submit free assessment request',
      destinationPath: null,
    },
    secondaryDestinations: ['/pricing', '/online-english-classes-for-kids'],
  }),
]);

const flowByPath = new Map(COMMERCIAL_C5_OWNER_FLOWS.map((entry) => [entry.ownerPath, entry]));

export const COMMERCIAL_C5_MEASUREMENT = freeze({
  primaryKpi: COMMERCIAL_C0_MEASUREMENT.primaryKpi,
  primaryOutcomeSource: 'canonical lead lifecycle + stored first-touch attribution',
  diagnosticEvents: freeze({
    ownerView: 'commercial_owner_view',
    decisionClick: 'commercial_decision_click',
    formStart: 'funnel_form_start',
    formSubmit: 'funnel_form_submit',
    generateLead: 'generate_lead',
  }),
  decisionWindowDays: COMMERCIAL_C0_MEASUREMENT.reporting.decisionWindowDays,
  monitoringWindowDays: COMMERCIAL_C0_MEASUREMENT.reporting.monitoringWindowDays,
  rule:
    'C5 owner-view, decision-click and form events are diagnostic funnel signals. A qualified organic lead still requires C0 canonical lead status plus first-touch organic-search attribution.',
});

export const COMMERCIAL_C5_POLICY = freeze({
  expectedUniqueOwnerPages: 14,
  directAssessmentEntryPages: 13,
  singleConversionOwner: '/book-demo',
  newCommercialUrlsAllowed: false,
  c2OwnershipMutationAllowed: false,
  c3CommercialFactDriftAllowed: false,
  c4MetadataMutationAllowed: false,
  directPaymentFromCommercialOwnerAllowed: false,
  bodyCopyChurnDuringC4ControlWindow: false,
  primaryCtaRule:
    'Every pre-conversion commercial owner keeps a direct path to /book-demo; /book-demo remains the single assessment conversion owner.',
  secondaryCtaRule:
    'Secondary commercial links should answer a remaining parent decision question without creating ownership conflict or a conversion dead end.',
});

export function getCommercialC5OwnerFlow(
  pathname: string | null | undefined,
): Readonly<CommercialC5OwnerFlow> | null {
  return flowByPath.get(normalizeCommercialC5Path(pathname)) ?? null;
}

export function isCommercialC5OwnerPath(pathname: string | null | undefined): boolean {
  return Boolean(getCommercialC5OwnerFlow(pathname));
}

export function resolveCommercialC5Decision(input: {
  fromPath: string;
  destinationPath?: string | null;
  href?: string | null;
  label?: string | null;
  ctaLocation?: string | null;
}): CommercialC5DecisionResolution | null {
  const fromPath = normalizeCommercialC5Path(input.fromPath);
  const fromFlow = getCommercialC5OwnerFlow(fromPath);
  if (!fromFlow) return null;

  const label = (input.label || '').trim().toLowerCase();
  const href = (input.href || '').trim().toLowerCase();
  const ctaLocation = (input.ctaLocation || '').trim().toLowerCase();
  const destinationPath = input.destinationPath
    ? normalizeCommercialC5Path(input.destinationPath)
    : null;

  if (
    fromPath === '/book-demo'
    && ctaLocation === 'form'
    && /(book|assessment|demo|submit)/.test(label)
  ) {
    return {
      kind: 'assessment-submit-attempt',
      alignment: 'primary',
      fromPath,
      destinationPath: null,
    };
  }

  const contactClick =
    /wa\.me|whatsapp\.com/.test(href)
    || href.startsWith('tel:')
    || href.startsWith('mailto:')
    || destinationPath === '/contact'
    || label.includes('whatsapp');

  if (contactClick) {
    return {
      kind: 'contact',
      alignment: 'supporting-contact',
      fromPath,
      destinationPath,
    };
  }

  if (!destinationPath || destinationPath === fromPath) return null;

  let kind: CommercialC5DecisionKind | null = null;
  if (destinationPath === '/book-demo') kind = 'assessment';
  else if (destinationPath === '/pricing') kind = 'pricing';
  else {
    const destinationFlow = getCommercialC5OwnerFlow(destinationPath);
    if (destinationFlow?.stage === 'provider-comparison') kind = 'comparison-handoff';
    else if (destinationFlow) kind = 'programme-handoff';
  }

  if (!kind) return null;

  const normalizedPrimaryDestination = fromFlow.primaryAction.destinationPath
    ? normalizeCommercialC5Path(fromFlow.primaryAction.destinationPath)
    : null;
  const alignment: CommercialC5DecisionAlignment =
    destinationPath === normalizedPrimaryDestination
      ? 'primary'
      : fromFlow.secondaryDestinations.includes(destinationPath)
        ? 'secondary'
        : 'off-contract';

  return { kind, alignment, fromPath, destinationPath };
}

export function getCommercialC5Snapshot() {
  return freeze({
    revision: COMMERCIAL_C5_REVISION,
    status: COMMERCIAL_C5_STATUS,
    flows: COMMERCIAL_C5_OWNER_FLOWS,
    measurement: COMMERCIAL_C5_MEASUREMENT,
    policy: COMMERCIAL_C5_POLICY,
  });
}

if (COMMERCIAL_C0_STATUS !== 'frozen') throw new Error('C5 requires C0 measurement to remain frozen.');
if (COMMERCIAL_C2_STATUS !== 'ownership-complete') throw new Error('C5 requires completed C2 ownership.');
if (COMMERCIAL_C3_STATUS !== 'implementation-complete') throw new Error('C5 requires completed C3 owner pages.');
if (COMMERCIAL_C4_STATUS !== 'experiment-governance-armed') {
  throw new Error('C5 requires C4 CTR governance to remain armed while the control window runs.');
}
if (COMMERCIAL_C5_OWNER_FLOWS.length !== COMMERCIAL_C5_POLICY.expectedUniqueOwnerPages) {
  throw new Error('C5 must define exactly 14 unique commercial owner flows.');
}

const c5OwnerPaths = new Set(COMMERCIAL_C5_OWNER_FLOWS.map((entry) => entry.ownerPath));
if (c5OwnerPaths.size !== COMMERCIAL_C5_POLICY.expectedUniqueOwnerPages) {
  throw new Error('C5 owner flows must be unique by canonical path.');
}
for (const ownerPath of COMMERCIAL_C3_UNIQUE_OWNER_PATHS) {
  if (!c5OwnerPaths.has(ownerPath)) throw new Error(`C5 is missing C3 owner ${ownerPath}.`);
}
for (const cluster of COMMERCIAL_C2_OWNERSHIP_CLUSTERS) {
  if (!c5OwnerPaths.has(cluster.canonicalOwnerPath)) {
    throw new Error(`C5 is missing C2 owner ${cluster.canonicalOwnerPath}.`);
  }
}

const directAssessmentFlows = COMMERCIAL_C5_OWNER_FLOWS.filter(
  (entry) => entry.primaryAction.destinationPath === '/book-demo',
);
if (directAssessmentFlows.length !== COMMERCIAL_C5_POLICY.directAssessmentEntryPages) {
  throw new Error('C5 requires all 13 pre-conversion owners to point directly to /book-demo.');
}

for (const entry of COMMERCIAL_C5_OWNER_FLOWS) {
  if (entry.secondaryDestinations.includes(entry.ownerPath)) {
    throw new Error(`C5 secondary decision flow cannot self-loop on ${entry.ownerPath}.`);
  }
  for (const destination of entry.secondaryDestinations) {
    if (!c5OwnerPaths.has(destination)) {
      throw new Error(`C5 secondary destination ${destination} is not a commercial owner.`);
    }
  }
  if (
    entry.primaryAction.destinationPath
    && !c5OwnerPaths.has(normalizeCommercialC5Path(entry.primaryAction.destinationPath))
  ) {
    throw new Error(`C5 primary destination for ${entry.ownerPath} is not a commercial owner.`);
  }
}

const conversionOwner = getCommercialC5OwnerFlow(COMMERCIAL_C5_POLICY.singleConversionOwner);
if (!conversionOwner || conversionOwner.primaryAction.kind !== 'submit-assessment') {
  throw new Error('C5 requires /book-demo to remain the single assessment submission owner.');
}
