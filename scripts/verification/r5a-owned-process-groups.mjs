// Local process-group supervision. POSIX only. No database or network operations.
import {spawn} from 'node:child_process';
import {performance} from 'node:perf_hooks';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export async function waitBounded(completion, ms) {
  let timer;
  try {
    return await Promise.race([completion, new Promise(resolve => {
      timer = setTimeout(() => resolve(null), ms);
    })]);
  } finally { clearTimeout(timer); }
}

export function createOwnedGroups({spawnProcess = spawn, kill = process.kill.bind(process),
  now = () => performance.now(), pause = sleep, graceMs = 2000, pollMs = 25} = {}) {
  const groups = [];
  let closed = false;
  function start(program, args, options) {
    if (closed) throw Error('SUPERVISOR_CLOSED');
    const child = spawnProcess(program, args, {...options, detached: true});
    const item = {child, pgid: child.pid, done: false, gone: false, completion: null};
    item.completion = new Promise(resolve => {
      const finish = result => { if (!item.done) { item.done = true; resolve(result); } };
      child.once('error', () => finish({code: null, signal: 'SPAWN_FAILED'}));
      child.once('exit', (code, signal) => finish({code, signal}));
    });
    groups.push(item);
    return item;
  }
  function signal(item, sig) {
    if (item.gone || item.pgid == null) return false;
    if (!Number.isSafeInteger(item.pgid) || item.pgid <= 1) throw Error('INVALID_OWNED_GROUP');
    try { kill(-item.pgid, sig); return true; }
    catch (err) {
      if (err.code !== 'ESRCH') throw err;
      item.gone = true; // Never target a group again after observing its disappearance.
      return false;
    }
  }
  async function waitGone(item) {
    const deadline = now() + graceMs;
    do {
      if (!signal(item, 0)) return true;
      await pause(Math.min(pollMs, Math.max(1, deadline - now())));
    } while (now() < deadline);
    return !signal(item, 0);
  }
  async function stop(item) {
    // Group lifetime is independent of leader exit. Attempt escalation even if TERM fails.
    const errors = [];
    try { signal(item, 'SIGTERM'); } catch (err) { errors.push(err); }
    let gone = false;
    try { gone = await waitGone(item); } catch (err) { errors.push(err); }
    if (!gone) {
      try { signal(item, 'SIGKILL'); } catch (err) { errors.push(err); }
      try { gone = await waitGone(item); } catch (err) { errors.push(err); }
    }
    if (!gone) errors.push(Error('OWNED_GROUP_NOT_GONE'));
    if (!item.done && !await waitBounded(item.completion, graceMs)) errors.push(Error('DIRECT_CHILD_NOT_REAPED'));
    if (errors.length) throw new AggregateError(errors, 'OWNED_GROUP_CLEANUP_FAILED');
  }
  function interrupt() {
    closed = true;
    // Best effort immediate signal to every group; cleanupAll reports failures.
    for (const item of groups) { try { signal(item, 'SIGTERM'); } catch {} }
  }
  async function cleanupAll() {
    closed = true;
    const results = await Promise.allSettled(groups.map(stop));
    const failures = results.filter(r => r.status === 'rejected').map(r => r.reason);
    if (failures.length) throw new AggregateError(failures, 'SUPERVISOR_CLEANUP_FAILED');
  }
  return {start, stop, interrupt, cleanupAll};
}
