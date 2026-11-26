import test from "node:test";
import assert from "node:assert/strict";
import {resolveSyntheticConfig} from "./config-resolver-core.mjs";
import {configCases} from "./config-resolver-cases.mjs";
for(const c of configCases(resolveSyntheticConfig))test("configuration: "+c.name,()=>assert.equal(c.pass,true,c.error));
