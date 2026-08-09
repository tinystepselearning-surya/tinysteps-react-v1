#!/usr/bin/env node

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EXISTING_CRITICAL_FUNCTIONS,
  SCHOOL_BACKEND_TRIGGERS,
  SCHOOL_BROWSER_CALLABLES,
  SCHOOL_CALLABLE_REGION,
} from './school-callable-contract.mjs';

function values(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

export function endpointHasRegion(endpoint, expectedRegion) {
  return values(endpoint?.region).includes(expectedRegion);
}

export function endpointHasPublicInvoker(endpoint) {
  if (values(endpoint?.httpsTrigger?.invoker).includes('public')) return true;
  return Boolean(
    endpoint?.callableTrigger &&
    endpoint?.labels?.['school-public-invoker'] === 'true',
  );
}

export function verifyFunctionDeploymentMetadata(functionExports, options = {}) {
  const expectedRegion = options.region || SCHOOL_CALLABLE_REGION;
  const results = [];

  for (const name of EXISTING_CRITICAL_FUNCTIONS) {
    const fn = functionExports[name];
    const endpoint = fn?.__endpoint;
    const regionOk = endpointHasRegion(endpoint, expectedRegion);
    results.push({
      name,
      kind: 'existing-critical',
      exists: Boolean(fn),
      hasEndpoint: Boolean(endpoint),
      regionOk,
      publicInvokerOk: null,
      passed: Boolean(fn && endpoint && regionOk),
    });
  }

  for (const name of SCHOOL_BROWSER_CALLABLES) {
    const fn = functionExports[name];
    const endpoint = fn?.__endpoint;
    const regionOk = endpointHasRegion(endpoint, expectedRegion);
    const publicInvokerOk = endpointHasPublicInvoker(endpoint);
    results.push({
      name,
      kind: 'school-browser-callable',
      exists: Boolean(fn),
      hasEndpoint: Boolean(endpoint),
      regionOk,
      publicInvokerOk,
      passed: Boolean(fn && endpoint && regionOk && publicInvokerOk),
    });
  }

  for (const name of SCHOOL_BACKEND_TRIGGERS) {
    const fn = functionExports[name];
    const endpoint = fn?.__endpoint;
    const publicInvokerOk = endpointHasPublicInvoker(endpoint);
    results.push({
      name,
      kind: 'school-backend-trigger',
      exists: Boolean(fn),
      hasEndpoint: Boolean(endpoint),
      regionOk: endpointHasRegion(endpoint, expectedRegion),
      publicInvokerOk: !publicInvokerOk,
      passed: Boolean(fn && endpoint && !publicInvokerOk),
    });
  }

  return {
    passed: results.every((result) => result.passed),
    results,
    failures: results.filter((result) => !result.passed),
  };
}

export function loadCompiledFunctions(repoRoot = process.cwd()) {
  const require = createRequire(import.meta.url);
  return require(path.join(repoRoot, 'functions'));
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
  const verification = verifyFunctionDeploymentMetadata(loadCompiledFunctions());
  for (const result of verification.results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.kind} ${result.name}`, JSON.stringify({
      exists: result.exists,
      hasEndpoint: result.hasEndpoint,
      regionOk: result.regionOk,
      publicInvokerOk: result.publicInvokerOk,
    }));
  }

  if (!verification.passed) {
    console.error('Function deployment metadata verification failed:', verification.failures.map((item) => item.name));
    process.exitCode = 1;
  } else {
    console.log(`Verified ${verification.results.length} function exports and deployment metadata records.`);
  }
}
