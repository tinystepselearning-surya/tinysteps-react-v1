import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,cpSync,rmSync,writeFileSync,unlinkSync,symlinkSync,readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {scanArchitecture,blobSha} from "./architecture-fitness-files.mjs";
import {fitnessCases} from "./architecture-fitness-cases.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
for(const c of fitnessCases())test("fitness: "+c.name,()=>assert.equal(c.pass,true,c.error));
function fixture(t){
  const d=mkdtempSync(join(tmpdir(),"tsos-fitness-"));
  t.after(()=>rmSync(d,{recursive:true,force:true}));
  for(const p of ["scripts","docs/architecture"])mkdirSync(join(d,p),{recursive:true});
  for(const p of ["scripts/architecture","docs/architecture/registry"])cpSync(join(root,p),join(d,p),{recursive:true});
  return d;
}
test("fitness filesystem: actual inventory",()=>assert.equal(scanArchitecture(root).valid,true));
test("fitness filesystem: byte change rejected",t=>{const d=fixture(t),p=join(d,"scripts/architecture/typed-schema-core.mjs");writeFileSync(p,Buffer.concat([readFileSync(p),Buffer.from(" ")]));assert.ok(scanArchitecture(d).errors.includes("PIN_MISMATCH"));});
test("fitness filesystem: extra file rejected",t=>{const d=fixture(t);writeFileSync(join(d,"scripts/architecture/unreviewed.mjs"),"");assert.ok(scanArchitecture(d).errors.includes("UNEXPECTED_FILE"));});
test("fitness filesystem: symlink rejected",t=>{const d=fixture(t),p=join(d,"scripts/architecture/typed-schema-core.mjs"),outside=join(d,"outside");writeFileSync(outside,readFileSync(p));unlinkSync(p);symlinkSync(outside,p);assert.ok(scanArchitecture(d).errors.includes("UNSAFE_FILE"));});
test("fitness filesystem: registry ancestor symlink rejected",t=>{const d=fixture(t),p=join(d,"docs/architecture"),outside=join(d,"outside");cpSync(p,outside,{recursive:true});rmSync(p,{recursive:true});symlinkSync(outside,p,"dir");assert.throws(()=>scanArchitecture(d));});
test("fitness filesystem: git blob known value",()=>assert.equal(blobSha(Buffer.from("")),"e69de29bb2d1d6434b8b29ae775ad8c2e48c5391"));
