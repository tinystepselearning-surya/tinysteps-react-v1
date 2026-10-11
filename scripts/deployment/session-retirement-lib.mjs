// Observed production identities, audited 2026-10-11. This is an exact allowlist,
// not a Scheduler naming heuristic. Unexpected targets require a new review.
export const PROJECT = 'tinysteps-react-v1';
export const REGION = 'asia-south1';
export const REPOSITORY = 'tinystepselearning-surya/tinysteps-react-v1';
export const RETIRED_SESSION_FUNCTIONS = [
  'dailySessionsTomorrowAt0005',
  'futureScheduleReconcilerEveryTwoHours',
  'onFutureScheduleEnrollmentWrite',
  'rollingScheduleEdgeReplenisherDaily',
];
export const JOBS = [
  ['dailySessionsTomorrowAt0005', 'dailysessionstomorrowat0005'],
  ['futureScheduleReconcilerEveryTwoHours', 'futureschedulereconcilereverytwohours'],
  ['rollingScheduleEdgeReplenisherDaily', 'rollingscheduleedgereplenisherdaily'],
].map(([id, service]) => ({
  id,
  name: `projects/${PROJECT}/locations/${REGION}/jobs/firebase-schedule-${id}-${REGION}`,
  urls: [
    `https://${REGION}-${PROJECT}.cloudfunctions.net/${id}`,
    `https://${service}-ucavzhfmxq-el.a.run.app`,
  ],
}));
const normalizeUrl = value => String(value || '').replace(/\/$/, '');
export function validateContext(env, head, main, compiledExports) {
  if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_EVENT_NAME !== 'push'
      || env.GITHUB_REF !== 'refs/heads/main' || env.GITHUB_REPOSITORY !== REPOSITORY
      || env.FIREBASE_PROJECT_ID !== PROJECT
      || env.FUNCTIONS_RETIRED_TARGETS !== RETIRED_SESSION_FUNCTIONS.join(',')) {
    throw new Error('Refusing retirement outside the exact production CI context and allowlist');
  }
  if (!/^[a-f0-9]{40}$/.test(env.GITHUB_SHA || '') || head !== env.GITHUB_SHA || main !== head) {
    throw new Error('Refusing stale or mismatched retirement commit');
  }
  if (RETIRED_SESSION_FUNCTIONS.some(id => Object.hasOwn(compiledExports, id))) {
    throw new Error('Retired function still exported by compiled artifact');
  }
}
export function retirementInventory(functions, regionalJobs) {
  if (!Array.isArray(functions) || !Array.isArray(regionalJobs) || !regionalJobs.length) {
    throw new Error('Invalid or empty inventory coverage');
  }
  const found = [];
  for (const fn of functions) {
    if (typeof fn.name !== 'string') throw new Error('Malformed Function inventory');
    const id = fn.name.split('/').pop();
    // Firebase CLI selectors also match grouped names with a hyphen suffix.
    if (RETIRED_SESSION_FUNCTIONS.some(target => id.startsWith(target + '-'))) {
      throw new Error(`Ambiguous Firebase deletion selector: ${fn.name}`);
    }
    if (!RETIRED_SESSION_FUNCTIONS.includes(id)) continue;
    if (fn.labels?.['firebase-functions-codebase'] && fn.labels['firebase-functions-codebase'] !== 'default') {
      throw new Error(`Unexpected Function codebase: ${fn.name}`);
    }
    if (fn.name !== `projects/${PROJECT}/locations/${REGION}/functions/${id}` || fn.environment !== 'GEN_2') {
      throw new Error(`Unexpected retired Function region/generation: ${fn.name}`);
    }
    if (JOBS.some(job => job.id === id) && fn.labels?.['deployment-scheduled'] !== 'true') {
      throw new Error(`Retired Function is no longer scheduled: ${id}`);
    }
    found.push(id);
  }
  const jobs = [];
  const regions = new Set();
  for (const row of regionalJobs) {
    if (!/^[a-z]+(?:-[a-z0-9]+)+$/.test(row.region || '') || regions.has(row.region) || !Array.isArray(row.jobs)) {
      throw new Error('Invalid regional Scheduler inventory');
    }
    regions.add(row.region);
    for (const job of row.jobs) {
      if (typeof job.name !== 'string' || !job.name.startsWith(`projects/${PROJECT}/locations/${row.region}/jobs/`)) {
        throw new Error('Malformed Scheduler resource');
      }
      const exact = JOBS.find(expected => expected.name === job.name);
      const uri = normalizeUrl(job.httpTarget?.uri);
      // Detect aliases and cross-region jobs by target, as well as unexpected
      // legacy Pub/Sub jobs. Never delete those merely because they match.
      const targetsRetired = JOBS.some(expected => expected.urls.includes(uri))
        || RETIRED_SESSION_FUNCTIONS.some(id =>
          String(job.pubsubTarget?.topicName || '').includes(id)
          || job.name.toLowerCase().includes(id.toLowerCase())
          || uri.toLowerCase().includes(id.toLowerCase()));
      if (exact) {
        if (!exact.urls.includes(uri) || job.pubsubTarget) throw new Error(`Unexpected Scheduler target: ${job.name}`);
        jobs.push(job);
      } else if (targetsRetired) {
        throw new Error(`Unallowlisted legacy Scheduler job requires review: ${job.name}`);
      }
    }
  }
  if (!regions.has(REGION)) throw new Error('Function region missing from Scheduler coverage');
  return { functions: found, jobs };
}
export async function retireSessionFunctions({ inventory, assertContext, deleteFunction, deleteJob, record }) {
  const before = retirementInventory(...await inventory());
  await record('before', before);
  await assertContext(); // immediately before first mutation, after slow inventory
  for (const id of before.functions) await deleteFunction(id);
  // Firebase normally deletes Gen 2 Scheduler jobs. Recover explicit orphans
  // after interrupted deletion, including runs where the Function is absent.
  const remaining = retirementInventory(...await inventory());
  if (remaining.functions.length) throw new Error('Retired Functions remain after deletion');
  for (const job of remaining.jobs) await deleteJob(job.name);
  const after = retirementInventory(...await inventory());
  await record('after', after);
  if (after.functions.length || after.jobs.length) throw new Error('Retirement verification failed');
}
