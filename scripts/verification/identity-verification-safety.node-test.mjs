import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {safetyCases} from "./identity-verification-safety-cases.mjs";
const bytes=readFileSync(new URL("../milestone3-bounded-principal-audit.mjs",import.meta.url));
const digest=createHash("sha1").update("blob "+bytes.length+"\0").update(bytes).digest("hex");
test("identity safety: exact original sampler source",()=>assert.equal(digest,"683b79a6221eb9b420e7f7692a5982c7bef75ef5"));
if(digest==="683b79a6221eb9b420e7f7692a5982c7bef75ef5"){
  for(const c of await safetyCases(bytes.toString("utf8")))test("identity safety: "+c.name,()=>assert.equal(c.pass,true,c.error));
  test("identity safety: strict subprocess drains parallel rejections",()=>{
    const casesUrl=new URL("./identity-verification-safety-cases.mjs",import.meta.url).href;
    const samplerUrl=new URL("../milestone3-bounded-principal-audit.mjs",import.meta.url).href;
    const script=`import {readFileSync} from "node:fs";
import {safetyCases} from ${JSON.stringify(casesUrl)};
const cases=await safetyCases(readFileSync(new URL(${JSON.stringify(samplerUrl)}),"utf8"));
if(cases.length!==53||cases.some(c=>!c.pass))process.exitCode=1;
await new Promise(resolve=>setImmediate(resolve));
if(!process.exitCode)console.log("STRICT_CASES_PASS:53");`;
    const env={...process.env};delete env.NODE_OPTIONS;delete env.NODE_PATH;delete env.NODE_V8_COVERAGE;
    const child=spawnSync(process.execPath,["--unhandled-rejections=strict","--input-type=module","--eval",script],{encoding:"utf8",timeout:15000,maxBuffer:256*1024,env});
    assert.equal(child.error,undefined);
    assert.equal(child.signal,null);
    assert.equal(child.status,0,child.stderr);
    assert.equal(child.stderr,"");
    assert.equal(child.stdout.trim(),"STRICT_CASES_PASS:53");
  });
}
