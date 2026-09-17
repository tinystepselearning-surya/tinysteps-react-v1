import test from 'node:test';
import assert from 'node:assert/strict';
import {assertReadOnlyRequest} from './audit-production-schedule-brick0.mjs';

const root = '/v1/projects/tinysteps-react-v1/databases/(default)/documents';

test('Brick 0 allows Firestore read endpoints used by the audit', () => {
  assert.doesNotThrow(() => assertReadOnlyRequest('GET', 'firestore.googleapis.com', `${root}/enrollments?pageSize=10`));
  assert.doesNotThrow(() => assertReadOnlyRequest('POST', 'firestore.googleapis.com', `${root}:runQuery`));
  assert.doesNotThrow(() => assertReadOnlyRequest('POST', 'firestore.googleapis.com', `${root}:batchGet`));
});

test('Brick 0 blocks Firestore mutations and non-Firestore hosts', () => {
  for (const [method, host, url] of [
    ['POST', 'firestore.googleapis.com', `${root}:commit`],
    ['POST', 'firestore.googleapis.com', `${root}:batchWrite`],
    ['PATCH', 'firestore.googleapis.com', `${root}/enrollments/abc`],
    ['DELETE', 'firestore.googleapis.com', `${root}/enrollments/abc`],
    ['GET', 'example.com', `${root}/enrollments`],
  ]) {
    assert.throws(() => assertReadOnlyRequest(method, host, url), /read-only guard rejected/);
  }
});
