import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyArtifactChanges,
  extractLocalSpecifiers,
  resolveFunctionsImpact,
} from '../deployment/functions-impact-lib.mjs';

const firebase = {
  functions: { source: 'functions', runtime: 'nodejs22' },
  hosting: { public: 'dist' },
  firestore: { rules: 'firestore.rules', indexes: 'firestore.indexes.json' },
};

function sources(extra = {}) {
  return new Map(Object.entries({
    'functions/src/index.ts': `
      export { functionA } from './functionA';
      export { functionB } from './functionB';
      export { functionC } from './nested/functionC';
    `,
    'functions/src/functionA.ts': `import { direct } from './direct'; export const functionA = direct;`,
    'functions/src/functionB.ts': `import { shared } from './shared'; export const functionB = shared;`,
    'functions/src/nested/functionC.ts': `import { shared } from '../shared'; export const functionC = shared;`,
    'functions/src/direct.ts': `import { leaf } from './leaf'; export const direct = leaf;`,
    'functions/src/leaf.ts': 'export const leaf = 1;',
    'functions/src/shared.ts': 'export const shared = 1;',
    'functions/src/unreferenced.ts': 'export const value = 1;',
    ...extra,
  }));
}

function impact(changedFiles, options = {}) {
  return resolveFunctionsImpact({
    changedFiles,
    beforeSources: options.beforeSources ?? sources(),
    afterSources: options.afterSources ?? sources(),
    beforeFirebase: options.beforeFirebase ?? firebase,
    afterFirebase: options.afterFirebase ?? firebase,
  });
}

test('parses static local TypeScript dependency forms', () => {
  assert.deepEqual(extractLocalSpecifiers(`
    import type { A } from './a';
    import './side';
    export { b } from './b';
    const c = require('./c');
    const d = import('./d');
    import { external } from 'package';
  `).sort(), ['./a', './b', './c', './d', './side']);
});

test('docs-only change deploys no Functions', () => {
  assert.equal(impact(['docs/readme.md']).functionsDeploymentRequired, false);
});

test('frontend-only change deploys no Functions', () => {
  const result = impact(['src/App.tsx']);
  assert.equal(result.functionsDeploymentRequired, false);
  assert.equal(result.hostingChanged, true);
});

test('Functions test-only change validates but deploys no Functions', () => {
  const result = impact(['functions/test/example.spec.ts']);
  assert.equal(result.functionsValidationRequired, true);
  assert.equal(result.functionsDeploymentRequired, false);
});

test('unreferenced Functions library change has zero deployed targets', () => {
  assert.deepEqual(impact(['functions/src/unreferenced.ts']).impactedFunctions, []);
});

test('direct Function implementation change selects exactly its exported target', () => {
  assert.deepEqual(impact(['functions/src/functionA.ts']).impactedFunctions, ['functionA']);
});

test('shared helper used by two Functions selects only those two', () => {
  assert.deepEqual(impact(['functions/src/shared.ts']).impactedFunctions, ['functionB', 'functionC']);
});

test('transitive dependency change selects all and only affected Functions', () => {
  assert.deepEqual(impact(['functions/src/leaf.ts']).impactedFunctions, ['functionA']);
});

for (const globalFile of ['functions/package.json', 'functions/package-lock.json']) {
  test(`${globalFile} requires a known global Functions deployment`, () => {
    const result = impact([globalFile]);
    assert.equal(result.fullDeployment, true);
    assert.match(result.fullDeploymentReason, /known-global-impact/);
  });
}

test('Functions runtime/config change requires a full deployment', () => {
  const result = impact(['firebase.json'], {
    afterFirebase: { ...firebase, functions: { ...firebase.functions, runtime: 'nodejs24' } },
  });
  assert.equal(result.fullDeployment, true);
});

test('additive index export topology change deploys only the new Function', () => {
  const after = sources({
    'functions/src/functionD.ts': 'export const functionD = 1;',
  });
  after.set('functions/src/index.ts', `
    export { functionA } from './functionA';
    export { functionB } from './functionB';
    export { functionC } from './nested/functionC';
    export { functionD } from './functionD';
  `);
  const result = impact(
    ['functions/src/index.ts', 'functions/src/functionD.ts'],
    {afterSources: after},
  );
  assert.equal(result.fullDeployment, false);
  assert.deepEqual(result.impactedFunctions, ['functionD']);
});

test('moving an existing index export root remains a full deployment', () => {
  const after = sources({
    'functions/src/functionA2.ts': 'export const functionA = 2;',
  });
  after.set('functions/src/index.ts', `
    export { functionA } from './functionA2';
    export { functionB } from './functionB';
    export { functionC } from './nested/functionC';
  `);
  const result = impact(
    ['functions/src/index.ts', 'functions/src/functionA2.ts'],
    {afterSources: after},
  );
  assert.equal(result.fullDeployment, true);
  assert.match(result.fullDeploymentReason, /non-additive-export-topology/);
});

test('changing an export binding inside the same root module remains a full deployment', () => {
  const before = sources({
    'functions/src/functionA.ts': `
      export const functionA = 1;
      export const alternateA = 2;
    `,
  });
  const after = new Map(before);
  after.set('functions/src/index.ts', `
    export { alternateA as functionA } from './functionA';
    export { functionB } from './functionB';
    export { functionC } from './nested/functionC';
  `);
  const result = impact(
    ['functions/src/index.ts'],
    {beforeSources: before, afterSources: after},
  );
  assert.equal(result.fullDeployment, true);
  assert.match(result.fullDeploymentReason, /changed:functionA/);
});

test('removing an index export still requires a full deployment so the retired Function is deleted', () => {
  const after = sources();
  after.set('functions/src/index.ts', `
    export { functionA } from './functionA';
    export { functionB } from './functionB';
  `);
  const result = impact(['functions/src/index.ts'], {afterSources: after});
  assert.equal(result.fullDeployment, true);
  assert.match(result.fullDeploymentReason, /removed:functionC/);
});

test('deleted source module finds dependents in the before graph', () => {
  const after = sources();
  after.delete('functions/src/leaf.ts');
  after.set('functions/src/direct.ts', 'export const direct = 1;');
  assert.deepEqual(impact(['functions/src/leaf.ts', 'functions/src/direct.ts'], { afterSources: after }).impactedFunctions, ['functionA']);
});

test('renamed source module uses the union of before and after graphs', () => {
  const after = sources({ 'functions/src/renamedLeaf.ts': 'export const leaf = 1;' });
  after.delete('functions/src/leaf.ts');
  after.set('functions/src/direct.ts', `import { leaf } from './renamedLeaf'; export const direct = leaf;`);
  assert.deepEqual(impact(['functions/src/leaf.ts', 'functions/src/renamedLeaf.ts', 'functions/src/direct.ts'], { afterSources: after }).impactedFunctions, ['functionA']);
});

test('unknown local dependency resolution fails closed with a diagnostic', () => {
  const broken = sources({ 'functions/src/functionA.ts': `import { missing } from './missing'; export const functionA = missing;` });
  assert.throws(() => impact(['functions/src/functionA.ts'], { beforeSources: broken, afterSources: broken }), /Ambiguous dependency graph/);
});

test('duplicate target handling is deterministic', () => {
  const result = impact(['functions/src/shared.ts', 'functions/src/shared.ts']);
  assert.deepEqual(result.impactedFunctions, ['functionB', 'functionC']);
});

test('no changed files produces no validation or deployment', () => {
  const result = impact([]);
  assert.equal(result.functionsValidationRequired, false);
  assert.equal(result.functionsDeploymentRequired, false);
});

test('mixed frontend and one Function change keeps artifact decisions independent', () => {
  const result = impact(['src/App.tsx', 'functions/src/functionA.ts']);
  assert.deepEqual(result.impactedFunctions, ['functionA']);
  assert.equal(result.hostingChanged, true);
});

test('mixed Firestore rules and Function change keeps artifact decisions independent', () => {
  const result = impact(['firestore.rules', 'functions/src/functionA.ts']);
  assert.deepEqual(result.impactedFunctions, ['functionA']);
  assert.equal(result.firestoreRulesChanged, true);
});

test('firebase hosting config changes only the Hosting artifact', () => {
  const after = { ...firebase, hosting: { public: 'different' } };
  const result = classifyArtifactChanges(['firebase.json'], firebase, after);
  assert.equal(result.hostingChanged, true);
  assert.equal(result.firestoreRulesChanged, false);
  assert.equal(result.functionsSourceChanged, false);
});
