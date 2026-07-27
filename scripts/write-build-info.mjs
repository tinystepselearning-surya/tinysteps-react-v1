#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function resolveBuildIdentity({
  env = process.env,
  cwd = process.cwd(),
  now = new Date(),
} = {}) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
  let gitSha = String(env.GITHUB_SHA || env.VITE_GIT_SHA || '').trim();
  if (!gitSha) {
    gitSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim();
  }
  if (!/^[a-f0-9]{40}$/i.test(gitSha)) {
    throw new Error(`Invalid git SHA for build identity: ${gitSha || '(empty)'}`);
  }
  return {
    gitSha,
    buildTimestamp: now.toISOString(),
    applicationVersion: String(packageJson.version),
  };
}

export function writeBuildInfo(options = {}) {
  const cwd = options.cwd || process.cwd();
  const outputPath = options.outputPath || path.join(cwd, 'dist', 'build-info.json');
  const identity = resolveBuildIdentity({ ...options, cwd });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(identity, null, 2)}\n`, 'utf8');
  return { identity, outputPath };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const { identity, outputPath } = writeBuildInfo();
  console.log(`Build identity written to ${outputPath}: ${identity.gitSha}`);
}
