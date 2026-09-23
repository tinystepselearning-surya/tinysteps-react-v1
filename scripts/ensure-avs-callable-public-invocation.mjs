#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseArgs,
  ensureSchoolCallablePublicInvocation,
} from './ensure-school-callable-public-invocation.mjs';
import {
  AVS_BROWSER_CALLABLES,
  AVS_CALLABLE_REGION,
} from './avs-callable-contract.mjs';

export function ensureAvsCallablePublicInvocation({
  project,
  region = AVS_CALLABLE_REGION,
  gcloud = 'gcloud',
  execFile,
  functionNames = AVS_BROWSER_CALLABLES,
}) {
  return ensureSchoolCallablePublicInvocation({
    project,
    region,
    gcloud,
    execFile,
    functionNames,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  ensureAvsCallablePublicInvocation(parseArgs(process.argv.slice(2)));
}
