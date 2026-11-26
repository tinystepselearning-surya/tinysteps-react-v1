import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseTenantContract as tenant,parseOrganisationContract as org,parseCampusContract as campus,inspectInstitutionalFixture as inspect,TENANT_STATUSES,ORGANISATION_TYPES,ORGANISATION_STATUSES,CAMPUS_STATUSES} from './institutional-context-contracts.ts';

const t=Object.freeze({tenantId:'fixture-tenant-a',name:'Fixture tenant',status:'active'});
const o=Object.freeze({organisationId:'fixture-org-a',tenantId:t.tenantId,type:'school',name:'Fixture organisation',status:'active'});
const c=Object.freeze({campusId:'fixture-campus-a',tenantId:t.tenantId,organisationId:o.organisationId,name:'Fixture campus',timeZone:'Asia/Kolkata',status:'active'});
const pair=(documentId,record)=>({documentId,record});
const input=()=>({tenant:pair(t.tenantId,t),organisation:pair(o.organisationId,o)});
const full=()=>({...input(),campus:pair(c.campusId,c)});
const fail=(result,code)=>assert.deepEqual(result,{ok:false,code});
const good=(result)=>{assert.equal(result.ok,true);assert.ok(Object.isFrozen(result.record));return result.record;};
test('tenant candidate shape and immutable result',()=>assert.deepEqual(good(tenant(t.tenantId,t)),t));
test('organisation retains existing fields and tenant ownership',()=>assert.deepEqual(good(org(o.organisationId,o)),o));
test('campus shape and timezone',()=>assert.deepEqual(good(campus(c.campusId,c)),c));
test('owned online context has no synthetic campus',()=>{const x=good(inspect(input()));assert.equal(x.campus,null);assert.equal(x.authorizationEvaluated,false);});
test('physical campus context joins exact parents',()=>{const x=good(inspect(full()));assert.deepEqual(x.campus,c);assert.equal(x.authorizationEvaluated,false);});
test('inactive and closed states are not access decisions',()=>{const x=full();x.tenant.record={...t,status:'closed'};x.organisation.record={...o,status:'archived'};x.campus.record={...c,status:'inactive'};assert.equal(good(inspect(x)).authorizationEvaluated,false);});
test('optional legacy values absent or null retained',()=>{assert.equal(Object.hasOwn(good(org(o.organisationId,o)),'countryCode'),false);assert.deepEqual(good(org(o.organisationId,{...o,countryCode:null,legacySchoolCode:null})),{...o,countryCode:null,legacySchoolCode:null});});
test('valid optional country and school code preserved',()=>assert.deepEqual(good(org(o.organisationId,{...o,countryCode:'IN',legacySchoolCode:'Fixture school 1'})),{...o,countryCode:'IN',legacySchoolCode:'Fixture school 1'}));
test('no inferred tenant from legacy organisation',()=>{const {tenantId,...legacy}=o;fail(org(o.organisationId,legacy),'MISSING_FIELD');});
test('unknown field rejected, not interpreted as grant',()=>fail(tenant(t.tenantId,{...t,role:'admin'}),'UNKNOWN_FIELD'));
test('injected prototype rejected',()=>fail(tenant(t.tenantId,Object.assign(Object.create({role:'admin'}),t)),'INVALID_OBJECT'));
test('null-prototype plain DTO supported',()=>assert.deepEqual(good(tenant(t.tenantId,Object.assign(Object.create(null),t))),t));
test('accessor not invoked',()=>{let called=false;const value={...t};Object.defineProperty(value,'name',{enumerable:true,get(){called=true;return 'fixture';}});fail(tenant(t.tenantId,value),'INVALID_OBJECT');assert.equal(called,false);});
test('symbol or hidden property rejected',()=>{const v={...t,[Symbol('x')]:true};fail(tenant(t.tenantId,v),'UNKNOWN_FIELD');const h={...t};Object.defineProperty(h,'name',{value:'hidden',enumerable:false});fail(tenant(t.tenantId,h),'INVALID_OBJECT');});
test('missing required field and null rejected',()=>{const {name,...missing}=t;fail(tenant(t.tenantId,missing),'MISSING_FIELD');fail(tenant(t.tenantId,{...t,name:null}),'INVALID_NAME');});
test('unsafe identifiers rejected without normalization',()=>{for(const id of ['', ' a','a ','a\n','a/b','a\u001fb','__x__','a'.repeat(129)])fail(tenant(id,{...t,tenantId:id}),'INVALID_ID');});
test('record key mismatch rejected',()=>{fail(tenant('fixture-other',t),'KEY_MISMATCH');fail(org('fixture-other',o),'KEY_MISMATCH');fail(campus('fixture-other',c),'KEY_MISMATCH');});
test('name bounds, controls, Unicode and whitespace',()=>{for(const name of ['', ' ', ' x','x\n','a\u0000b','a'.repeat(201),'\ud800'])fail(tenant(t.tenantId,{...t,name}),'INVALID_NAME');assert.equal(good(tenant(t.tenantId,{...t,name:'పాఠశాల'})).name,'పాఠశాల');});
test('lifecycle vocabulary strictly checked',()=>{fail(tenant(t.tenantId,{...t,status:'inactive'}),'INVALID_ENUM');fail(org(o.organisationId,{...o,status:'closed'}),'INVALID_ENUM');fail(campus(c.campusId,{...c,status:'paused'}),'INVALID_ENUM');});
test('organisation type strict',()=>fail(org(o.organisationId,{...o,type:'campus'}),'INVALID_ENUM'));
test('country shape not silently uppercased',()=>{for(const countryCode of ['in','IND','IN\n',undefined])fail(org(o.organisationId,{...o,countryCode}),'INVALID_COUNTRY_CODE');});
test('legacy code malformed rejected without migration',()=>fail(org(o.organisationId,{...o,legacySchoolCode:'  '}),'INVALID_LEGACY_CODE'));
test('timezone IANA name or UTC, no numeric offsets',()=>{for(const timeZone of ['Mars/Olympus','+05:30','IST','',null])fail(campus(c.campusId,{...c,timeZone}),'INVALID_TIME_ZONE');assert.equal(good(campus(c.campusId,{...c,timeZone:'UTC'})).timeZone,'UTC');});
test('cross-tenant organisation rejected',()=>{const x=input();x.organisation.record={...o,tenantId:'fixture-tenant-b'};fail(inspect(x),'OWNER_MISMATCH');});
test('cross-tenant campus rejected',()=>{const x=full();x.campus.record={...c,tenantId:'fixture-tenant-b'};fail(inspect(x),'OWNER_MISMATCH');});
test('wrong organisation even in same tenant rejected',()=>{const x=full();x.campus.record={...c,organisationId:'fixture-org-b'};fail(inspect(x),'OWNER_MISMATCH');});
test('explicit null campus is not a valid fixture',()=>fail(inspect({...input(),campus:null}),'INVALID_OBJECT'));
test('no permissions or memberships accepted in fixture input',()=>fail(inspect({...input(),membership:{status:'active'}}),'UNKNOWN_FIELD'));
test('does not mutate input and returns copies',()=>{const x=structuredClone(full());const before=structuredClone(x);const y=good(inspect(x));assert.deepEqual(x,before);assert.notEqual(y.tenant,x.tenant.record);assert.ok(Object.isFrozen(y.tenant));assert.ok(Object.isFrozen(y.organisation));assert.ok(Object.isFrozen(y.campus));});
const read=(p)=>readFileSync(new URL('../../'+p,import.meta.url));
const sha=(b)=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
test('registry field names, optionality and exact enum vocabulary pinned',()=>{
  const shard=read('docs/architecture/registry/domains/identity-institutional.json');
  assert.equal(sha(shard),'f4f0efc8e54b749148f5b54e1b1d37ee807e5ee1');
  const records=JSON.parse(shard).records;
  for(const [code,expected,optional] of [['TEN',t,[]],['ORG',o,['countryCode','legacySchoolCode']],['CAM',c,[]]]){
    const items=records.find(x=>x.code===code).items;
    assert.deepEqual(items.map(x=>x.semanticName).sort(),[...Object.keys(expected),...optional].sort());
    assert.deepEqual(items.filter(x=>x.cardinality==='0..1').map(x=>x.semanticName).sort(),optional.sort());
    assert.ok(items.every(x=>x.nullable===optional.includes(x.semanticName)));
  }
  const manifest=JSON.parse(read('docs/architecture/registry/TSOS_V2_MASTER_RECORD_ITEM_REGISTRY_DRAFT.json'));
  for(const [key,values] of [['tenantStatus',TENANT_STATUSES],['organisationType',ORGANISATION_TYPES],['organisationStatus',ORGANISATION_STATUSES],['activeInactive',CAMPUS_STATUSES]])assert.deepEqual(manifest.valueSets.find(x=>x.id===key).codes,[...values]);
});
test('legacy identity/authorization and key strategy sources remain exact',()=>{
  for(const [path,pin] of [
    ['functions/src/schoolOS/identity/contracts.ts','be340ac4cb6be06effa1d09e1510a1e75f08c70a'],
    ['functions/src/schoolOS/identity/idStrategy.ts','02037d2dd897cd06f5dc67e32d20b70824ea1527'],
    ['functions/src/schoolOS/identity/authAccessReadModel.ts','461dbab181c6d77b21fc75f5871ce6244dc840ab'],
    ['functions/src/schoolOS/identity/authAccessAuthorization.ts','812429177c5dd9c7fcad6616e4a7d05bac20aeb5'],
    ['functions/src/helpers/schoolAuthorization.ts','0f2fa04cd1b5ed70c9ae9581d3eb7215cdcbfd6b']
  ])assert.equal(sha(read(path)),pin,path);
});
