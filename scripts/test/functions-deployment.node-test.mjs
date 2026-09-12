import test from 'node:test';
import assert from 'node:assert/strict';
import {
  discoverEndpointPlan, batch, classifyFailure, terminalFailedTargets, digestBoundedOutput,
  normalizeRevisionId,
} from '../deployment/functions-deployment-lib.mjs';

const fn = (entryPoint, region = ['asia-south1'], platform = 'gcfv2') => ({ __endpoint: { entryPoint, region, platform } });

test('discovers and sorts compiled v2 asia-south1 exports', () => {
  const plan = discoverEndpointPlan({ z: fn('zFn'), a: fn('aFn'), helper: {} });
  assert.deepEqual(plan.map(x => x.id), ['a', 'z']);
  assert.equal(plan[0].selector, 'functions:a');
});

test('fails closed on unexpected region or platform', () => {
  assert.throws(() => discoverEndpointPlan({ a: fn('a', ['us-central1']) }), /Unexpected region topology/);
  assert.throws(() => discoverEndpointPlan({ a: fn('a', ['asia-south1'], 'gcfv1') }), /Unsupported platform/);
});

test('batches deterministically in groups of five', () => {
  assert.deepEqual(batch([1,2,3,4,5,6,7,8,9,10,11]), [[1,2,3,4,5],[6,7,8,9,10],[11]]);
});

test('normalizes short and fully-qualified Cloud Run revision identifiers', () => {
  const id = 'adminadjustparentwallet-00100-fiz';
  const full = `projects/tinysteps-react-v1/locations/asia-south1/services/adminadjustparentwallet/revisions/${id}`;
  assert.equal(normalizeRevisionId(id), id);
  assert.equal(normalizeRevisionId(full), id);
  assert.equal(normalizeRevisionId(`/${full}/`), id);
  assert.equal(normalizeRevisionId(null), '');
});

test('extracts terminal failed targets and retries only transient failures', () => {
  const out = `Error: quota exceeded with HTTP 429 while updating alpha\nFunctions deploy had errors with the following functions:\n  alpha(asia-south1)\n`;
  assert.deepEqual(terminalFailedTargets(out, ['alpha','beta']), ['alpha']);
  assert.deepEqual(classifyFailure(out, ['alpha','beta']), {
    retryable: true, reason: 'transient-quota-or-rate-limit', failedTargets: ['alpha'],
  });
});

test('does not retry unknown or permission failures', () => {
  const unknown = `Error updating alpha\nFunctions deploy had errors with the following functions:\n alpha(asia-south1)`;
  assert.equal(classifyFailure(unknown, ['alpha']).retryable, false);
  const denied = `PERMISSION_DENIED for alpha; quota 429\nFunctions deploy had errors with the following functions:\n alpha(asia-south1)`;
  assert.equal(classifyFailure(denied, ['alpha']).reason, 'permanent-or-mixed-failure');
});

test('report stores digest metadata, not raw output', () => {
  const d = digestBoundedOutput('secret-ish raw output');
  assert.equal(d.bytes, 21);
  assert.match(d.sha256, /^[a-f0-9]{64}$/);
  assert.equal('output' in d, false);
});
