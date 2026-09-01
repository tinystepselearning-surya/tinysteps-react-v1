import assert from 'node:assert/strict';
import test from 'node:test';

import { GcloudCommandError } from './ensure-parent-month-attendance-index.mjs';
import {
  ensureParentDashboardQueryBIndex,
  isRequiredQueryBIndex,
} from './ensure-parent-dashboard-query-b-index.mjs';

const requiredIndex = (state = 'READY') => ({
  name: 'projects/test/databases/(default)/collectionGroups/classSessions/indexes/query-b',
  queryScope: 'COLLECTION',
  state,
  fields: [
    { fieldPath: 'kidId', order: 'ASCENDING' },
    { fieldPath: 'parentId', order: 'ASCENDING' },
    { fieldPath: 'date', order: 'ASCENDING' },
    { fieldPath: '__name__', order: 'ASCENDING' },
  ],
});

const harness = (responses) => {
  const calls = [];
  const logs = [];
  let clock = 0;
  const runGcloud = (args) => {
    calls.push(args);
    const response = responses.shift();
    if (response instanceof Error) throw response;
    return typeof response === 'string' ? response : JSON.stringify(response ?? []);
  };
  const run = () =>
    ensureParentDashboardQueryBIndex({
      project: 'test-project',
      runGcloud,
      pollIntervalMs: 1,
      maxWaitMs: 20,
      sleep: async (durationMs) => {
        clock += durationMs;
      },
      now: () => clock,
      log: (message) => logs.push(message),
    });
  return { calls, logs, run };
};

const createCalls = (calls) => calls.filter((args) => args.includes('create'));

test('recognizes the exact ParentDashboard Query B index', () => {
  assert.equal(isRequiredQueryBIndex(requiredIndex()), true);
});

test('rejects a similar index missing parentId', () => {
  const wrong = requiredIndex();
  wrong.fields = wrong.fields.filter((field) => field.fieldPath !== 'parentId');
  assert.equal(isRequiredQueryBIndex(wrong), false);
});

test('READY Query B index succeeds without mutation', async () => {
  const context = harness([[requiredIndex()]]);
  const result = await context.run();
  assert.equal(result.created, false);
  assert.equal(createCalls(context.calls).length, 0);
});

test('missing Query B index is created once and polled until READY', async () => {
  const context = harness([[], '', [requiredIndex('CREATING')], [requiredIndex()]]);
  const result = await context.run();
  assert.equal(result.created, true);
  assert.equal(createCalls(context.calls).length, 1);
  const createArgs = createCalls(context.calls)[0].join(' ');
  assert.match(createArgs, /field-path=kidId,order=ascending/);
  assert.match(createArgs, /field-path=parentId,order=ascending/);
  assert.match(createArgs, /field-path=date,order=ascending/);
});

test('permission denied fails closed with indexAdmin guidance', async () => {
  const denied = new GcloudCommandError(['firestore', 'indexes', 'composite', 'list'], {
    status: 1,
    stderr: 'PERMISSION_DENIED: The caller does not have permission',
  });
  const context = harness([denied]);
  await assert.rejects(
    context.run(),
    /roles\/datastore\.indexAdmin[\s\S]*datastore\.indexes\.create/,
  );
  assert.equal(createCalls(context.calls).length, 0);
});

test('existing building Query B index is only polled', async () => {
  const context = harness([[requiredIndex('CREATING')], [requiredIndex()]]);
  const result = await context.run();
  assert.equal(result.created, false);
  assert.equal(createCalls(context.calls).length, 0);
});
