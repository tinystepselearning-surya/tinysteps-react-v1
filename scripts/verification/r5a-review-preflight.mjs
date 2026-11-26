// Read-only preflight; never launches the worker, Java, or network requests.
// Run from a trusted, sanitized parent environment. Expected SHA must come from an
// independent reviewer, not from the branch or local HEAD.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {lstatSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
assert.equal(process.argv.length,3,'REVIEWER_APPROVED_SHA_REQUIRED');
const expected=process.argv[2];
assert.match(expected,/^[a-f0-9]{40}$/);
assert.equal(process.version,'v22.22.1','PINNED_NODE_REQUIRED');
const env={PATH:'/usr/bin:/bin',HOME:process.env.HOME??'/nonexistent',TZ:'UTC',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_OPTIONAL_LOCKS:'0',GIT_TERMINAL_PROMPT:'0'};
function git(args,allowed=[0]){
  const r=spawnSync('/usr/bin/git',['-c','core.fsmonitor=false','-c','core.hooksPath=/dev/null',...args],{cwd:root,env,encoding:'utf8',timeout:5000,maxBuffer:1024*1024});
  assert.ok(!r.error&&!r.signal&&allowed.includes(r.status),'GIT_PREFLIGHT_FAILED');
  return r;
}
assert.equal(git(['rev-parse','HEAD']).stdout.trim(),expected,'EXACT_HEAD_REQUIRED');
assert.equal(git(['symbolic-ref','-q','HEAD'],[0,1]).status,1,'DETACHED_HEAD_REQUIRED');
assert.equal(git(['status','--porcelain','--untracked-files=all']).stdout.trim(),'','CLEAN_CHECKOUT_REQUIRED');
const paths=['scripts/verification/run-r5a-transaction-emulator.mjs','scripts/verification/r5a-transaction-emulator.node-test.mjs','scripts/verification/r5a-owned-process-groups.mjs','scripts/verification/r5a-owned-process-groups.node-test.mjs','scripts/verification/r5a-review-preflight.mjs','functions/package-lock.json'];
for(const path of paths){
  const file=join(root,path);
  assert.ok(lstatSync(file).isFile(),'REGULAR_FILE_REQUIRED');
  const bytes=readFileSync(file);
  const actual=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
  assert.equal(actual,git(['rev-parse',expected+':'+path]).stdout.trim(),'SOURCE_BLOB_MISMATCH');
  if(path==='functions/package-lock.json')assert.equal(actual,'9acb6ce6fd6881f3606853ca534939ff79649fe4','LOCK_MISMATCH');
}
assert.equal(git(['rev-parse','HEAD']).stdout.trim(),expected,'HEAD_CHANGED');
console.log('R5A_READ_ONLY_PREFLIGHT_PASS '+expected+'; installed dependency integrity and isolation NOT certified; execution HOLD');
