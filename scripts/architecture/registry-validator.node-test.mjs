import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,writeFileSync,cpSync,mkdtempSync,rmSync,symlinkSync,unlinkSync} from "node:fs";
import {join,dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {tmpdir} from "node:os";
import {execFileSync,spawnSync} from "node:child_process";
import {validateRegistry} from "./registry-validator-core.mjs";
import {MANIFEST_NAME,gitBlobSha,validateRegistryFiles} from "./registry-validator-files.mjs";
import {registryCases} from "./registry-validator-cases.mjs";

const here=dirname(fileURLToPath(import.meta.url));
const repo=resolve(here,"../..");
const root=join(repo,"docs/architecture/registry");
const manifest=JSON.parse(readFileSync(join(root,MANIFEST_NAME),"utf8"));
const previousBytes=execFileSync("git",["show","a743ece8566013e281d7ab1ad7dfceb6c74e5ae2:docs/architecture/registry/"+MANIFEST_NAME],{cwd:repo,maxBuffer:4*1024*1024});
const previous={text:previousBytes.toString("utf8"),blobSha:gitBlobSha(previousBytes)};
const shards=Object.fromEntries(manifest.shards.map(s=>{
  const bytes=readFileSync(join(root,s.path));
  return [s.path,{text:bytes.toString("utf8"),blobSha:gitBlobSha(bytes)}];
}));
for(const c of registryCases(validateRegistry,manifest,shards,previous)){
  test("core: "+c.name,()=>assert.equal(c.pass,true,c.error));
}
function fixture(t){
  const dir=mkdtempSync(join(tmpdir(),"tsos-registry-"));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const copy=join(dir,"registry"),prior=join(dir,"prior.json");
  cpSync(root,copy,{recursive:true});
  writeFileSync(prior,previousBytes);
  return {dir,copy,prior};
}
function cli(copy,prior){
  return spawnSync(process.execPath,[join(here,"validate-registry.mjs"),"--root",copy,"--previous",prior],{encoding:"utf8",maxBuffer:4*1024*1024});
}
test("filesystem: exact bytes and real registry",t=>{
  const {copy,prior}=fixture(t);
  const r=validateRegistryFiles(copy,prior);
  assert.equal(r.structurallyValid,true,JSON.stringify(r.errors));
  assert.equal(r.executableReady,false);
  assert.equal(gitBlobSha(previousBytes),"7aff7de8bf9efbc2cfc7b26d4b550cf91567b324");
  for(const s of manifest.shards)assert.equal(gitBlobSha(readFileSync(join(copy,s.path))),s.blobSha);
  const result=cli(copy,prior);
  assert.equal(result.status,0,result.stderr);
  assert.equal(JSON.parse(result.stdout).counts.items,971);
  for(const s of manifest.shards)assert.equal(gitBlobSha(readFileSync(join(copy,s.path))),s.blobSha);
  assert.equal(gitBlobSha(readFileSync(join(copy,MANIFEST_NAME))),gitBlobSha(readFileSync(join(root,MANIFEST_NAME))));
  assert.equal(gitBlobSha(readFileSync(prior)),gitBlobSha(previousBytes));
});
test("filesystem: content-only alteration detected by computed blob hash",t=>{
  const {copy,prior}=fixture(t);
  const p=join(copy,manifest.shards[0].path);
  writeFileSync(p,Buffer.concat([readFileSync(p),Buffer.from(" ")]));
  const result=cli(copy,prior);
  assert.equal(result.status,1,result.stderr);
  assert.ok(JSON.parse(result.stdout).errors.some(e=>e.code==="SHARD_HASH"));
});
test("filesystem: missing shard rejected",t=>{
  const {copy,prior}=fixture(t);
  unlinkSync(join(copy,manifest.shards[0].path));
  assert.ok(validateRegistryFiles(copy,prior).errors.some(e=>e.code==="SHARD_READ"));
});
test("filesystem: same-byte symlink outside root rejected",t=>{
  const {dir,copy,prior}=fixture(t);
  const p=join(copy,manifest.shards[0].path),outside=join(dir,"outside.json");
  writeFileSync(outside,readFileSync(p));
  unlinkSync(p);
  symlinkSync(outside,p);
  assert.ok(validateRegistryFiles(copy,prior).errors.some(e=>e.code==="SHARD_READ"));
});
test("filesystem: symlink to shard directory rejected",t=>{
  const {dir,copy,prior}=fixture(t);
  const src=join(copy,"domains"),outside=join(dir,"outside");
  cpSync(src,outside,{recursive:true});
  rmSync(src,{recursive:true});
  symlinkSync(outside,src,"dir");
  assert.ok(validateRegistryFiles(copy,prior).errors.some(e=>e.code==="SHARD_READ"));
});
test("filesystem: previous snapshot byte mismatch rejected",t=>{
  const {copy,prior}=fixture(t);
  writeFileSync(prior,Buffer.concat([previousBytes,Buffer.from(" ")]));
  assert.ok(validateRegistryFiles(copy,prior).errors.some(e=>e.code==="PREVIOUS_HASH"));
});
test("CLI: malformed manifest and missing arguments fail without raw input disclosure",t=>{
  const {copy,prior}=fixture(t);
  writeFileSync(join(copy,MANIFEST_NAME),"private-invalid-json");
  const result=cli(copy,prior);
  assert.equal(result.status,2);
  assert.match(result.stderr,/REGISTRY_INPUT_ERROR/);
  assert.doesNotMatch(result.stderr,/private-invalid-json/);
  assert.equal(spawnSync(process.execPath,[join(here,"validate-registry.mjs")],{encoding:"utf8"}).status,2);
});
