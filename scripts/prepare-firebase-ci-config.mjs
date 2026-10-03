#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function stripPredeployHooks(firebaseConfig) {
  const config = structuredClone(firebaseConfig);

  const hostingEntries = Array.isArray(config.hosting)
    ? config.hosting
    : config.hosting
      ? [config.hosting]
      : [];
  for (const hosting of hostingEntries) {
    if (hosting && typeof hosting === 'object') delete hosting.predeploy;
  }

  const functionEntries = Array.isArray(config.functions)
    ? config.functions
    : config.functions
      ? [config.functions]
      : [];
  for (const functionsConfig of functionEntries) {
    if (functionsConfig && typeof functionsConfig === 'object') delete functionsConfig.predeploy;
  }

  return config;
}

function parseArgs(argv) {
  const result = {
    input: 'firebase.json',
    output: '.firebase.ci.json',
  };
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!['--input', '--output'].includes(key) || !value) {
      throw new Error('Usage: prepare-firebase-ci-config.mjs [--input firebase.json] [--output .firebase.ci.json]');
    }
    result[key.slice(2)] = value;
  }
  return result;
}

export async function prepareFirebaseCiConfig({ input = 'firebase.json', output = '.firebase.ci.json' } = {}) {
  const inputPath = resolve(input);
  const outputPath = resolve(output);
  if (inputPath === outputPath) throw new Error('CI Firebase config output must not overwrite firebase.json');

  const source = JSON.parse(await readFile(inputPath, 'utf8'));
  const prepared = stripPredeployHooks(source);

  if (JSON.stringify(prepared.hosting?.public ?? null) !== JSON.stringify(source.hosting?.public ?? null)) {
    throw new Error('Hosting public directory changed while preparing CI config');
  }
  if (JSON.stringify(prepared.functions?.source ?? null) !== JSON.stringify(source.functions?.source ?? null)) {
    throw new Error('Functions source changed while preparing CI config');
  }

  await writeFile(outputPath, `${JSON.stringify(prepared, null, 2)}\n`, 'utf8');
  return { inputPath, outputPath, prepared };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const { outputPath } = await prepareFirebaseCiConfig(args);
    console.log(`Prepared CI Firebase config without predeploy hooks: ${outputPath}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
