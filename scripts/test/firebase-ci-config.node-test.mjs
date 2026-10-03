import test from 'node:test';
import assert from 'node:assert/strict';
import { stripPredeployHooks } from '../prepare-firebase-ci-config.mjs';

test('CI Firebase config strips Hosting and Functions predeploy hooks without mutating source', () => {
  const source = {
    hosting: { public: 'dist', predeploy: ['npm run build'], headers: [{ source: '/**' }] },
    functions: { source: 'functions', runtime: 'nodejs22', predeploy: ['npm run lint', 'npm run build'] },
    firestore: { rules: 'firestore.rules', indexes: 'firestore.indexes.json' },
  };

  const prepared = stripPredeployHooks(source);

  assert.deepEqual(source.hosting.predeploy, ['npm run build']);
  assert.deepEqual(source.functions.predeploy, ['npm run lint', 'npm run build']);
  assert.equal(prepared.hosting.public, 'dist');
  assert.equal(prepared.functions.source, 'functions');
  assert.equal(prepared.functions.runtime, 'nodejs22');
  assert.equal('predeploy' in prepared.hosting, false);
  assert.equal('predeploy' in prepared.functions, false);
  assert.deepEqual(prepared.firestore, source.firestore);
});

test('CI Firebase config handles multi-site and multi-codebase arrays', () => {
  const prepared = stripPredeployHooks({
    hosting: [
      { site: 'one', public: 'dist-one', predeploy: ['build-one'] },
      { site: 'two', public: 'dist-two', predeploy: ['build-two'] },
    ],
    functions: [
      { source: 'functions-a', codebase: 'a', predeploy: ['build-a'] },
      { source: 'functions-b', codebase: 'b', predeploy: ['build-b'] },
    ],
  });

  assert.equal(prepared.hosting.every(entry => !('predeploy' in entry)), true);
  assert.equal(prepared.functions.every(entry => !('predeploy' in entry)), true);
});
