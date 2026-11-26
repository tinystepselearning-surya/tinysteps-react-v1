// B02-R3.1: isolated proposed contract DTOs, never a runtime authorization or storage adapter.
import type { OrganisationRecord } from '../../functions/src/schoolOS/identity/contracts.ts';

const SCOPE = 'synthetic-institutional-contract-v1' as const;
export const TENANT_STATUSES = Object.freeze(['active','suspended','closed'] as const);
export const ORGANISATION_TYPES = Object.freeze(['school','company','partner','other'] as const satisfies readonly OrganisationRecord['type'][]);
export const ORGANISATION_STATUSES = Object.freeze(['active','paused','archived'] as const satisfies readonly OrganisationRecord['status'][]);
export const CAMPUS_STATUSES = Object.freeze(['active','inactive'] as const);
export type TenantContract = Readonly<{tenantId:string;name:string;status:typeof TENANT_STATUSES[number]}>;
export type OrganisationContract = Readonly<Pick<OrganisationRecord,'organisationId'|'type'|'name'|'status'|'countryCode'|'legacySchoolCode'> & {tenantId:string}>;
export type CampusContract = Readonly<{campusId:string;tenantId:string;organisationId:string;name:string;timeZone:string;status:typeof CAMPUS_STATUSES[number]}>;
type Code = 'INVALID_OBJECT'|'UNKNOWN_FIELD'|'MISSING_FIELD'|'INVALID_ID'|'KEY_MISMATCH'|'INVALID_NAME'|'INVALID_ENUM'|'INVALID_COUNTRY_CODE'|'INVALID_LEGACY_CODE'|'INVALID_TIME_ZONE'|'OWNER_MISMATCH';
type Failure = Readonly<{ok:false;code:Code}>;
type Result<T> = Readonly<{ok:true;record:T}>|Failure;
type Shape = Record<string,unknown>;
class ContractError extends Error {
  readonly code:Code;
  constructor(code:Code){super(code);this.code=code;}
}
function check(value:unknown, code:Code):asserts value {
  if(!value)throw new ContractError(code);
}
function safe<T>(fn:()=>T):Result<T>{
  try{return Object.freeze({ok:true as const,record:fn()});}
  catch(e){return Object.freeze({ok:false as const,code:e instanceof ContractError?e.code:'INVALID_OBJECT'});}
}
function shape(value:unknown,required:readonly string[],optional:readonly string[]=[]):Shape{
  check(typeof value==='object'&&value!==null&&!Array.isArray(value),'INVALID_OBJECT');
  const proto=Object.getPrototypeOf(value);
  check(proto===Object.prototype||proto===null,'INVALID_OBJECT');
  const keys=Reflect.ownKeys(value);
  check(keys.length<=required.length+optional.length,'UNKNOWN_FIELD');
  const out:Shape=Object.create(null);
  for(const key of keys){
    check(typeof key==='string'&&(required.includes(key)||optional.includes(key)),'UNKNOWN_FIELD');
    const d=Object.getOwnPropertyDescriptor(value,key);
    check(d&&d.enumerable&&Object.hasOwn(d,'value'),'INVALID_OBJECT');
    out[key]=d.value;
  }
  for(const key of required)check(Object.hasOwn(out,key),'MISSING_FIELD');
  return out;
}
// Proposed narrow prospective ID format; never normalize/rekey a legacy ID.
function id(v:unknown):string{
  check(typeof v==='string'&&v.trim()===v&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(v),'INVALID_ID');return v;
}
function matchingId(v:unknown,documentId:unknown):string{
  const actual=id(v);check(actual===id(documentId),'KEY_MISMATCH');return actual;
}
function label(v:unknown,code:'INVALID_NAME'|'INVALID_LEGACY_CODE',max:number):string{
  check(typeof v==='string'&&v.length>0&&v.length<=max&&v.trim()===v&&
    !/[\u0000-\u001f\u007f-\u009f]/u.test(v)&&v.isWellFormed(),code);return v;
}
function member<T extends string>(v:unknown,allowed:readonly T[]):T{
  check(typeof v==='string'&&allowed.includes(v as T),'INVALID_ENUM');return v as T;
}
function zone(v:unknown):string{
  check(typeof v==='string'&&v.length<=128&&(v==='UTC'||/^[A-Za-z][A-Za-z0-9_+.-]*(?:\/[A-Za-z0-9_+.-]+)+$/.test(v)),'INVALID_TIME_ZONE');
  try{new Intl.DateTimeFormat('en',{timeZone:v});}catch{throw new ContractError('INVALID_TIME_ZONE');}
  return v;
}
function country(v:unknown):string|null{
  if(v===null)return null;
  check(typeof v==='string'&&v.length===2&&/^[A-Z]{2}$/.test(v),'INVALID_COUNTRY_CODE');return v;
}
export function parseTenantContract(documentId:unknown,value:unknown):Result<TenantContract>{
  return safe(()=>{
    const x=shape(value,['tenantId','name','status']);
    return Object.freeze({tenantId:matchingId(x.tenantId,documentId),name:label(x.name,'INVALID_NAME',200),status:member(x.status,TENANT_STATUSES)});
  });
}
export function parseOrganisationContract(documentId:unknown,value:unknown):Result<OrganisationContract>{
  return safe(()=>{
    const x=shape(value,['organisationId','tenantId','type','name','status'],['countryCode','legacySchoolCode']);
    return Object.freeze({organisationId:matchingId(x.organisationId,documentId),tenantId:id(x.tenantId),
      type:member(x.type,ORGANISATION_TYPES),name:label(x.name,'INVALID_NAME',200),status:member(x.status,ORGANISATION_STATUSES),
      ...(Object.hasOwn(x,'countryCode')?{countryCode:country(x.countryCode)}:{}),
      ...(Object.hasOwn(x,'legacySchoolCode')?{legacySchoolCode:x.legacySchoolCode===null?null:label(x.legacySchoolCode,'INVALID_LEGACY_CODE',128)}:{})});
  });
}
export function parseCampusContract(documentId:unknown,value:unknown):Result<CampusContract>{
  return safe(()=>{
    const x=shape(value,['campusId','tenantId','organisationId','name','timeZone','status']);
    return Object.freeze({campusId:matchingId(x.campusId,documentId),tenantId:id(x.tenantId),organisationId:id(x.organisationId),
      name:label(x.name,'INVALID_NAME',200),timeZone:zone(x.timeZone),status:member(x.status,CAMPUS_STATUSES)});
  });
}
type FixtureInput = Readonly<{documentId:unknown;record:unknown}>;
type ContextShape = Readonly<{scope:typeof SCOPE;authorizationEvaluated:false;tenant:TenantContract;organisation:OrganisationContract;campus:CampusContract|null}>;
function fixture(value:unknown):FixtureInput{
  const x=shape(value,['documentId','record']);return {documentId:x.documentId,record:x.record};
}
function unwrap<T>(result:Result<T>):T{
  if(!result.ok)throw new ContractError(result.code);return result.record;
}
// Checks record structure and ownership consistency ONLY. Inactive records remain
// structurally valid; this function MUST NOT be used to decide access or action eligibility.
export function inspectInstitutionalFixture(input:unknown):Result<ContextShape>{
  return safe(()=>{
    const x=shape(input,['tenant','organisation'],['campus']);
    const t=fixture(x.tenant),o=fixture(x.organisation);
    const tenant=unwrap(parseTenantContract(t.documentId,t.record));
    const organisation=unwrap(parseOrganisationContract(o.documentId,o.record));
    check(tenant.tenantId===organisation.tenantId,'OWNER_MISMATCH');
    let campus:CampusContract|null=null;
    if(Object.hasOwn(x,'campus')){
      const c=fixture(x.campus);campus=unwrap(parseCampusContract(c.documentId,c.record));
      check(campus.tenantId===tenant.tenantId&&campus.organisationId===organisation.organisationId,'OWNER_MISMATCH');
    }
    return Object.freeze({scope:SCOPE,authorizationEvaluated:false as const,tenant,organisation,campus});
  });
}
