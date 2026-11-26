// Explicit local runner. Accepted source pins checked before spawning test processes.
import {spawnSync,execFileSync} from "node:child_process";
import {resolve,dirname,join} from "node:path";
import {fileURLToPath} from "node:url";
import {scanArchitecture,blobSha} from "./architecture-fitness-files.mjs";
import {SUITES} from "./architecture-fitness-core.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
function run(){
  if(process.argv.length!==2||process.version!=="v22.22.1")throw Error("PINNED_NODE_OR_ARGUMENTS");
  const check=scanArchitecture(root);
  if(!check.valid){process.stderr.write(JSON.stringify(check)+"\n");return 1;}
  const env={...process.env,GIT_NO_LAZY_FETCH:"1",GIT_TERMINAL_PROMPT:"0"};
  delete env.NODE_OPTIONS;delete env.NODE_PATH;delete env.NODE_V8_COVERAGE;
  const previous=execFileSync("git",["show","a743ece8566013e281d7ab1ad7dfceb6c74e5ae2:docs/architecture/registry/TSOS_V2_MASTER_RECORD_ITEM_REGISTRY_DRAFT.json"],{cwd:root,env,maxBuffer:4*1024*1024,timeout:15000});
  if(blobSha(previous)!=="7aff7de8bf9efbc2cfc7b26d4b550cf91567b324")throw Error("PRIOR_PIN");
  const child=spawnSync(process.execPath,["--test","--test-reporter=tap",...SUITES.map(s=>join(root,"scripts/architecture",s))],{cwd:root,env,encoding:"utf8",maxBuffer:4*1024*1024,timeout:120000});
  if(child.error||child.status!==0||child.signal){process.stderr.write("ARCHITECTURE_TEST_FAILURE\n");return 1;}
  const expected=313;
  const summary=key=>{const matches=[...child.stdout.matchAll(new RegExp("^# "+key+" (\\d+)\\r?$","gm"))];return matches.length===1?Number(matches[0][1]):-1;};
  if(summary("tests")!==expected||summary("pass")!==expected||["fail","cancelled","skipped","todo"].some(k=>summary(k)!==0)){process.stderr.write("ARCHITECTURE_TEST_COUNT_MISMATCH\n");return 1;}
  process.stdout.write(JSON.stringify({valid:true,executableReady:false,acceptedFilePins:24,tests:expected,pass:expected,fail:0,scope:"offline-foundation-only"})+"\n");
  return 0;
}
try{process.exitCode=run();}catch{process.stderr.write("ARCHITECTURE_INPUT_ERROR\n");process.exitCode=2;}
