import test from "node:test";
import assert from "node:assert/strict";
import {evaluateSyntheticRules} from "./business-rule-core.mjs";
import {businessRuleCases} from "./business-rule-cases.mjs";
for(const c of businessRuleCases(evaluateSyntheticRules))test("business rule: "+c.name,()=>assert.equal(c.pass,true,c.error));
