import assert from 'node:assert/strict';
import test from 'node:test';
import {EventEmitter} from 'node:events';
import {createOwnedGroups, waitBounded} from './r5a-owned-process-groups.mjs';

function fixture({failPid, stubborn = false} = {}) {
  let time = 0, pid = 5000;
  const alive = new Set(), calls = [];
  const noGroup = () => Object.assign(Error('missing'), {code: 'ESRCH'});
  const groups = createOwnedGroups({
    spawnProcess() { const child = new EventEmitter(); child.pid = ++pid; alive.add(pid); return child; },
    kill(group, sig) {
      const id = -group; calls.push([id, sig]);
      if (!alive.has(id)) throw noGroup();
      if (id === failPid) throw Object.assign(Error('denied'), {code: 'EPERM'});
      if (sig === 'SIGKILL' || sig === 'SIGTERM' && !stubborn) alive.delete(id);
    },
    now: () => time, pause: async ms => { time += ms; }, graceMs: 10, pollMs: 5, platform: 'linux',
  });
  function start() { const item = groups.start('fixture', [], {}); item.child.emit('exit', 0, null); return item; }
  return {groups, calls, alive, start};
}
test('exited leader does not suppress descendant group termination', async () => {
  const f = fixture({stubborn: true}); const item = f.start();
  assert.equal(item.done, true);
  await f.groups.cleanupAll();
  assert.ok(f.calls.some(([id, s]) => id === item.pgid && s === 'SIGKILL'));
  assert.equal(f.alive.size, 0);
});
test('one group cleanup failure does not skip another group', async () => {
  const f = fixture({failPid: 5001}); f.start(); const other = f.start();
  await assert.rejects(f.groups.cleanupAll(), /SUPERVISOR_CLEANUP_FAILED/);
  assert.equal(f.alive.has(other.pgid), false);
  assert.ok(f.calls.some(([id, s]) => id === 5001 && s === 'SIGKILL'));
});
test('disappeared group is never signaled again; no new children after cleanup', async () => {
  const f = fixture(); f.start(); await f.groups.cleanupAll(); const n = f.calls.length;
  await f.groups.cleanupAll(); assert.equal(f.calls.length, n);
  assert.throws(() => f.start(), /SUPERVISOR_CLOSED/);
});
test('real harmless child is terminated and reaped', async () => {
  const groups = createOwnedGroups({graceMs: 500});
  const item = groups.start(process.execPath, ['-e', 'setInterval(()=>{},1000)'], {stdio: 'ignore'});
  try { assert.ok(item.pgid > 1); await groups.cleanupAll(); assert.equal(item.done, true); }
  finally { await groups.cleanupAll(); }
});
test('bounded wait reports timeout rather than success', async () => {
  assert.equal(await waitBounded(new Promise(() => {}), 10), null);
  assert.deepEqual(await waitBounded(Promise.resolve({code: 0}), 100), {code: 0});
});

test('Darwin transient EPERM requires subsequent verified group disappearance', async () => {
  let time = 0, probes = 0;
  const groups = createOwnedGroups({
    platform: 'darwin', now: () => time, pause: async ms => { time += ms; }, graceMs: 20, pollMs: 5,
    spawnProcess() { const child = new EventEmitter(); child.pid = 6000; return child; },
    kill(_pgid, sig) {
      if (sig === 0 && ++probes >= 2) throw Object.assign(Error('gone'), {code: 'ESRCH'});
      throw Object.assign(Error('temporarily unavailable'), {code: 'EPERM'});
    }
  });
  const item = groups.start('fixture', [], {}); item.child.emit('exit', 0, null);
  await groups.cleanupAll();
  assert.equal(item.gone, true);
  assert.equal(probes, 2);
});
test('Darwin persistent EPERM is never treated as successful cleanup', async () => {
  let time = 0; const signals = [];
  const groups = createOwnedGroups({
    platform: 'darwin', now: () => time, pause: async ms => { time += ms; }, graceMs: 10, pollMs: 5,
    spawnProcess() { const child = new EventEmitter(); child.pid = 6001; return child; },
    kill(_pgid, sig) { signals.push(sig); throw Object.assign(Error('permission'), {code: 'EPERM'}); }
  });
  const item = groups.start('fixture', [], {}); item.child.emit('exit', 0, null);
  await assert.rejects(groups.cleanupAll(), err => {
    assert.equal(err.errors[0].errors[0].message, 'OWNED_GROUP_NOT_GONE_EPERM');
    return true;
  });
  assert.ok(signals.includes('SIGKILL'));
  assert.equal(item.gone, false);
});
