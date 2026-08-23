import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GcloudCommandError,
  ensureRequiredIndex,
  isRequiredIndex,
} from './ensure-parent-month-attendance-index.mjs';

const requiredIndex = (state = 'READY') => ({
  name: 'projects/test/databases/(default)/collectionGroups/classSessions/indexes/required',
  queryScope: 'COLLECTION',
  state,
  fields: [
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

test('READY index succeeds without mutation', async () => {
  const context = harness([[requiredIndex()]]);
  const result = await context.run();
  assert.equal(result.created, false);
  assert.equal(context.calls.length, 1);
  assert.equal(createCalls(context.calls).length, 0);
});

test('missing index is created once and polled until READY', async () => {
  const context = harness([[], '', [requiredIndex('CREATING')], [requiredIndex()]]);
  const result = await context.run();
  assert.equal(result.created, true);
  assert.equal(createCalls(context.calls).length, 1);
  assert.match(context.logs.join('\n'), /CREATING/);
});

test('existing building index is only polled and never recreated', async () => {
  const context = harness([[requiredIndex('CREATING')], [requiredIndex()]]);
  const result = await context.run();
  assert.equal(result.created, false);
  assert.equal(createCalls(context.calls).length, 0);
});

test('permission denied reports the exact role and create permission', async () => {
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

test('permission denied during create reports the exact role and create permission', async () => {
  const denied = new GcloudCommandError(['firestore', 'indexes', 'composite', 'create'], {
    status: 1,
    stderr: 'PERMISSION_DENIED: The caller does not have permission',
  });
  const context = harness([[], denied]);
  await assert.rejects(
    context.run(),
    /roles\/datastore\.indexAdmin[\s\S]*datastore\.indexes\.create/,
  );
  assert.equal(createCalls(context.calls).length, 1);
});

test('ALREADY_EXISTS race does not issue a duplicate create', async () => {
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

test('same fields with the wrong order are not treated as the required index', () => {
  const wrongOrder = requiredIndex();
  wrongOrder.fields[1].order = 'DESCENDING';
  assert.equal(isRequiredIndex(wrongOrder), false);
});

test('similar but non-identical indexes are rejected', () => {
  const extraField = requiredIndex();
  extraField.fields.splice(2, 0, { fieldPath: 'status', order: 'ASCENDING' });
  const wrongScope = { ...requiredIndex(), queryScope: 'COLLECTION_GROUP' };
  const wrongCollection = {
    ...requiredIndex(),
    name: 'projects/test/databases/(default)/collectionGroups/payments/indexes/required',
  };
  assert.equal(isRequiredIndex(extraField), false);
  assert.equal(isRequiredIndex(wrongScope), false);
  assert.equal(isRequiredIndex(wrongCollection), false);
});

test('unexpected list response fails closed instead of creating an index', async () => {
  const context = harness(['{}']);
  await assert.rejects(context.run(), /unexpected non-array response/);
  assert.equal(createCalls(context.calls).length, 0);
});

test('empty list response fails closed instead of creating an index', async () => {
  const context = harness(['']);
  await assert.rejects(context.run(), /empty response/);
  assert.equal(createCalls(context.calls).length, 0);
});

test('malformed list JSON fails closed instead of creating an index', async () => {
  const context = harness(['not-json']);
  await assert.rejects(context.run(), /malformed JSON/);
  assert.equal(createCalls(context.calls).length, 0);
});

test('non-permission command failures propagate without being mislabeled', async () => {
  const failure = new GcloudCommandError(['firestore', 'indexes', 'composite', 'list'], {
    status: 1,
    stderr: 'UNAVAILABLE: transient backend failure',
  });
  const context = harness([failure]);
  await assert.rejects(context.run(), /failed with exit code 1/);
});
