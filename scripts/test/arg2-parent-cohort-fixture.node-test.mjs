import assert from 'node:assert/strict';
import test from 'node:test';
import { previewFirstObservedParentCohorts as cohort } from '../lib/arg2-parent-cohort-fixture.mjs';

const september = { start: '2026-09-01', end: '2026-09-30' };
const october = { start: '2026-10-01', end: '2026-10-31' };
const periods = [september, october];
const make = (id, phone, date, overrides = {}) => ({
  id, primaryPhone: phone, firstInquiryAt: date, source: 'website', ...overrides,
});

test('earliest across complete supplied history wins; new vs repeat remains distinct', () => {
  const rows = [
    make('oct', '+919876543210', '2026-10-14T12:00:00Z', { childName: 'Sibling Two', acquisitionChannel: 'chatgpt' }),
    make('sep', '9876543210', '2026-09-10T12:00:00Z', { childName: 'Sibling One' }),
  ];
  const result = cohort(rows, periods);
  assert.equal(result.periods[0].firstObservedParentPhones, 1);
  assert.equal(result.periods[1].firstObservedParentPhones, 0);
  assert.equal(result.periods[1].laterLeadRowsForKnownParents, 1);
  assert.equal(result.periods[0].firstTouchChannels.unknown, 1);
  assert.equal(result.periods[1].firstTouchChannels.chatgpt, undefined);
});

test('same parent, two children and three Indian phone spellings remain one identity', () => {
  const rows = [
    make('a', '9876543210', '2026-10-10T05:00:00Z'),
    make('b', '+91 98765 43210', '2026-10-11T05:00:00Z'),
    make('c', '0091 98765 43210', '2026-10-12T05:00:00Z'),
    make('d', '919876543210', '2026-10-13T05:00:00Z'),
  ];
  const result = cohort(rows, [october]).periods[0];
  assert.equal(result.firstObservedParentPhones, 1);
  assert.equal(result.laterLeadRowsForKnownParents, 3);
  assert.equal(result.datedLeadRows, 4);
});

test('international numbers with shared suffix are not collapsed into Indian identity', () => {
  const rows = [
    make('in', '9876543210', '2026-10-01T05:00:00Z'),
    make('uk', '+449876543210', '2026-10-02T05:00:00Z'),
    make('gb', '00449876543210', '2026-10-03T05:00:00Z'),
  ];
  const result = cohort(rows, [october]).periods[0];
  assert.equal(result.firstObservedParentPhones, 2);
  assert.equal(result.laterLeadRowsForKnownParents, 1);
});

test('invalid, conflicting and missing phones remain unresolved, never counted new', () => {
  const rows = [
    make('missing', '', '2026-10-02T04:00:00Z'),
    make('bad', '+++++++1', '2026-10-02T04:00:00Z'),
    make('short', '+91123', '2026-10-02T04:00:00Z'),
    make('conflict', '9876543210', '2026-10-02T04:00:00Z', { whatsappNumber: '+919999999999' }),
  ];
  const result = cohort(rows, [october]);
  assert.equal(result.periods[0].firstObservedParentPhones, 0);
  assert.equal(result.periods[0].unresolvedPhoneRows, 4);
  assert.equal(result.unresolvedIdentityRows, 4);
});

test('raw undecided concern is not counted as reading', () => {
  const rows = [make('a', '9876543210', '2026-10-02T04:00:00Z', {
    mainConcern: 'Not sure where to start', programInterest: 'Reading',
  })];
  const result = cohort(rows, [october]).periods[0];
  assert.equal(result.firstConcernGroups.undecided, 1);
  assert.equal(result.firstConcernGroups.reading, undefined);
});

test('IST midnight and timestamp fallback place earliest record in correct calendar period', () => {
  const rows = [
    make('before', '9876543210', undefined, { firstInquiryAt: null, receivedAt: new Date('2026-09-30T18:29:59Z') }),
    make('after', '9876543211', undefined, { firstInquiryAt: null, requestedAt: { seconds: Date.parse('2026-09-30T18:30:00Z') / 1000 } }),
  ];
  const result = cohort(rows, periods);
  assert.equal(result.periods[0].firstObservedParentPhones, 1);
  assert.equal(result.periods[1].firstObservedParentPhones, 1);
});

test('earlier archived historical lead still prevents false new-parent count later', () => {
  const rows = [
    make('old', '9876543210', '2026-09-20T04:00:00Z', { archived: true }),
    make('new', '9876543210', '2026-10-20T04:00:00Z'),
  ];
  const result = cohort(rows, periods);
  assert.equal(result.periods[0].firstObservedParentPhones, 1);
  assert.equal(result.periods[1].firstObservedParentPhones, 0);
  assert.equal(result.periods[1].laterLeadRowsForKnownParents, 1);
});

test('duplicate document IDs and missing timestamps are distinguished, not invented', () => {
  const rows = [
    make('a', '9876543210', '2026-10-04T04:00:00Z'),
    make('a', '9876543210', '2026-10-04T04:00:00Z'),
    make('timeless', '9876543211', null),
  ];
  const result = cohort(rows, [october]);
  assert.equal(result.duplicateDocumentRows, 1);
  assert.equal(result.missingTimestampRows, 1);
  assert.equal(result.periods[0].datedLeadRows, 1);
});

test('output is aggregate-only: does not echo input phones, names, ids or free text', () => {
  const rows = [make('private-doc-1', '9876543210', '2026-10-10T04:00:00Z', {
    parentName: 'Synthetic Parent Secret',
    childName: 'Synthetic Child Secret',
    landingPage: '/book-demo?name=Secret',
    acquisitionChannel: 'chatgpt',
  })];
  const out = cohort(rows, [october]);
  const json = JSON.stringify(out);
  for (const secret of ['9876543210', '+91', 'private-doc-1', 'Synthetic Parent Secret', 'Synthetic Child Secret', 'Secret']) {
    assert.equal(json.includes(secret), false, 'output must not contain private source values');
  }
  assert.equal(out.periods[0].firstTouchChannels.chatgpt, 1);
  assert.equal(out.historyIsComplete, false);
  assert.equal(out.status, 'OFFLINE_FIXTURE_ONLY_NOT_LIVE_APPROVED');
});

test('rejects invalid date windows and invalid record IDs', () => {
  assert.throws(() => cohort([], [{start:'2026-02-31',end:'2026-10-31'}]));
  assert.throws(() => cohort([], [{start:'2026-10-31',end:'2026-10-01'}]));
  assert.throws(() => cohort([{}], [october]));
});
