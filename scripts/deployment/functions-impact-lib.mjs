import path from 'node:path';

const SOURCE_ROOT = 'functions/src';
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
const INTENTIONALLY_RETIRED_FUNCTION_EXPORTS = new Set(['runAv2TeamsEvidenceProof']);

function posix(value) {
  return value.replaceAll('\\', '/').replace(/^\.\//, '');
}

export function isFunctionsTestPath(file) {
  const name = posix(file);
  return name.startsWith('functions/test/')
    || name.includes('/__tests__/')
    || /\.(?:spec|test)\.[cm]?[jt]sx?$/.test(name);
}

export function extractLocalSpecifiers(source) {
  const found = [];
  const patterns = [
    /\b(?:import|export)\s+(?:type\s+)?[\s\S]*?\sfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\b(?:import|require)\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (match[1].startsWith('.')) found.push(match[1]);
    }
  }
  return [...new Set(found)];
}

function resolveLocalImport(importer, specifier, sourceFiles) {
  const base = posix(path.posix.normalize(path.posix.join(path.posix.dirname(importer), specifier)));
  const candidates = [base];
  const explicitExtension = SOURCE_EXTENSIONS.find(extension => base.endsWith(extension));
  if (explicitExtension) {
    const withoutExtension = base.slice(0, -explicitExtension.length);
    for (const extension of SOURCE_EXTENSIONS) candidates.push(`${withoutExtension}${extension}`);
  }
  for (const extension of SOURCE_EXTENSIONS) candidates.push(`${base}${extension}`);
  for (const extension of SOURCE_EXTENSIONS) candidates.push(`${base}/index${extension}`);
  const matches = candidates.filter(candidate => sourceFiles.has(candidate));
  if (matches.length !== 1) {
    throw new Error(`Unable to resolve local import ${specifier} from ${importer} (${matches.length} matches)`);
  }
  return matches[0];
}

export function parseIndexRoots(indexSource, sourceFiles) {
  const roots = new Map();
  const declaration = /\bexport\s*{([\s\S]*?)}\s*from\s*['"]([^'"]+)['"]/g;
  for (const match of indexSource.matchAll(declaration)) {
    if (!match[2].startsWith('.')) continue;
    const modulePath = resolveLocalImport(`${SOURCE_ROOT}/index.ts`, match[2], sourceFiles);
    for (const raw of match[1].split(',')) {
      const item = raw.replace(/\/\*[\s\S]*?\*\//g, '').trim();
      if (!item || item.startsWith('type ')) continue;
      const alias = item.split(/\s+as\s+/);
      const exportName = (alias[1] || alias[0]).trim();
      if (!/^[A-Za-z_$][\w$]*$/.test(exportName)) throw new Error(`Unsupported index export syntax: ${item}`);
      if (roots.has(exportName)) throw new Error(`Duplicate Functions export in index.ts: ${exportName}`);
      roots.set(exportName, modulePath);
    }
  }
  if (/\bexport\s*\*/.test(indexSource)) throw new Error('functions/src/index.ts uses unsupported export-star topology');
  if (!roots.size) throw new Error('No explicit Function roots found in functions/src/index.ts');
  return roots;
}

export function buildDependencyGraph(sourceMap) {
  const files = new Set(sourceMap.keys());
  const imports = new Map();
  const reverse = new Map();
  const unresolved = new Map();
  for (const [file, source] of sourceMap) {
    const dependencies = [];
    for (const specifier of extractLocalSpecifiers(source)) {
      try {
        dependencies.push(resolveLocalImport(file, specifier, files));
      } catch (error) {
        if (!unresolved.has(file)) unresolved.set(file, []);
        unresolved.get(file).push(error instanceof Error ? error.message : String(error));
      }
    }
    imports.set(file, [...new Set(dependencies)]);
    for (const dependency of dependencies) {
      if (!reverse.has(dependency)) reverse.set(dependency, new Set());
      reverse.get(dependency).add(file);
    }
  }
  const indexSource = sourceMap.get(`${SOURCE_ROOT}/index.ts`);
  if (indexSource === undefined) throw new Error('functions/src/index.ts is missing');
  return { imports, reverse, unresolved, roots: parseIndexRoots(indexSource, files) };
}

function rootReachability(graph) {
  const rootsByFile = new Map();
  for (const [id, rootFile] of graph.roots) {
    const visited = new Set();
    const stack = [rootFile];
    while (stack.length) {
      const file = stack.pop();
      if (visited.has(file)) continue;
      visited.add(file);
      if (graph.unresolved.get(file)?.length) {
        throw new Error(`Ambiguous dependency graph at deployed Function module ${file}: ${graph.unresolved.get(file).join('; ')}`);
      }
      if (!rootsByFile.has(file)) rootsByFile.set(file, new Set());
      rootsByFile.get(file).add(id);
      for (const dependency of graph.imports.get(file) ?? []) stack.push(dependency);
    }
  }
  return rootsByFile;
}

function configChanged(beforeConfig, afterConfig, key) {
  return JSON.stringify(beforeConfig?.[key] ?? null) !== JSON.stringify(afterConfig?.[key] ?? null);
}

export function classifyArtifactChanges(changedFiles, beforeFirebase = {}, afterFirebase = {}) {
  const files = changedFiles.map(posix);
  const functionsSourceChanged = files.some(file => file.startsWith(`${SOURCE_ROOT}/`) && !isFunctionsTestPath(file));
  const functionsPathChanged = files.some(file => file === 'functions' || file.startsWith('functions/'));
  const functionsConfigChanged = configChanged(beforeFirebase, afterFirebase, 'functions');
  const firestoreConfigChanged = configChanged(beforeFirebase, afterFirebase, 'firestore');
  const hostingConfigChanged = configChanged(beforeFirebase, afterFirebase, 'hosting');
  const contentOnlyValidation = files.length > 0 && files.every(file =>
    file.startsWith('src/content/blog/posts/')
      || /^src\/tests\/seo\/blog[^/]*\.spec\.[cm]?[jt]sx?$/.test(file));
  const functionsValidationRequired = functionsPathChanged || functionsConfigChanged
    || files.some(file => file === 'scripts/deploy-functions-batched.mjs'
      || file.startsWith('scripts/deployment/')
      || file === 'scripts/test/functions-deployment.node-test.mjs'
      || file === '.github/workflows/deploy.yml');
  const firestoreRulesChanged = firestoreConfigChanged || files.some(file =>
    file === 'firestore.rules' || file === 'firestore.indexes.json' || file.startsWith('src/tests/firestore/'));
  const frontendValidationRequired = hostingConfigChanged || files.some(file =>
    file === 'package.json' || file === 'package-lock.json' || file === 'index.html'
      || file.startsWith('src/') || file.startsWith('public/') || file.startsWith('e2e/')
      || /^(?:vite|vitest|playwright|tsconfig|eslint)[^/]*\.(?:js|mjs|cjs|ts|json)$/.test(file)
      || file.startsWith('scripts/') || file === '.github/workflows/deploy.yml');
  const hostingChanged = hostingConfigChanged || files.some(file =>
    file === 'package.json' || file === 'package-lock.json' || file === 'index.html'
      || file.startsWith('src/') || file.startsWith('public/')
      || /^(?:vite|tsconfig)[^/]*\.(?:js|mjs|cjs|ts|json)$/.test(file)
      || file.startsWith('scripts/seo-') || file.startsWith('scripts/generate-')
      || file.startsWith('scripts/audit-') || file.startsWith('scripts/write-')
      || file.startsWith('scripts/check-') || file.startsWith('scripts/public-')
      || file.startsWith('scripts/verify-public-'));
  return {
    functionsSourceChanged,
    functionsValidationRequired,
    frontendValidationRequired,
    contentOnlyValidation,
    firestoreValidationRequired: firestoreRulesChanged,
    hostingChanged,
    firestoreRulesChanged,
  };
}

export function resolveFunctionsImpact({ changedFiles, beforeSources, afterSources, beforeFirebase = {}, afterFirebase = {} }) {
  const artifacts = classifyArtifactChanges(changedFiles, beforeFirebase, afterFirebase);
  const result = {
    ...artifacts,
    functionsDeploymentRequired: false,
    fullDeployment: false,
    fullDeploymentReason: null,
    impactedFunctions: [],
    retiredFunctions: [],
    reasons: {},
  };
  const files = [...new Set(changedFiles.map(posix))];
  const beforeGraph = beforeSources?.size ? buildDependencyGraph(beforeSources) : null;
  const afterGraph = afterSources?.size ? buildDependencyGraph(afterSources) : null;
  const removedRoots = beforeGraph && afterGraph
    ? [...beforeGraph.roots.keys()].filter(id => !afterGraph.roots.has(id)).sort()
    : [];
  const addedRoots = beforeGraph && afterGraph
    ? [...afterGraph.roots.keys()].filter(id => !beforeGraph.roots.has(id)).sort()
    : [];
  const movedRoots = beforeGraph && afterGraph
    ? [...beforeGraph.roots.keys()].filter(id =>
      afterGraph.roots.has(id) && beforeGraph.roots.get(id) !== afterGraph.roots.get(id)).sort()
    : [];
  const indexChanged = files.includes(`${SOURCE_ROOT}/index.ts`);
  const retiredOnlyTopologyChange = indexChanged
    && removedRoots.length > 0
    && removedRoots.every(id => INTENTIONALLY_RETIRED_FUNCTION_EXPORTS.has(id))
    && addedRoots.length === 0
    && movedRoots.length === 0;
  const additiveOnlyTopologyChange = indexChanged
    && addedRoots.length > 0
    && removedRoots.length === 0
    && movedRoots.length === 0;
  const safelyTargetableIndexTopologyChange =
    retiredOnlyTopologyChange || additiveOnlyTopologyChange;
  if (retiredOnlyTopologyChange) result.retiredFunctions = removedRoots;

  const globals = files.filter(file => file === 'functions/package.json'
    || file === 'functions/package-lock.json'
    || /^functions\/tsconfig[^/]*\.json$/.test(file));
  if (JSON.stringify(beforeFirebase?.functions ?? null) !== JSON.stringify(afterFirebase?.functions ?? null)) {
    globals.push('firebase.json:functions-config');
  }
  if (indexChanged && !safelyTargetableIndexTopologyChange) {
    globals.push(`${SOURCE_ROOT}/index.ts:export-topology`);
  }
  if (globals.length) {
    result.functionsDeploymentRequired = true;
    result.fullDeployment = true;
    result.fullDeploymentReason = `known-global-impact:${[...new Set(globals)].join(',')}`;
    return result;
  }

  const changedSource = files.filter(file => file.startsWith(`${SOURCE_ROOT}/`) && !isFunctionsTestPath(file));
  if (!changedSource.length) return result;
  const graphs = [];
  if (beforeGraph) graphs.push({ label: 'before', graph: beforeGraph });
  if (afterGraph) graphs.push({ label: 'after', graph: afterGraph });
  if (!graphs.length) throw new Error('No source snapshots available for dependency analysis');

  const targetReasons = new Map();
  for (const { label, graph } of graphs) {
    const reachability = rootReachability(graph);
    for (const changed of changedSource) {
      for (const target of reachability.get(changed) ?? []) {
        if (!targetReasons.has(target)) targetReasons.set(target, new Set());
        const rootFile = graph.roots.get(target);
        const relation = rootFile === changed ? 'directly exports' : 'transitively imports';
        targetReasons.get(target).add(`${relation} ${changed} (${label} graph)`);
      }
    }
  }
  if (additiveOnlyTopologyChange) {
    for (const id of addedRoots) {
      if (!targetReasons.has(id)) targetReasons.set(id, new Set());
      targetReasons.get(id).add('newly exported from functions/src/index.ts');
    }
  }

  result.impactedFunctions = [...targetReasons.keys()]
    .filter(id => !result.retiredFunctions.includes(id))
    .sort();
  result.functionsDeploymentRequired = result.impactedFunctions.length > 0;
  result.reasons = Object.fromEntries(result.impactedFunctions.map(id => [id, [...targetReasons.get(id)].sort()]));
  return result;
}
