import { trackEvent } from './analytics';
import { COMMERCIAL_C0_MEASUREMENT, COMMERCIAL_C0_STATUS } from './commercialC0Foundation';
import { normalizePath, sanitizeLabel } from './conversionTracking';
import {
  COMMERCIAL_C7_R2_STATUS,
  getCommercialC7R2NextStepRule,
} from './commercialC7IntentNextStepRules';
import { COMMERCIAL_C7_R3_STATUS } from './commercialC7ContextualHandoffImplementation';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const COMMERCIAL_C7_R4_REVISION = '2026-09-12-c7-r4';
export const COMMERCIAL_C7_R4_STATUS = 'knowledge-conversion-measurement-implemented';

export const COMMERCIAL_C7_R4_MEASUREMENT = freeze({
  primaryKpi: COMMERCIAL_C0_MEASUREMENT.primaryKpi,
  primaryOutcomeSource: 'canonical lead lifecycle + stored first-touch attribution',
  diagnosticEvents: freeze({
    knowledgeView: 'knowledge_commercial_view',
    knowledgeHandoffClick: 'knowledge_commercial_handoff_click',
    commercialOwnerView: 'commercial_owner_view',
    commercialDecisionClick: 'commercial_decision_click',
    formStart: 'funnel_form_start',
    formSubmit: 'funnel_form_submit',
    generateLead: 'generate_lead',
  }),
  measuredSequence: freezeList([
    'knowledge_surface',
    'commercial_owner',
    'book_demo',
    'qualified_lead',
  ]),
  rule:
    'C7-R4 knowledge-view and handoff-click events are diagnostic only. Commercial owner/form events remain C5 diagnostics, while a qualified organic lead is counted only by the C0 canonical lead lifecycle plus stored first-touch organic-search attribution.',
});

export const COMMERCIAL_C7_R4_POLICY = freeze({
  diagnosticOnly: true,
  clickEqualsQualifiedLead: false,
  singleConversionOwner: '/book-demo' as const,
  newCommercialUrlsAllowed: false,
  c2OwnershipMutationAllowed: false,
  c4MetadataMutationAllowed: false,
  c5ConversionOwnershipMutationAllowed: false,
  c6ArchitectureMutationAllowed: false,
  knowledgeBodyMutationAllowed: false,
});

export function isCommercialC7MeasuredKnowledgePath(pathname: string | null | undefined): boolean {
  const path = normalizePath(pathname || '/');
  return Boolean(getCommercialC7R2NextStepRule(path));
}

export function trackCommercialC7KnowledgeView(params: {
  page_path: string;
  page_title?: string;
  source_context?: string;
}): boolean {
  const pagePath = normalizePath(params.page_path);
  const rule = getCommercialC7R2NextStepRule(pagePath);
  if (!rule) return false;

  trackEvent(COMMERCIAL_C7_R4_MEASUREMENT.diagnosticEvents.knowledgeView, {
    page_path: pagePath,
    page_title: params.page_title || (typeof document !== 'undefined' ? document.title : ''),
    owner_family: rule.ownerFamily,
    rule_class: rule.ruleClass,
    prompt_strength: rule.promptStrength,
    primary_destination: rule.primaryDestination || undefined,
    secondary_destination: rule.secondaryDestination || undefined,
    source_context: params.source_context || 'commercial_c7',
  });

  return true;
}

export function trackCommercialC7HandoffClick(params: {
  page_path: string;
  destination_path: string;
  cta_label: string;
  cta_location: string;
  source_context?: string;
}): boolean {
  const pagePath = normalizePath(params.page_path);
  const destinationPath = normalizePath(params.destination_path);
  const rule = getCommercialC7R2NextStepRule(pagePath);
  if (!rule) return false;

  const handoffRole =
    destinationPath === rule.primaryDestination
      ? 'primary'
      : destinationPath === rule.secondaryDestination
        ? 'secondary'
        : null;
  if (!handoffRole) return false;

  trackEvent(COMMERCIAL_C7_R4_MEASUREMENT.diagnosticEvents.knowledgeHandoffClick, {
    page_path: pagePath,
    destination_path: destinationPath,
    owner_family: rule.ownerFamily,
    rule_class: rule.ruleClass,
    handoff_role: handoffRole,
    cta_label: sanitizeLabel(params.cta_label),
    cta_location: params.cta_location,
    source_context: params.source_context || 'commercial_c7',
  });

  return true;
}

export function getCommercialC7R4Snapshot() {
  return freeze({
    revision: COMMERCIAL_C7_R4_REVISION,
    status: COMMERCIAL_C7_R4_STATUS,
    measurement: COMMERCIAL_C7_R4_MEASUREMENT,
    policy: COMMERCIAL_C7_R4_POLICY,
  });
}

if (COMMERCIAL_C0_STATUS !== 'frozen') throw new Error('C7-R4 requires frozen C0 measurement.');
if (COMMERCIAL_C7_R2_STATUS !== 'intent-next-step-rules-validated') throw new Error('C7-R4 requires validated C7-R2 rules.');
if (COMMERCIAL_C7_R3_STATUS !== 'contextual-commercial-handoffs-implemented') throw new Error('C7-R4 requires implemented C7-R3 handoffs.');
if (COMMERCIAL_C7_R4_MEASUREMENT.primaryKpi !== 'qualified_organic_leads_per_day') throw new Error('C7-R4 must preserve the C0 qualified-organic-lead KPI.');
