import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {safetyCases} from "./identity-verification-safety-cases.mjs";
const bytes=readFileSync(new URL("../milestone3-bounded-principal-audit.mjs",import.meta.url));
const digest=createHash("sha1").update("blob "+bytes.length+"\0").update(bytes).digest("hex");
test("identity safety: exact original sampler source",()=>assert.equal(digest,"683b79a6221eb9b420e7f7692a5982c7bef75ef5"));
if(digest==="683b79a6221eb9b420e7f7692a5982c7bef75ef5"){
  for(const c of await safetyCases(bytes.toString("utf8")))test("identity safety: "+c.name,()=>assert.equal(c.pass,true,c.error));
}
