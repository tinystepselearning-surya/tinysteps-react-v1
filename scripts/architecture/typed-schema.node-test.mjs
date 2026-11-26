import test from "node:test";
import assert from "node:assert/strict";
import {validateSyntheticRecord} from "./typed-schema-core.mjs";
import {typedSchemaCases} from "./typed-schema-cases.mjs";
for(const c of typedSchemaCases(validateSyntheticRecord))test("typed schema: "+c.name,()=>assert.equal(c.pass,true,c.error));
