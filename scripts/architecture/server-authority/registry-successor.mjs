// Offline additive candidate. No production imports or executable authority adoption.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,relative} from 'node:path';
const ROOT=realpathSync(fileURLToPath(new URL('../../../',import.meta.url)));
const MANIFEST='docs/architecture/registry/gate-b/manifest.json';
const MANIFEST_PIN='8fcd31da4da1120943a42eed221144dcc764ae9b';
const basePin={"path":"docs/architecture/registry/TSOS_V2_MASTER_RECORD_ITEM_REGISTRY_DRAFT.json","blobSha":"7f0464dfb6b79a22ddfa43d412081b13930f04c3","registryVersion":"0.6-draft","shards":[{"path":"docs/architecture/registry/domains/identity-institutional.json","blobSha":"f4f0efc8e54b749148f5b54e1b1d37ee807e5ee1"},{"path":"docs/architecture/registry/domains/academic-delivery.json","blobSha":"3d661e8dd3bc09feed5b666a7ebf7fc0648f8601"},{"path":"docs/architecture/registry/domains/learning-resources.json","blobSha":"c20fbafee877e47fea59a25f2033e19d9213900a"},{"path":"docs/architecture/registry/domains/commerce-operations.json","blobSha":"d5a8f9bf9dae3c3f875a243522bb3c782784be32"},{"path":"docs/architecture/registry/domains/platform.json","blobSha":"1f116526d1bbd9017dbcd26aaed0277766e5079d"}]};
const expected={"TEN":{"collection":"tsosV2Tenants","key":{"kind":"direct","domain":"TSOS:B02:GATE-B:KEY:1:TEN","prefix":"ten_","components":["tenantId"]},"ownerDomain":"identity","fields":[["TEN-1001","tenantId","id"],["TEN-1002","name","text"],["TEN-1003","status","tenantStatus"]]},"OTB":{"collection":"tsosV2OrganisationTenantBindings","key":{"kind":"direct","domain":"TSOS:B02:GATE-B:KEY:1:OTB","prefix":"otb_","components":["organisationId"]},"ownerDomain":"identity","fields":[["OTB-1001","organisationId","id"],["OTB-1002","tenantId","id"],["OTB-1003","status","activeInactive"],["OTB-1004","revision","positiveInteger"]]},"TMB":{"collection":"tsosV2TenantMemberships","key":{"kind":"sha256-json-tuple","domain":"TSOS:B02:GATE-B:KEY:1:TMB","prefix":"tmb_","components":["tenantId","personId"]},"ownerDomain":"identity","fields":[["TMB-1001","tenantMembershipId","id"],["TMB-1002","tenantId","id"],["TMB-1003","personId","id"],["TMB-1004","status","activeInactive"],["TMB-1005","effectiveStartAt","timestamp"],["TMB-1006","effectiveEndAt","nullableTimestamp"]]},"MEM":{"collection":"tsosV2OrganisationMemberships","key":{"kind":"sha256-json-tuple","domain":"TSOS:B02:GATE-B:KEY:1:MEM","prefix":"mem_","components":["tenantId","organisationId","personId","member"]},"ownerDomain":"identity","fields":[["MEM-1001","organisationMembershipId","id"],["MEM-1002","organisationId","id"],["MEM-1003","personId","id"],["MEM-1004","role","member"],["MEM-1005","status","activeInactive"],["MEM-1006","isPrimary","boolean"],["MEM-1007","effectiveStartAt","timestamp"],["MEM-1008","effectiveEndAt","nullableTimestamp"],["MEM-1009","tenantId","id"]]},"VGR":{"collection":"tsosV2AuthorityGrants","key":{"kind":"sha256-json-tuple","domain":"TSOS:B02:GATE-B:KEY:1:VGR","prefix":"vgr_","components":["tenantId","organisationId","personId","campus.create"]},"ownerDomain":"identity","fields":[["VGR-1001","grantId","id"],["VGR-1002","tenantId","id"],["VGR-1003","organisationId","id"],["VGR-1004","personId","id"],["VGR-1005","roleKey","campusCreator"],["VGR-1006","action","campusCreate"],["VGR-1007","status","grantStatus"],["VGR-1008","effectiveStartAt","timestamp"],["VGR-1009","effectiveEndAt","nullableTimestamp"],["VGR-1010","revision","positiveInteger"]]},"AFN":{"collection":"tsosV2AuthorityFences","key":{"kind":"direct","domain":"TSOS:B02:GATE-B:KEY:1:AFN","prefix":"afn_","components":["tenantId"]},"ownerDomain":"identity","fields":[["AFN-1001","tenantId","id"],["AFN-1002","generation","positiveInteger"]]},"AOR":{"collection":"tsosV2ActionRoutes","key":{"kind":"sha256-json-tuple","domain":"TSOS:B02:GATE-B:KEY:1:AOR","prefix":"aor_","components":["tenantId","campus.create"]},"ownerDomain":"identity","fields":[["AOR-1001","tenantId","id"],["AOR-1002","action","campusCreate"],["AOR-1003","lane","routeLane"],["AOR-1004","epoch","positiveInteger"]]},"CAM":{"collection":"tsosV2Campuses","key":{"kind":"sha256-json-tuple","domain":"TSOS:B02:GATE-B:KEY:1:CAM","prefix":"cam_","components":["tenantId","organisationId","actorPersonId","campus.create","operationId"]},"ownerDomain":"school-partnerships","fields":[["CAM-1001","campusId","id"],["CAM-1002","tenantId","id"],["CAM-1003","organisationId","id"],["CAM-1004","name","campusName"],["CAM-1005","timeZone","timeZone"],["CAM-1006","status","initialActive"],["CAM-1007","revision","one"]]},"OCR":{"collection":"tsosV2OperationReceipts","key":{"kind":"sha256-json-tuple","domain":"TSOS:B02:GATE-B:KEY:1:OCR","prefix":"ocr_","components":["tenantId","actorPersonId","campus.create","operationId"]},"ownerDomain":"identity","fields":[["OCR-1001","receiptKey","id"],["OCR-1002","tenantId","id"],["OCR-1003","actorPersonId","id"],["OCR-1004","action","campusCreate"],["OCR-1005","semanticHash","sha256"],["OCR-1006","campusId","id"],["OCR-1007","committedRevision","one"]]}};
const expectedShared={"namespace":"VAF","version":1,"ownerDomain":"identity","items":[{"itemId":"VAF-1001","name":"schemaVersion","type":"one","required":true,"nullable":false},{"itemId":"VAF-1002","name":"createdAt","type":"timestamp","required":true,"nullable":false},{"itemId":"VAF-1003","name":"updatedAt","type":"timestamp","required":true,"nullable":false},{"itemId":"VAF-1004","name":"createdBy","type":"actorId","required":true,"nullable":false},{"itemId":"VAF-1005","name":"updatedBy","type":"actorId","required":true,"nullable":false}]};
const expectedSets={"activeInactive":["active","inactive"],"tenantStatus":["active","suspended","closed"],"member":["member"],"campusCreator":["campusCreator"],"campusCreate":["campus.create"],"grantStatus":["active","revoked"],"routeLane":["disabled","successor"],"initialActive":["active"],"timeZone":["Asia/Kolkata","UTC"]};
const expectedCounts={records:134,businessItems:1000,sharedItems:5,bindings:9};
const types=new Set(['id','actorId','text','campusName','positiveInteger','one','timestamp','nullableTimestamp','boolean','sha256',...Object.keys(expectedSets)]);
export function gitBlobSha(bytes){return createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex')}
function read(path){
  const f=resolve(ROOT,path);
  assert.equal(relative(ROOT,realpathSync(f)),path,'PATH_ESCAPE');
  const s=lstatSync(f);assert.ok(s.isFile()&&!s.isSymbolicLink()&&s.size<4*1024*1024,'UNSAFE_METADATA');
  const bytes=readFileSync(f);return {sha:gitBlobSha(bytes),data:JSON.parse(bytes.toString('utf8'))};
}
const add=(set,x,reason)=>{assert.ok(!set.has(x),reason);set.add(x)};
export function validateCandidate(m,o,records){
  assert.equal(m.formatVersion,1);assert.equal(m.registryVersion,'0.7-gate-b-candidate');assert.equal(m.status,'candidate-not-adopted');
  assert.deepEqual(m.base,basePin);assert.deepEqual(m.counts,expectedCounts);
  assert.equal(m.overlay.path,'docs/architecture/registry/gate-b/physical-bindings-v1.json');
  assert.equal(m.approval.programmeRevision,65);assert.equal(m.approval.preAdoption,'dynamic-path classification pending');
  assert.equal(o.formatVersion,1);assert.equal(o.registryVersion,m.registryVersion);assert.equal(o.status,m.status);
  assert.deepEqual(o.sharedFieldSet,expectedShared);assert.deepEqual(o.valueSets,expectedSets);
  assert.deepEqual(o.newRecordCodes,['OTB','VGR','AFN','AOR','OCR']);assert.deepEqual(o.newBusinessItems,['MEM-1009','CAM-1007']);
  assert.equal(records.length,129);
  const byCode=new Map(),ids=new Set(),physical=new Set();
  for(const r of records){
    assert.ok(!byCode.has(r.code),'DUPLICATE_RECORD');byCode.set(r.code,r);
    for(const i of r.items)add(ids,i.itemId,'DUPLICATE_HISTORICAL_ITEM');
    if(r.storage?.collectionCandidate)physical.add(r.storage.collectionCandidate.toLowerCase());
  }
  assert.equal(ids.size,971);assert.ok(!byCode.has('VAF'));
  for(const code of o.newRecordCodes)assert.ok(!byCode.has(code),'RECORD_CODE_COLLISION');
  const sharedNames=new Set();
  for(const f of o.sharedFieldSet.items){add(ids,f.itemId,'SHARED_ITEM_COLLISION');add(sharedNames,f.name,'SHARED_FIELD_COLLISION')}
  assert.equal(ids.size,976);
  const bindings=new Set(),newIds=new Set();
  for(const b of o.bindings){
    const code=b.recordCode,e=expected[code],r=byCode.get(code);
    assert.ok(Object.hasOwn(expected,code),'UNKNOWN_BINDING');add(bindings,code,'DUPLICATE_BINDING');
    assert.equal(b.version,1);assert.equal(b.ownerDomain,r?.ownerDomain??'identity');assert.equal(b.ownerDomain,e.ownerDomain);
    assert.equal(b.collection,e.collection);add(physical,b.collection.toLowerCase(),'PHYSICAL_COLLISION');
    assert.deepEqual(b.historicalStorage,r?.storage??null);assert.equal(b.sharedNamespace,'VAF');assert.deepEqual(b.key,e.key);
    assert.deepEqual(b.fields.map(f=>[f.itemId,f.name,f.type]),e.fields);
    const fields=new Set(sharedNames),localIds=new Set();
    for(const f of b.fields){
      assert.deepEqual(Object.keys(f).sort(),['itemId','name','nullable','required','type']);
      assert.ok(f.itemId.startsWith(code+'-')&&/^[A-Z]{3}-[0-9]{4}$/.test(f.itemId),'ITEM_NAMESPACE');
      assert.ok(types.has(f.type)&&f.required===true&&f.nullable===(f.type==='nullableTimestamp'),'FIELD_CONTRACT');
      add(fields,f.name,'INHERITED_FIELD_COLLISION');add(localIds,f.itemId,'DUPLICATE_BINDING_ITEM');
      const old=r?.items.find(i=>i.itemId===f.itemId);
      if(old)assert.equal(old.semanticName,f.name,'HISTORICAL_SEMANTIC_DRIFT');
      else {assert.ok(!r||o.newBusinessItems.includes(f.itemId),'UNAPPROVED_ITEM');add(ids,f.itemId,'ITEM_COLLISION');add(newIds,f.itemId,'DUPLICATE_NEW_ITEM')}
    }
    for(const i of r?.items??[])assert.ok(localIds.has(i.itemId),'HISTORICAL_ITEM_MISSING');
  }
  assert.equal(bindings.size,9);assert.equal(o.bindings.length,9);
  assert.equal(newIds.size,29);assert.equal(ids.size,1005);
  assert.equal(records.length+o.newRecordCodes.length,expectedCounts.records);
  return {valid:true,adopted:false,productionActivation:false,counts:expectedCounts};
}
export function readCandidate(){
  const mf=read(MANIFEST);assert.equal(mf.sha,MANIFEST_PIN,'CANDIDATE_MANIFEST_DRIFT');const m=mf.data;
  assert.deepEqual(m.base,basePin);
  const historical=read(basePin.path);assert.equal(historical.sha,basePin.blobSha,'HISTORICAL_MANIFEST_DRIFT');
  assert.equal(historical.data.registryVersion,'0.6-draft');assert.deepEqual(historical.data.shards.map(s=>({path:'docs/architecture/registry/'+s.path,blobSha:s.blobSha})),basePin.shards);
  const records=basePin.shards.flatMap(p=>{const f=read(p.path);assert.equal(f.sha,p.blobSha,'HISTORICAL_SHARD_DRIFT');return f.data.records});
  const overlay=read('docs/architecture/registry/gate-b/physical-bindings-v1.json');assert.equal(overlay.sha,m.overlay.blobSha,'OVERLAY_HASH');
  return {m,o:overlay.data,records};
}
export function verifyRegistrySuccessor(){const {m,o,records}=readCandidate();return validateCandidate(m,o,records)}
