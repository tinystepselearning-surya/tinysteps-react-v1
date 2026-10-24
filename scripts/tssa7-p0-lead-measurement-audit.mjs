#!/usr/bin/env node
/**
 * TSSA-7 P0: read-only, source-derived lead-measurement evidence.
 * Does not access Firebase, GA4, users, forms or production infrastructure.
 * Known gaps are findings, NOT a CI failure; absence of source anchors is a failure.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const files = {
  form: 'src/components/forms/PublicAssessmentForm.tsx',
  rules: 'firestore.rules',
  tracking: 'src/lib/conversionTracking.ts',
  analytics: 'src/lib/analytics.ts',
  attributionLead: 'src/lib/leadAttribution.ts',
  attributionEvents: 'src/lib/conversionTracking.ts',
  conversionTracker: 'src/components/common/ConversionTracker.tsx',
  manualPlaybook: 'docs/ga4-conversion-reporting-playbook.md',
};
const source = Object.fromEntries(Object.entries(files).map(([key, name]) => [key, read(name)]));
const formStart = source.form.indexOf('const handleSubmit = async');
const formEnd = source.form.indexOf('const isHeroCompact', formStart);
if (formStart < 0 || formEnd < formStart) throw Error('Submission source moved: review P0 audit anchors.');
const submission = source.form.slice(formStart, formEnd);
const validationStart = source.form.indexOf('const validate = () =>');
const validationEnd = source.form.indexOf('const handleSubmit = async', validationStart);
if (validationStart < 0 || validationEnd < validationStart) throw Error('Validation source moved: review P0 audit anchors.');
const validation = source.form.slice(validationStart, validationEnd);
const marker = (fragment) => submission.indexOf(fragment);
const saved = marker('await setDoc(leadRef,');
const attempted = marker('trackLeadFormSubmit(');
const generated = marker('trackGenerateLead(');
const booked = marker('trackDemoBookingComplete(');
if ([saved, attempted, generated, booked].some((v) => v < 0)) {
  throw Error('Expected form/event anchors changed: manually review submission semantics.');
}
const rulesScope = source.rules.slice(source.rules.indexOf('match /leads/{leadId}'), source.rules.indexOf('match /leads/{leadId}') + 11000);
const sourceRuleMinName = /parentName\.size\(\)\s*>=\s*2/.test(rulesScope);
const sourceRuleMinPhone = /whatsappNumber\.size\(\)\s*>=\s*8/.test(rulesScope);
const sourceRuleMinNormalized = /phoneNormalized\.size\(\)\s*>=\s*8/.test(rulesScope);
if (!(sourceRuleMinName && sourceRuleMinPhone && sourceRuleMinNormalized)) {
  throw Error('Firestore rules schema changed: manually reconcile validation requirements.');
}

const observations = [
  {
    id: 'P0-M01',
    finding: 'lead_form_submit happens before the Firestore write resolves',
    source_verified: attempted < saved,
    current_interpretation: 'attempt signal; not confirmed persisted lead',
    outcome_gate: 'Track successful stored submissions separately; verify key-event settings in GA4',
  },
  {
    id: 'P0-M02',
    finding: 'generate_lead happens after the successful Firestore save in the normal branch',
    source_verified: generated > saved,
    current_interpretation: 'stronger save-success signal, but GA4 delivery, duplicate events and key-event settings unverified',
    outcome_gate: 'Deduplicate by persisted canonical lead ID and reconcile with backend daily counts',
  },
  {
    id: 'P0-M03',
    finding: 'demo booking complete is recorded after enquiry save, before any slot confirmation',
    source_verified: booked > saved && booked < marker('navigateToWhatsapp(whatsappWindow, whatsappUrl)'),
    current_interpretation: 'saved WhatsApp assessment request is not a booked demo session',
    outcome_gate: 'Remove/rename premature booked event only in separately tested implementation; derive booked from server-confirmed schedule',
  },
  {
    id: 'P0-M04',
    finding: 'frontend form accepts nonempty short names/numbers despite stricter Firestore rules',
    source_verified: /!form\.parentName\.trim\(\)/.test(validation)
      && /!form\.whatsapp\.trim\(\)/.test(validation)
      && !/parentName\.trim\(\)\.length/.test(validation)
      && !/whatsapp\.replace\(/.test(validation),
    current_interpretation: 'short nonblank input may be rejected by anonymous Firestore create rules',
    outcome_gate: 'Align international-safe validation and error messages; run emulator invalid/valid cases',
  },
  {
    id: 'P0-M05',
    finding: 'WhatsApp click event is fired on navigation, including the failed Firestore-save branch',
    source_verified: submission.includes('lead_save_failed')
      && submission.includes('trackWhatsappClick(')
      && submission.indexOf('trackWhatsappClick(', submission.indexOf('lead_save_failed')) > 0,
    current_interpretation: 'navigation to WhatsApp, not evidence of a delivered user message',
    outcome_gate: 'Use a distinct WhatsApp-intent signal and confirm received messages separately',
  },
  {
    id: 'P0-M06',
    finding: 'two first-touch attribution storage lifecycles coexist',
    source_verified: source.attributionLead.includes('window.sessionStorage')
      && source.attributionEvents.includes('window.localStorage')
      && source.conversionTracker.includes('capturePublicLeadAttribution()'),
    current_interpretation: 'session-scoped operational lead attribution and persistent event attribution may diverge between visits',
    outcome_gate: 'Test first landing/referrer + UTM across navigation, reload, new sessions; do not migrate stored PII silently',
  },
  {
    id: 'P0-M07',
    finding: 'analytics script installation can be delayed until interaction or a fallback timer',
    source_verified: source.analytics.includes('MOBILE_FALLBACK_DELAY_MS = 12000')
      && source.analytics.includes('DESKTOP_FALLBACK_DELAY_MS = 18000')
      && source.analytics.includes('requestIdleCallback'),
    current_interpretation: 'risk of missing early exits; no observed measurement loss proven by code',
    outcome_gate: 'Use read-only network/GA4 DebugView comparison and short-session QA before altering performance controls',
  },
  {
    id: 'P0-M08',
    finding: 'reporting playbook describes lead_form_submit as successfully completed',
    source_verified: source.manualPlaybook.includes('Successful lead form completion'),
    current_interpretation: 'documentation conflicts with current event emission order',
    outcome_gate: 'Update measurement dictionary after implementation; do not rename all historic metrics blindly',
  },
];
const body = {
  audit: 'TSSA-7 P0 lead measurement and attribution',
  branch_snapshot_utc: new Date().toISOString(),
  method: 'checked-in source string/ordering crosscheck, no production requests or writes',
  ga4_live_event_configuration_verified: false,
  firestore_production_lead_counts_verified: false,
  whatsapp_delivery_verified: false,
  conclusions: observations,
  confirmed_count: observations.filter((x) => x.source_verified).length,
  no_user_record_access: true,
};
const directory = path.join(root, 'artifacts', 'tssa7-p0');
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(directory, 'LEAD_MEASUREMENT_SOURCE_AUDIT.json'), JSON.stringify(body, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({
  audit: body.audit,
  evidence_state: 'SOURCE_ONLY',
  confirmed_count: body.confirmed_count,
  inspected: observations.length,
  source_findings: observations.map((x) => ({id:x.id, detected:x.source_verified})),
  ga4_live_event_configuration_verified: false,
  firestore_production_lead_counts_verified: false,
}, null, 2));
