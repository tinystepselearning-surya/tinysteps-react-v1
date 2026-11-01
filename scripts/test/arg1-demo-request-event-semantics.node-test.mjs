import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('public form records an assessment request but never a confirmed booking', () => {
  const form = read('src/components/forms/PublicAssessmentForm.tsx');
  assert.match(form, /trackDemoRequestReceived\(/);
  assert.doesNotMatch(form, /trackDemoBookingComplete/);
  const write = form.indexOf('await setDoc(leadRef, {');
  const lead = form.indexOf('trackGenerateLead({');
  const request = form.indexOf('trackDemoRequestReceived({');
  const whatsapp = form.indexOf('navigateToWhatsapp(whatsappWindow, whatsappUrl);', request);
  assert.ok(write >= 0 && write < lead && lead < request && request < whatsapp, 'request event must follow saved lead and precede WhatsApp handoff');
  assert.match(form.slice(request - 180, request), /classFormatPreference !== 'small_group' && submittedForm\.classFormatPreference !== 'unsure'/);
  assert.match(form.slice(request, request + 260), /submission_id: leadRef\.id/);
});

test('new request and legacy confirmed-booking event have disjoint names', () => {
  const tracker = read('src/lib/conversionTracking.ts');
  assert.match(tracker, /export function trackDemoRequestReceived\(/);
  assert.match(tracker, /trackEvent\('demo_request_received'/);
  assert.match(tracker, /request_type: params\.request_type/);
  assert.match(tracker, /submission_id: params\.submission_id/);
  assert.match(tracker, /export function trackDemoBookingComplete\(/);
  assert.match(tracker, /trackEvent\('funnel_demo_booking_complete'/);
  assert.match(tracker, /trackEvent\('generate_lead'/);
});

test('existing commercial C5 audit recognizes updated request event in form', () => {
  const gate = read('scripts/audit-commercial-c5-conversion-flow.mjs');
  assert.match(gate, /'trackDemoRequestReceived'/);
});
