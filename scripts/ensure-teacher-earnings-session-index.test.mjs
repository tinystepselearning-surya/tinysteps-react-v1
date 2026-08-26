import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GcloudCommandError,
  ensureRequiredIndex,
  isRequiredIndex,
} from './ensure-teacher-earnings-session-index.mjs';

const requiredIndex = (state = 'READY') => ({
  name: 'projects/test/databases/(default)/collectionGroups/classSessions/indexes/required',
  queryScope: 'COLLECTION',
  state,
  fields: [
    { fieldPath: 'teacherId', order: 'ASCENDING' },
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
    ensureRequiredIndex({
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

test('READY teacherId+date index succeeds without mutation', async () => {
  const context = harness([[requiredIndex()]]);
  const result = await context.run();
  assert.equal(result.created, false);
  assert.equal(context.calls.length, 1);
  assert.equal(createCalls(context.calls).length, 0);
});

test('missing teacherId+date index is created once and polled until READY', async () => {
  const context = harness([[], '', [requiredIndex('CREATING')], [requiredIndex()]]);
  const result = await context.run();
  assert.equal(result.created, true);
  assert.equal(createCalls(context.calls).length, 1);
  const createArgs = createCalls(context.calls)[0];
  assert.ok(createArgs.includes('--field-config=field-path=teacherId,order=ascending'));
  assert.ok(createArgs.includes('--field-config=field-path=date,order=ascending'));
  assert.match(context.logs.join('\n'), /CREATING/);
});

test('existing building index is only polled and never recreated', async () => {
  const context = harness([[requiredIndex('CREATING')], [requiredIndex()]]);
  const result = await context.run();
  assert.equal(result.created, false);
  assert.equal(createCalls(context.calls).length, 0);
});

test('similar teacherId+date+startTime index is not treated as the required index', () => {
  const extraField = requiredIndex();
  extraField.fields.splice(2, 0, { fieldPath: 'startTime', order: 'ASCENDING' });
  assert.equal(isRequiredIndex(extraField), false);
});

test('wrong field order is rejected', () => {
  const wrong = requiredIndex();
  wrong.fields[1].order = 'DESCENDING';
  assert.equal(isRequiredIndex(wrong), false);
});

test('permission denied reports the required index-admin role', async () => {
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

test('ALREADY_EXISTS race waits for the concurrent index build', async () => {
  const conflict = new GcloudCommandError(['firestore', 'indexes', 'composite', 'create'], {
    status: 1,
    stderr: 'ALREADY_EXISTS: index already exists',
  });
  const context = harness([[], conflict, [requiredIndex('CREATING')], [requiredIndex()]]);
  const result = await context.run();
  assert.equal(result.created, false);
  assert.equal(createCalls(context.calls).length, 1);
  assert.match(context.logs.join('\n'), /created concurrently/);
});

test('unexpected list responses fail closed', async () => {
  const context = harness(['{}']);
  await assert.rejects(context.run(), /unexpected non-array response/);
  assert.equal(createCalls(context.calls).length, 0);
});
