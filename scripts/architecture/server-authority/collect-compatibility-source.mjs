// Read-only transfer of pinned Git source blobs; never executes repository code.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,statSync} from 'node:fs';
import {join,resolve} from 'node:path';
const REPORT_SHA='af0e258ad95e018a99f86b910c55b47f9d1771d5c2a357b022ebf8552a47b058';
const ORIGINAL=['95b44babd7f3132b212b781eabeec000fced14c8','0da0f5f1bdccab2b2dc5dacf8ce2b3beb1053274'];
const TARGETS=[{label:'current-main',sha:'6b289bf1bd30c151328f2582bdec1b31e6f2d977',count:3419},{label:'gate-b-candidate',sha:'7e48ec8f811b3102f247195a0f8639cd3bf9f872',count:3551}];
const MAX_BYTES=128*1024*1024;
const sha256=b=>createHash('sha256').update(b).digest('hex');
const blobSha=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const cwd=process.cwd();
const env={...process.env,LC_ALL:'C',GIT_OPTIONAL_LOCKS:'0',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_TERMINAL_PROMPT:'0'};
function run(program,args,options={}){
 const r=spawnSync(program,args,{cwd,env,timeout:120000,maxBuffer:MAX_BYTES+16*1024*1024,...options});
 assert.ok(!r.error&&!r.signal&&r.status===0,`COMMAND_FAILED ${program}: ${String(r.error??r.stderr??'').slice(0,400)}`);
 return r.stdout;
}
const git=(args,options={})=>run('/usr/bin/git',['-c','core.fsmonitor=false','-c','core.hooksPath=/dev/null',...args],options);
function tree(sha){
 assert.equal(git(['rev-parse',sha+'^{commit}']).toString('utf8').trim(),sha);
 const raw=git(['ls-tree','-r','-l','-z','--full-tree',sha]);
 const rows=raw.toString('utf8').split('\0');assert.equal(rows.pop(),'');
 const files=new Map();
 for(const row of rows){
  const i=row.indexOf('\t');assert.ok(i>0);
  const m=/^(100644|100755) blob ([a-f0-9]{40}) +([0-9]+)$/.exec(row.slice(0,i));
  assert.ok(m,'UNCLASSIFIED_GIT_TREE_ENTRY');const path=row.slice(i+1),size=Number(m[3]);
  assert.ok(!files.has(path)&&Number.isSafeInteger(size)&&size>=0);
  files.set(path,{path,sha:m[2],size});
 }
 return files;
}
function selection(path,reported){
 // Never collect credential files or runtime/user data files. Source may contain
 // internal business logic; the bundle is for the owner's private audit only.
 if(/(?:^|\/)(?:\.env(?:\..*)?|[^/]*(?:service[-_]?account|private[-_]?key|credentials)[^/]*\.(?:json|pem|key)|[^/]*\.(?:pem|key|p12|pfx|jks|keystore))$/i.test(path))return 'excluded-credential-like-path';
 if(/\.(?:[cm]?[jt]s|[jt]sx|rules|sh|bash|zsh|py|rb|swift|kt|java|go|rs|php|vue|svelte)$/i.test(path))return 'source';
 if(/^\.github\/workflows\/.*\.ya?ml$/i.test(path))return 'workflow';
 if(/(?:^|\/)(?:package\.json|tsconfig[^/]*\.json|firebase\.json|firestore\.indexes\.json|\.firebaserc|\.gitmodules|\.gitattributes)$/i.test(path)||/^docs\/architecture\/registry\/.*\.json$/i.test(path)||/^docs\/architecture\/wave-1\/migrations\/.*\.json$/i.test(path))return 'build-or-schema-metadata';
 if(reported&&/\.(?:html?|sql|graphql|gql)$/i.test(path))return 'reported-source-candidate';
 return 'metadata-only';
}
assert.equal(process.argv.length,4,'Usage: node collector.mjs ORIGINAL_REPORT_JSON OUTPUT_PARENT');
const reportBytes=readFileSync(resolve(process.argv[2]));assert.equal(sha256(reportBytes),REPORT_SHA,'ORIGINAL_REPORT_HASH');
const report=JSON.parse(reportBytes);assert.deepEqual(report.scans.map(s=>s.sha),ORIGINAL);
for(const scan of report.scans){const t=tree(scan.sha);assert.equal(t.size,scan.trackedBlobs);for(const [p,h] of Object.entries(scan.evidenceBlobs))assert.equal(t.get(p)?.sha,h,'ORIGINAL_EVIDENCE_PIN');}
const reported=new Set(report.scans.flatMap(s=>Object.keys(s.evidenceBlobs)));
const chosen=new Map(),scopes=[];
for(const target of TARGETS){const t=tree(target.sha);assert.equal(t.size,target.count,'TARGET_TREE_SIZE');const entries=[];
 for(const entry of t.values()){
  const reason=selection(entry.path,reported.has(entry.path));const included=!['metadata-only','excluded-credential-like-path'].includes(reason);
  entries.push({...entry,included,reason});
  if(included){const prev=chosen.get(entry.sha);assert.ok(!prev||prev===entry.size);chosen.set(entry.sha,entry.size);}
 }
 scopes.push({...target,entries});
}
const total=[...chosen.values()].reduce((a,b)=>a+b,0);assert.ok(total<=MAX_BYTES,'SOURCE_BUNDLE_SIZE_LIMIT');
const outputParent=resolve(process.argv[3]);assert.ok(statSync(outputParent).isDirectory());
const output=mkdtempSync(join(outputParent,'TSOS-B02B-Compatibility.'));
const work=join(output,'source');mkdirSync(work,{mode:0o700});mkdirSync(join(work,'blobs'),{mode:0o700});
const ids=[...chosen.keys()];const data=git(['cat-file','--batch'],{input:ids.join('\n')+'\n'});
let pos=0;
for(const id of ids){const end=data.indexOf(10,pos);assert.ok(end>=pos);assert.equal(data.subarray(pos,end).toString('ascii'),`${id} blob ${chosen.get(id)}`,'BLOB_HEADER');pos=end+1;
 const bytes=data.subarray(pos,pos+chosen.get(id));assert.equal(blobSha(bytes),id,'BLOB_HASH');pos+=bytes.length;assert.equal(data[pos++],10,'BLOB_DELIMITER');
 writeFileSync(join(work,'blobs',id),bytes,{mode:0o600,flag:'wx'});
}
assert.equal(pos,data.length,'UNEXPECTED_BATCH_BYTES');
const manifest={format:'tsos-b02b-compatibility-source-1',originalReportSha256:REPORT_SHA,scopes,uniqueIncludedBlobs:ids.length,includedBytes:total,limitations:['Source transfer only; no runtime or deployment verification','Metadata-only and credential-like paths remain explicitly recorded','Untracked files, local credentials, node_modules, and production records not read']};
writeFileSync(join(work,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{mode:0o600,flag:'wx'});
const archive=join(output,'B02B-Compatibility-Source.zip');run('/usr/bin/zip',['-q','-r',archive,'manifest.json','blobs'],{cwd:work});run('/usr/bin/unzip',['-tq',archive]);
console.log(JSON.stringify({archive,sha256:sha256(readFileSync(archive)),uniqueIncludedBlobs:ids.length,includedBytes:total,scopeCounts:scopes.map(s=>({label:s.label,tracked:s.entries.length,included:s.entries.filter(e=>e.included).length}))},null,2));
console.log('SOURCE TRANSFER COMPLETE — no production operations');
