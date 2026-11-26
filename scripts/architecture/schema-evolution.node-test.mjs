import test from "node:test";
import assert from "node:assert/strict";
import {projectSyntheticEvolution} from "./schema-evolution-core.mjs";
import {schemaEvolutionCases} from "./schema-evolution-cases.mjs";
for(const c of schemaEvolutionCases(projectSyntheticEvolution))test("schema evolution: "+c.name,()=>assert.equal(c.pass,true,c.error));
