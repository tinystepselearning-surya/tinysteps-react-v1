// Controlled local test; compiles exact existing source, never initializes Firebase.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,mkdtempSync,mkdirSync,copyFileSync,rmSync,lstatSync} from "node:fs";
import {createHash} from "node:crypto";
import {createRequire} from "node:module";
import {resolve,join,dirname} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {verifySyntheticActors} from "./identity-verification-safety-core.mjs";
import {canonicalIntegrationCases} from "./identity-canonical-integration-cases.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../.."),functionsDir=join(root,"functions");
const pins=Object.freeze({
  "functions/package-lock.json": "9acb6ce6fd6881f3606853ca534939ff79649fe4",
  "functions/package.json": "89329df4b5efe0ffd707383079baeaf4cf54869c",
  "functions/src/schoolOS/identity/authAccessAuthorization.ts": "812429177c5dd9c7fcad6616e4a7d05bac20aeb5",
  "functions/src/schoolOS/identity/authAccessReadModel.ts": "461dbab181c6d77b21fc75f5871ce6244dc840ab",
  "functions/src/schoolOS/identity/contracts.ts": "be340ac4cb6be06effa1d09e1510a1e75f08c70a",
  "functions/src/schoolOS/identity/idStrategy.ts": "02037d2dd897cd06f5dc67e32d20b70824ea1527",
  "functions/tsconfig.json": "2ba14d7818a2cc95f3f0fa8b50340f77b2817f08",
  "scripts/milestone3-bounded-principal-audit.mjs": "683b79a6221eb9b420e7f7692a5982c7bef75ef5",
  "scripts/verification/identity-verification-safety-core.mjs": "1d47dae1c4f84cc6be7eae493243c17c5cba2d77"
});
const digest=bytes=>createHash("sha1").update("blob "+bytes.length+"\0").update(bytes).digest("hex");
const require=createRequire(join(functionsDir,"package.json"));
const readJson=path=>JSON.parse(readFileSync(path,"utf8"));
function verifyInputs(){
  assert.equal(process.version,"v22.22.1");
  for(const [p,sha] of Object.entries(pins)){
    const file=join(root,p);assert.ok(lstatSync(file).isFile(),"pinned file missing or unsafe");
    assert.equal(digest(readFileSync(file)),sha,"pinned source drift: "+p);
  }
  const lock=readJson(join(functionsDir,"package-lock.json"));
  for(const [name,version] of [["typescript","5.9.3"],["firebase-admin","13.7.0"]]){
    assert.equal(lock.packages["node_modules/"+name].version,version);
    assert.equal(readJson(join(functionsDir,"node_modules",name,"package.json")).version,version,"install locked dependencies first");
  }
}
async function compileAndRun(){
  verifyInputs();
  const ts=require("typescript");assert.equal(ts.version,"5.9.3");
  const stage=mkdtempSync(join(functionsDir,".tsos-r1b-"));
  try{
    const lib=join(stage,"functions","lib"),scripts=join(stage,"scripts");
    mkdirSync(scripts,{recursive:true});
    const config=readJson(join(functionsDir,"tsconfig.json"));
    const converted=ts.convertCompilerOptionsFromJson(config.compilerOptions,functionsDir);
    assert.equal(converted.errors.length,0,"invalid compiler configuration");
    const sourceNames=Object.keys(pins).filter(p=>p.endsWith(".ts")).map(p=>join(root,p));
    const options={...converted.options,rootDir:join(functionsDir,"src"),outDir:lib,sourceMap:false,noEmitOnError:true,typeRoots:[join(functionsDir,"node_modules","@types")]};
    const program=ts.createProgram({rootNames:sourceNames,options});
    const diagnostics=ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length,0,"canonical compiler diagnostics: "+diagnostics.map(d=>d.code).join(","));
    const emitted=program.emit();assert.equal(emitted.emitSkipped,false,"canonical compilation skipped");
    assert.equal(emitted.diagnostics.length,0,"canonical emit diagnostics");
    const canonicalRequire=createRequire(join(lib,"schoolOS","identity","authAccessReadModel.js"));
    const ids=canonicalRequire("./idStrategy.js"),canonical=canonicalRequire("./authAccessReadModel.js"),authorization=canonicalRequire("./authAccessAuthorization.js");
    const samplerPath=join(scripts,"milestone3-bounded-principal-audit.mjs");
    copyFileSync(join(root,"scripts","milestone3-bounded-principal-audit.mjs"),samplerPath);
    const {auditApprovedPrincipals}=await import(pathToFileURL(samplerPath).href);
    const results=await canonicalIntegrationCases({verify:verifySyntheticActors,sampler:auditApprovedPrincipals,ids,canonical,authorization});
    await new Promise(done=>setImmediate(done));
    return results;
  }finally{rmSync(stage,{recursive:true,force:true});}
}
const results=await compileAndRun();
test("canonical integration: pinned inputs, locked compiler and actual compile",()=>assert.equal(results.length,37));
for(const c of results)test("canonical integration: "+c.name,()=>assert.equal(c.pass,true,c.error));
