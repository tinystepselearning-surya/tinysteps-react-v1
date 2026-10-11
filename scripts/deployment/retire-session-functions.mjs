import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PROJECT, REGION, REPOSITORY, validateContext, retireSessionFunctions } from './session-retirement-lib.mjs';
const require = createRequire(import.meta.url);
function run(command, args) {
  const result = execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024 });
  return result.trim();
}
// spawnSync exposes successful-command stderr, which execFileSync does not.
function readJson(args) {
  const result = spawnSync('gcloud', [...args, '--project', PROJECT, '--format=json'], {
    encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error || result.status !== 0 || result.stderr.trim()) {
    throw new Error(`Incomplete Google Cloud inventory: ${result.error || result.stderr}`);
  }
  return JSON.parse(result.stdout);
}
const compiled = require(resolve('functions/lib/index.js'));
const head = run('git', ['rev-parse', 'HEAD']);
function assertContext() {
  const main = run('git', ['ls-remote', `https://github.com/${REPOSITORY}.git`, 'refs/heads/main']).split(/\s/)[0];
  validateContext(process.env, head, main, compiled);
}
assertContext();
const evidence = { commit: head, project: PROJECT, startedAt: new Date().toISOString() };
mkdirSync('artifacts', { recursive: true });
await retireSessionFunctions({
  assertContext,
  inventory: async () => {
    const functions = readJson(['functions', 'list']);
    const locations = readJson(['scheduler', 'locations', 'list']);
    if (!Array.isArray(locations) || !locations.length) throw new Error('Missing Scheduler locations');
    const regional = locations.map(row => {
      const region = row.locationId;
      if (!/^[a-z]+(?:-[a-z0-9]+)+$/.test(region || '')) throw new Error('Invalid Scheduler location');
      return { region, jobs: readJson(['scheduler', 'jobs', 'list', '--location', region]) };
    });
    evidence.regions = regional.map(row => row.region);
    return [functions, regional];
  },
  deleteFunction: async id => run('npx', ['--yes', 'firebase-tools@15.30.0', 'functions:delete', `default:${id}`, '--region', REGION, '--project', PROJECT, '--force']),
  deleteJob: async name => run('gcloud', ['scheduler', 'jobs', 'delete', name, '--project', PROJECT, '--quiet']),
  record: async (phase, inventory) => {
    evidence[phase] = inventory;
    writeFileSync('artifacts/session-retirement-report.json', JSON.stringify(evidence, null, 2));
  },
});
console.log('Verified retired Functions and exact Scheduler jobs absent across all Scheduler regions');
