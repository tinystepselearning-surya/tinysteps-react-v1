import assert from 'node:assert/strict';
import test from 'node:test';
import { previewFirstObservedParentChildCohorts as cohort } from '../lib/arg2-parent-cohort-fixture.mjs';

const november = { start: '2026-11-01', end: '2026-11-30' };
const december = { start: '2026-12-01', end: '2026-12-31' };
const periods = [november, december];
const make = (id, phone, date, overrides = {}) => ({
  id, primaryPhone: phone, childName: 'Aarav', firstInquiryAt: date, source: 'website', ...overrides,
});

test('earliest across complete supplied history wins; new vs repeat remains distinct', () => {
  const rows = [
    make('oct', '+919876543210', '2026-12-14T12:00:00Z', { childName: 'Aarav', acquisitionChannel: 'chatgpt' }),
    make('sep', '9876543210', '2026-11-10T12:00:00Z', { childName: 'Aarav' }),
  ];
  const result = cohort(rows, periods);
  assert.equal(result.periods[0].firstObservedParentChildEnquiries, 1);
  assert.equal(result.periods[1].firstObservedParentChildEnquiries, 0);
  assert.equal(result.periods[1].laterLeadRowsForKnownParentChild, 1);
  assert.equal(result.periods[0].firstTouchChannels.unknown, 1);
  assert.equal(result.periods[1].firstTouchChannels.chatgpt, undefined);
});

test('same child across multiple Indian phone spellings remains one acquisition opportunity', () => {
  const rows = [
    make('a', '9876543210', '2026-12-10T05:00:00Z'),
    make('b', '+91 98765 43210', '2026-12-11T05:00:00Z'),
    make('c', '0091 98765 43210', '2026-12-12T05:00:00Z'),
    make('d', '919876543210', '2026-12-13T05:00:00Z'),
  ];
  const result = cohort(rows, [december]).periods[0];
  assert.equal(result.firstObservedParentChildEnquiries, 1);
  assert.equal(result.laterLeadRowsForKnownParentChild, 3);
  assert.equal(result.datedLeadRows, 4);
});

test('same parent, two different children count as two new enquiries', () => {
  const rows = [
    make('sibling-a', '9876543210', '2026-11-20T04:00:00Z', { childName: 'Aarav', acquisitionChannel: 'google_organic' }),
    make('sibling-b', '+919876543210', '2026-12-10T04:00:00Z', { childName: 'Anaya', acquisitionChannel: 'chatgpt' }),
    make('repeat-a', '00919876543210', '2026-12-15T04:00:00Z', { childName: 'Aarav', acquisitionChannel: 'instagram' }),
  ];
  const result = cohort(rows, periods);
  assert.equal(result.periods[0].firstObservedParentChildEnquiries, 1);
  assert.equal(result.periods[1].firstObservedParentChildEnquiries, 1);
  assert.equal(result.periods[1].laterLeadRowsForKnownParentChild, 1);
  assert.equal(result.periods[0].firstTouchChannels.google_organic, 1);
  assert.equal(result.periods[1].firstTouchChannels.chatgpt, 1);
  assert.equal(result.periods[1].firstTouchChannels.instagram, undefined);
});

test('normalizes child case, accents and punctuation but not distinct siblings', () => {
  const rows = [
    make('first', '9876543210', '2026-12-02T04:00:00Z', { childName: 'Rítha-nya' }),
    make('repeat', '+919876543210', '2026-12-03T04:00:00Z', { childName: 'Ritha Nya' }),
    make('sibling', '9876543210', '2026-12-04T04:00:00Z', { childName: 'Anaya' }),
  ];
  const result = cohort(rows, [december]).periods[0];
  assert.equal(result.firstObservedParentChildEnquiries, 2);
  assert.equal(result.laterLeadRowsForKnownParentChild, 1);
});

test('international numbers with shared suffix are not collapsed into Indian identity', () => {
  const rows = [
    make('in', '9876543210', '2026-12-01T05:00:00Z'),
    make('uk', '+449876543210', '2026-12-02T05:00:00Z'),
    make('gb', '00449876543210', '2026-12-03T05:00:00Z'),
  ];
  const result = cohort(rows, [december]).periods[0];
  assert.equal(result.firstObservedParentChildEnquiries, 2);
  assert.equal(result.laterLeadRowsForKnownParentChild, 1);
});

test('invalid, conflicting and missing phones remain unresolved, never counted new', () => {
  const rows = [
    make('missing', '', '2026-12-02T04:00:00Z'),
    make('bad', '+++++++1', '2026-12-02T04:00:00Z'),
    make('short', '+91123', '2026-12-02T04:00:00Z'),
    make('conflict', '9876543210', '2026-12-02T04:00:00Z', { whatsappNumber: '+919999999999' }),
    make('missing-child', '9876543210', '2026-12-02T04:00:00Z', { childName: '' }),
  ];
  const result = cohort(rows, [december]);
  assert.equal(result.periods[0].firstObservedParentChildEnquiries, 0);
  assert.equal(result.periods[0].unresolvedParentChildIdentityRows, 5);
  assert.equal(result.unresolvedIdentityRows, 5);
});

test('raw undecided concern is not counted as reading', () => {
  const rows = [make('a', '9876543210', '2026-12-02T04:00:00Z', {
    mainConcern: 'Not sure where to start', programInterest: 'Reading',
  })];
  const result = cohort(rows, [december]).periods[0];
  assert.equal(result.firstConcernGroups.undecided, 1);
  assert.equal(result.firstConcernGroups.reading, undefined);
});

test('IST midnight and timestamp fallback place earliest record in correct calendar period', () => {
  const rows = [
    make('before', '9876543210', undefined, { firstInquiryAt: null, receivedAt: new Date('2026-11-30T18:29:59Z') }),
    make('after', '9876543211', undefined, { firstInquiryAt: null, requestedAt: { seconds: Date.parse('2026-11-30T18:30:00Z') / 1000 } }),
  ];
  const result = cohort(rows, periods);
  assert.equal(result.periods[0].firstObservedParentChildEnquiries, 1);
  assert.equal(result.periods[1].firstObservedParentChildEnquiries, 1);
});

test('earlier archived historical lead still prevents false new-parent count later', () => {
  const rows = [
    make('old', '9876543210', '2026-11-20T04:00:00Z', { archived: true }),
    make('new', '9876543210', '2026-12-20T04:00:00Z'),
  ];
  const result = cohort(rows, periods);
  assert.equal(result.periods[0].firstObservedParentChildEnquiries, 1);
  assert.equal(result.periods[1].firstObservedParentChildEnquiries, 0);
  assert.equal(result.periods[1].laterLeadRowsForKnownParentChild, 1);
});

test('duplicate document IDs and missing timestamps are distinguished, not invented', () => {
  const rows = [
    make('a', '9876543210', '2026-12-04T04:00:00Z'),
    make('a', '9876543210', '2026-12-04T04:00:00Z'),
    make('timeless', '9876543211', null),
  ];
  const result = cohort(rows, [december]);
  assert.equal(result.duplicateDocumentRows, 1);
  assert.equal(result.missingTimestampRows, 1);
  assert.equal(result.periods[0].datedLeadRows, 1);
});

test('output is aggregate-only: does not echo input phones, names, ids or free text', () => {
  const rows = [make('private-doc-1', '9876543210', '2026-12-10T04:00:00Z', {
    parentName: 'Synthetic Parent Secret',
    childName: 'Synthetic Child Secret',
    landingPage: '/book-demo?name=Secret',
    acquisitionChannel: 'chatgpt',
  })];
  const out = cohort(rows, [december]);
  const json = JSON.stringify(out);
  for (const secret of ['9876543210', '+91', 'private-doc-1', 'Synthetic Parent Secret', 'Synthetic Child Secret', 'Secret']) {
    assert.equal(json.includes(secret), false, 'output must not contain private source values');
  }
  assert.equal(out.periods[0].firstTouchChannels.chatgpt, 1);
  assert.equal(out.historyIsComplete, false);
  assert.equal(out.status, 'OFFLINE_PROSPECTIVE_FIXTURE_ONLY_NOT_LIVE_APPROVED');
  assert.equal(out.cutoverDate, '2026-11-01');
  assert.equal(out.historicalReconciliationRequired, false);
});

test('existing pre-cutover child is repeat only, but a new sibling after cutover counts as new', () => {
  const rows = [
    make('existing-child', '+919876543210', '2026-10-15T04:00:00Z', {
      childName: 'Aarav', lastInquiryAt: '2026-11-12T04:00:00Z',
    }),
    make('new-sibling', '+919876543210', '2026-11-12T05:00:00Z', { childName: 'Anaya' }),
  ];
  const out = cohort(rows, [november]);
  assert.equal(out.periods[0].firstObservedParentChildEnquiries, 1);
  assert.equal(out.periods[0].firstTouchChannels.unknown, 1);
});

test('does not present dates before the 1 November 2026 cutover as new metrics', () => {
  assert.throws(
    () => cohort([], [{ start: '2026-10-01', end: '2026-10-31' }]),
    /predates ARG-2 cutover/,
  );
});

test('rejects invalid date windows and invalid record IDs', () => {
  assert.throws(() => cohort([], [{start:'2026-02-31',end:'2026-12-31'}]));
  assert.throws(() => cohort([], [{start:'2026-12-31',end:'2026-12-01'}]));
  assert.throws(() => cohort([{}], [december]));
});
