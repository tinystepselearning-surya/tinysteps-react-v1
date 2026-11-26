import test from 'node:test';
import assert from 'node:assert/strict';
import {readCandidate,validateCandidate,verifyRegistrySuccessor} from './registry-successor.mjs';
test('pinned historical registry plus additive candidate',()=>assert.deepEqual(verifyRegistrySuccessor(),{valid:true,adopted:false,productionActivation:false,counts:{records:134,businessItems:1000,sharedItems:5,bindings:9}}));
const adverse=[
 ['duplicate new record',o=>o.newRecordCodes[1]=o.newRecordCodes[0]],
 ['shared namespace change',o=>o.sharedFieldSet.namespace='MEM'],
 ['duplicate shared item',o=>o.sharedFieldSet.items[1].itemId=o.sharedFieldSet.items[0].itemId],
 ['duplicate business item',o=>o.bindings[1].fields[1].itemId=o.bindings[1].fields[0].itemId],
 ['historical binding replacement',o=>o.bindings.find(b=>b.recordCode==='MEM').historicalStorage.collectionCandidate='tsosV2OrganisationMemberships'],
 ['physical collision',o=>o.bindings[1].collection=o.bindings[0].collection],
 ['binding owner mismatch',o=>o.bindings[0].ownerDomain='platform'],
 ['binding version drift',o=>o.bindings[0].version=2],
 ['missing shared inheritance',o=>o.bindings[0].sharedNamespace=null],
 ['shared field collision',o=>o.bindings[0].fields[0].name='createdAt'],
 ['binding field missing',o=>o.bindings[0].fields.pop()],
 ['nullable start regression',o=>o.bindings.find(b=>b.recordCode==='TMB').fields[4].nullable=true],
 ['key scope drift',o=>o.bindings.find(b=>b.recordCode==='CAM').key.components.splice(2,1)],
 ['timezone expansion',o=>o.valueSets.timeZone.push('Europe/London')],
 ['candidate activation flag',o=>o.status='adopted']
];
for(const [name,mutate] of adverse)test(name,()=>{const {m,o,records}=readCandidate();mutate(o);assert.throws(()=>validateCandidate(m,o,records))});
test('manifest count drift',()=>{const {m,o,records}=readCandidate();m.counts.businessItems++;assert.throws(()=>validateCandidate(m,o,records))});
