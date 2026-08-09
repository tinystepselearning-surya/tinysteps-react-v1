#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SCHOOL_BROWSER_CALLABLES,
  SCHOOL_CALLABLE_REGION,
} from './school-callable-contract.mjs';

export function parseArgs(argv) {
  const parsed = {
    project: '',
    region: SCHOOL_CALLABLE_REGION,
    gcloud: 'gcloud',
  };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key.startsWith('--') || value === undefined) continue;
    index += 1;
    if (key === '--project') parsed.project = value;
    else if (key === '--region') parsed.region = value;
    else if (key === '--gcloud') parsed.gcloud = value;
  }
  if (!parsed.project) throw new Error('--project is required');
  return parsed;
}

export function describeFunctionArgs({ functionName, project, region }) {
  return [
    'functions',
    'describe',
    functionName,
    '--gen2',
    `--project=${project}`,
    `--region=${region}`,
    '--format=value(serviceConfig.service)',
  ];
}

export function addPublicInvokerArgs({ serviceName, project, region }) {
  return [
    'run',
    'services',
    'add-iam-policy-binding',
    serviceName,
    `--project=${project}`,
    `--region=${region}`,
    '--member=allUsers',
    '--role=roles/run.invoker',
    '--condition=None',
    '--quiet',
  ];
}

export function ensureSchoolCallablePublicInvocation({
  project,
  region = SCHOOL_CALLABLE_REGION,
  gcloud = 'gcloud',
  execFile = execFileSync,
  functionNames = SCHOOL_BROWSER_CALLABLES,
}) {
  const results = [];
  for (const functionName of functionNames) {
    const serviceResource = String(execFile(
      gcloud,
      describeFunctionArgs({ functionName, project, region }),
      { encoding: 'utf8' },
    )).trim();
    const serviceName = serviceResource.split('/').filter(Boolean).at(-1);
    if (!serviceName) {
      throw new Error(`Cloud Run service was not found for ${functionName}`);
    }
    execFile(
      gcloud,
      addPublicInvokerArgs({ serviceName, project, region }),
      { stdio: 'inherit' },
    );
    results.push({ functionName, serviceName });
    console.log(`Verified public transport IAM for ${functionName} (${serviceName})`);
  }
  return results;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  ensureSchoolCallablePublicInvocation(parseArgs(process.argv.slice(2)));
}
