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

test('blog post-only change uses the narrow content validation lane', () => {
  const result = impact(['src/content/blog/posts/phonics/example.ts']);
  assert.equal(result.contentOnlyValidation, true);
  assert.equal(result.frontendValidationRequired, true);
  assert.equal(result.hostingChanged, true);
});

test('blog post plus blog SEO regression stays in the narrow content lane', () => {
  const result = impact([
    'src/content/blog/posts/phonics/example.ts',
    'src/tests/seo/blogQualityExample.spec.ts',
  ]);
  assert.equal(result.contentOnlyValidation, true);
});

test('shared blog runtime or application changes fail closed to full validation', () => {
  assert.equal(impact(['src/content/blog/shared/authorityLinking.ts']).contentOnlyValidation, false);
  assert.equal(impact(['src/content/blog/posts/phonics/example.ts', 'src/App.tsx']).contentOnlyValidation, false);
  assert.equal(impact(['src/content/blog/posts/phonics/example.ts', 'src/pages/admin/Finance.tsx']).contentOnlyValidation, false);
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

test('index export topology change requires a full deployment', () => {
  assert.equal(impact(['functions/src/index.ts']).fullDeployment, true);
});

test('pure additive index export deploys only the new Function target', () => {
  const before = sources();
  const after = sources({
    'functions/src/newFunction.ts': 'export const newFunction = 1;',
  });
  after.set('functions/src/index.ts', `
    export { functionA } from './functionA';
    export { functionB } from './functionB';
    export { functionC } from './nested/functionC';
    export { newFunction } from './newFunction';
  `);

  const result = impact(
    ['functions/src/index.ts', 'functions/src/newFunction.ts'],
    {beforeSources: before, afterSources: after},
  );

  assert.equal(result.fullDeployment, false);
  assert.equal(result.functionsDeploymentRequired, true);
  assert.deepEqual(result.impactedFunctions, ['newFunction']);
  assert.match(result.reasons.newFunction.join(' '), /newly exported|directly exports/);
});

test('additive export of an existing unchanged module still deploys the new Function target', () => {
  const before = sources({
    'functions/src/newFunction.ts': 'export const newFunction = 1;',
  });
  const after = new Map(before);
  after.set('functions/src/index.ts', `
    export { functionA } from './functionA';
    export { functionB } from './functionB';
    export { functionC } from './nested/functionC';
    export { newFunction } from './newFunction';
  `);

  const result = resolveFunctionsImpact({
    changedFiles: ['functions/src/index.ts'],
    beforeSources: before,
    afterSources: after,
    beforeFirebase: firebase,
    afterFirebase: firebase,
  });

  assert.equal(result.fullDeployment, false);
  assert.deepEqual(result.impactedFunctions, ['newFunction']);
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

test('Firestore index-only change is detected for deployment without marking rules changed', () => {
  const result = impact(['firestore.indexes.json']);
  assert.equal(result.firestoreIndexesChanged, true);
  assert.equal(result.firestoreRulesChanged, false);
  assert.equal(result.firestoreValidationRequired, true);
  assert.equal(result.functionsDeploymentRequired, false);
  assert.equal(result.hostingChanged, false);
});

test('firebase hosting config changes only the Hosting artifact', () => {
  const after = { ...firebase, hosting: { public: 'different' } };
  const result = classifyArtifactChanges(['firebase.json'], firebase, after);
  assert.equal(result.hostingChanged, true);
  assert.equal(result.firestoreRulesChanged, false);
  assert.equal(result.functionsSourceChanged, false);
});
