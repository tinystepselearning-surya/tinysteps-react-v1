import test from 'node:test';
import assert from 'node:assert/strict';
import {validId,validName,parseCampusRequest,recordKey,campusIdentity,ACTION} from './campus-contract-candidate.mjs';
const p={tenantId:'tenant-a',organisationId:'org-a',operationId:'op-a',name:'Campus A',timeZone:'Asia/Kolkata'};
const vectors=[
 ['TEN',['tenant-a'],'tenant-a'],['OTB',['org-a'],'org-a'],['AFN',['tenant-a'],'tenant-a'],
 ['TMB',['tenant-a','person-a'],'tmb_1f0027cf03ec8c0faa88d5076022ae677517c6e3cc8d9d4576ab40b4503befc0'],
 ['MEM',['tenant-a','org-a','person-a','member'],'mem_504744d881bf0f5209dec4bf055dbd8f2c76f5acef07a654c0b6983b29ffa2a2'],
 ['VGR',['tenant-a','org-a','person-a',ACTION],'vgr_a93479333eda11395c8d693a74b8f5b3806bc3d6b7183c801a16f0c70729f902'],
 ['AOR',['tenant-a',ACTION],'aor_72a2521185a85e2e525256c473884551d21354cf32d97cf874c28e82fc4a423a'],
 ['CAM',['tenant-a','org-a','person-a',ACTION,'op-a'],'cam_3971fb142618b65931c67c05f83fa530f7d8eb3c28a1fa202ba6f638d17f0043'],
 ['OCR',['tenant-a','person-a',ACTION,'op-a'],'ocr_8b9856b2bde6b8b6111cbf63a3cb9298ae971fe8c704ed338fd6fa68ce730fef']
];
for(const [code,parts,expected] of vectors)test('vector '+code,()=>assert.equal(recordKey(code,parts),expected));
test('semantic hash vector',()=>assert.equal(campusIdentity(p,'person-a').semanticHash,'90511a320e97395af25aef76a366b0e74b6f5059588ba9e9201895099c25ee3c'));
test('same operation different actors independent',()=>{const a=campusIdentity(p,'person-a'),b=campusIdentity(p,'person-b');assert.notEqual(a.campusId,b.campusId);assert.notEqual(a.receiptKey,b.receiptKey)});
test('organisation or payload change retains receipt key but changes semantic hash',()=>{const a=campusIdentity(p,'person-a');for(const q of [{...p,organisationId:'org-b'},{...p,name:'Changed'},{...p,timeZone:'UTC'}]){const b=campusIdentity(q,'person-a');assert.equal(b.receiptKey,a.receiptKey);assert.notEqual(b.semanticHash,a.semanticHash)}});
test('different tenant independent',()=>assert.notEqual(campusIdentity(p,'person-a').receiptKey,campusIdentity({...p,tenantId:'tenant-b'},'person-a').receiptKey));
test('reject client authority fields and accessors without evaluation',()=>{for(const k of ['actorPersonId','generation','clock','path','policy','approval','callback'])assert.equal(parseCampusRequest({...p,[k]:'bad'}),null);const q={...p};Object.defineProperty(q,'name',{enumerable:true,get(){throw Error('must not read')}});assert.equal(parseCampusRequest(q),null);assert.equal(parseCampusRequest({...p,[Symbol('x')]:1}),null)});
test('strict ID boundaries',()=>{for(const s of ['', ' a','a ','a/b','.','..','__reserved__','a\u0000','a\u0085','\ud800','é'.repeat(65)])assert.equal(validId(s),false);assert.ok(validId('é'.repeat(64)));assert.ok(validId('a-b'))});
test('strict name and zone boundaries',()=>{for(const s of ['',' x','x\u007f','e\u0301','\ud800','x'.repeat(121)])assert.equal(validName(s),false);assert.ok(validName('😀'.repeat(120)));for(const timeZone of ['GMT','+05:30','Europe/London'])assert.equal(parseCampusRequest({...p,timeZone}),null);assert.ok(parseCampusRequest(p))});
test('invalid key codes, arity and literals fail closed',()=>{assert.throws(()=>recordKey('toString',['a']));assert.throws(()=>recordKey('VGR',['a','b','c','other']));assert.throws(()=>recordKey('MEM',['a','b','c','schoolAdmin']));assert.throws(()=>recordKey('CAM',['a']));assert.throws(()=>recordKey('TEN',['a/b']))});
test('tuple boundaries cannot collide by concatenation',()=>assert.notEqual(recordKey('TMB',['ab','c']),recordKey('TMB',['a','bc'])));
