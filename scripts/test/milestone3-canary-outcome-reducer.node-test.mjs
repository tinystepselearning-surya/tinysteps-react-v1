import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyCanaryPointRead,
  summarizeCanaryPointReadEvidence,
} from '../milestone3-canary-outcome-reducer.mjs';

test('positive allow requires an existing server document; denied access is not success', () => {
  assert.equal(classifyCanaryPointRead('allow', 'allowed-existing').verdict, 'PASS');
  assert.equal(classifyCanaryPointRead('allow', 'allowed-missing').verdict, 'INCONCLUSIVE');
  assert.equal(classifyCanaryPointRead('allow', 'permission-denied').verdict, 'FAIL');
});

test('negative case passes only on permission-denied; missing-but-allowed stops', () => {
  assert.equal(classifyCanaryPointRead('deny', 'permission-denied').verdict, 'PASS');
  assert.equal(classifyCanaryPointRead('deny', 'allowed-existing').verdict, 'STOP');
  assert.equal(classifyCanaryPointRead('deny', 'allowed-missing').verdict, 'STOP');
});

test('network, auth and timeout failures are inconclusive, not authorization denials', () => {
  for (const observed of ['unauthenticated', 'network-error', 'timeout', 'other-error']) {
    for (const expectation of ['allow', 'deny']) {
      assert.equal(classifyCanaryPointRead(expectation, observed).verdict, 'INCONCLUSIVE');
    }
  }
});

test('invalid or ambiguous observations fail closed', () => {
  assert.equal(classifyCanaryPointRead('deny', 'missing').verdict, 'HOLD');
  assert.equal(classifyCanaryPointRead('allow-but-maybe', 'allowed-existing').verdict, 'HOLD');
});

test('synthetic six-role matrix summarizes without granting production permission', () => {
  const cases = [
    {ordinal: 1, role: 'admin', expectation: 'allow', observation: 'allowed-existing'},
    {ordinal: 2, role: 'founder', expectation: 'deny', observation: 'permission-denied'},
    {ordinal: 3, role: 'schoolAdmin', expectation: 'deny', observation: 'permission-denied'},
    {ordinal: 4, role: 'teacher', expectation: 'deny', observation: 'permission-denied'},
    {ordinal: 5, role: 'parent', expectation: 'deny', observation: 'permission-denied'},
    {ordinal: 6, role: 'learningPartner', expectation: 'deny', observation: 'permission-denied'},
  ];
  const r = summarizeCanaryPointReadEvidence(cases);
  assert.equal(r.verdict, 'PASS_REDACTED_EVIDENCE_ONLY');
  assert.equal(r.liveExecutionAuthorized, false);
  assert.equal(r.billedReadsMeasured, false);
  assert.equal(r.milestone3Exit, 'NOT_PASSED');
  assert.equal(r.counts.PASS, 6);
});

test('one unexpected grant halts the whole result even if another case fails validation', () => {
  const r = summarizeCanaryPointReadEvidence([
    {ordinal: 1, role: 'parent', expectation: 'deny', observation: 'allowed-missing'},
    {ordinal: 1, role: 'teacher', expectation: 'allow', observation: 'allowed-existing'},
  ]);
  assert.equal(r.verdict, 'STOP_UNEXPECTED_GRANT');
  assert.equal(r.unexpectedGrantStop, true);
  assert.equal(r.counts.HOLD, 1);
});

test('over 24 cases, duplicate ordinals and missing roles cannot be PASS', () => {
  const moreThanBudget = Array.from({length: 25}, (_, i) => ({
    ordinal: i + 1, role: 'teacher', expectation: 'deny', observation: 'permission-denied',
  }));
  assert.equal(summarizeCanaryPointReadEvidence(moreThanBudget).verdict,
    'HOLD_INVALID_OR_UNBOUNDED_EVIDENCE');
  assert.equal(summarizeCanaryPointReadEvidence([{ordinal: 1, role: 'unrecognized',
    expectation: 'deny', observation: 'permission-denied'}]).verdict,
    'HOLD_INVALID_OR_UNBOUNDED_EVIDENCE');
});

test('output never echoes private data, account IDs, document paths or error details', () => {
  const privateSentinel = 'sensitive-uid-example-M3PRIVATE';
  const r = summarizeCanaryPointReadEvidence([{
    ordinal: 3, role: 'parent', expectation: 'deny', observation: 'network-error',
    actorUid: privateSentinel, documentPath: 'parentWallets/' + privateSentinel,
    rawError: privateSentinel,
  }]);
  assert.equal(r.verdict, 'INCONCLUSIVE');
  assert.equal(JSON.stringify(r).includes(privateSentinel), false);
});

test('pure reducer has no Firebase SDK dependency, network, credential or execution hooks', async () => {
  const {readFile} = await import('node:fs/promises');
  const source = await readFile(new URL('../milestone3-canary-outcome-reducer.mjs', import.meta.url), 'utf8');
  for (const forbidden of ['firebase-admin', 'firebase/firestore', 'fetch(', 'process.env',
    'getDocFromServer(', '.collection(', 'setDoc(', 'updateDoc(', 'onCall(']) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});
