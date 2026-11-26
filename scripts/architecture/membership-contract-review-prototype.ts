// Review-only synthetic membership prototype. No runtime/auth/storage adapter.
import { createHash } from 'node:crypto';
import type { OrganisationMembershipRecord } from '../../functions/src/schoolOS/identity/contracts.ts';

export const MEMBERSHIP_ROLES=Object.freeze(['schoolAdmin','teacher','learningPartner','member'] as const satisfies readonly OrganisationMembershipRecord['role'][]);
export const MEMBERSHIP_STATUSES=Object.freeze(['active','inactive'] as const);
type Interval=Readonly<{effectiveStartAt?:number|null;effectiveEndAt?:number|null}>;
export type TenantMembership=Readonly<{tenantMembershipId:string;tenantId:string;personId:string;status:typeof MEMBERSHIP_STATUSES[number]}> & Interval;
export type OrganisationMembership=Readonly<Pick<OrganisationMembershipRecord,'organisationMembershipId'|'organisationId'|'personId'|'role'|'status'|'isPrimary'>> & Interval;
type Code='SHAPE'|'FIELD'|'ID'|'KEY_MISMATCH'|'ENUM'|'BOOLEAN'|'TIME'|'INTERVAL'|'DUPLICATE_ID'|'DUPLICATE_RELATIONSHIP'|'BOUND';
type Result<T>=Readonly<{ok:true;value:T}>|Readonly<{ok:false;code:Code}>;
class Rejected extends Error {readonly code:Code;constructor(code:Code){super(code);this.code=code;}}
function requireThat(condition:unknown,code:Code):asserts condition{if(!condition)throw new Rejected(code);}
function safe<T>(fn:()=>T):Result<T>{try{return Object.freeze({ok:true as const,value:fn()});}catch(e){return Object.freeze({ok:false as const,code:e instanceof Rejected?e.code:'SHAPE'});}}
function shape(v:unknown,required:readonly string[],optional:readonly string[]=[]):Record<string,unknown>{
  requireThat(v!==null&&typeof v==='object'&&!Array.isArray(v),'SHAPE');
  const p=Object.getPrototypeOf(v);requireThat(p===null||p===Object.prototype,'SHAPE');
  const out:Record<string,unknown>=Object.create(null);
  const keys=Reflect.ownKeys(v);requireThat(keys.length<=required.length+optional.length,'FIELD');
  for(const k of keys){
    requireThat(typeof k==='string'&&(required.includes(k)||optional.includes(k)),'FIELD');
    const d=Object.getOwnPropertyDescriptor(v,k);requireThat(d&&d.enumerable&&Object.hasOwn(d,'value'),'SHAPE');out[k]=d.value;
  }
  for(const k of required)requireThat(Object.hasOwn(out,k),'FIELD');
  return out;
}
function id(v:unknown):string{
  requireThat(typeof v==='string'&&v.trim()===v&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(v),'ID');return v;
}
function matching(v:unknown,key:unknown):string{const x=id(v);requireThat(x===id(key),'KEY_MISMATCH');return x;}
function enumValue<T extends string>(v:unknown,values:readonly T[]):T{requireThat(typeof v==='string'&&values.includes(v as T),'ENUM');return v as T;}
function instant(v:unknown):number{
  requireThat(typeof v==='number'&&Number.isSafeInteger(v)&&v>=-62135596800000&&v<=253402300799999,'TIME');return v;
}
function interval(x:Record<string,unknown>):Interval{
  const out:{effectiveStartAt?:number|null;effectiveEndAt?:number|null}={};
  for(const k of ['effectiveStartAt','effectiveEndAt'] as const)if(Object.hasOwn(x,k))out[k]=x[k]===null?null:instant(x[k]);
  if(typeof out.effectiveStartAt==='number'&&typeof out.effectiveEndAt==='number')requireThat(out.effectiveEndAt>out.effectiveStartAt,'INTERVAL');
  return out;
}
export function parseTenantMembership(key:unknown,v:unknown):Result<TenantMembership>{
  return safe(()=>{
    const x=shape(v,['tenantMembershipId','tenantId','personId','status'],['effectiveStartAt','effectiveEndAt']);
    return Object.freeze({tenantMembershipId:matching(x.tenantMembershipId,key),tenantId:id(x.tenantId),personId:id(x.personId),status:enumValue(x.status,MEMBERSHIP_STATUSES),...interval(x)});
  });
}
export function parseOrganisationMembership(key:unknown,v:unknown):Result<OrganisationMembership>{
  return safe(()=>{
    const x=shape(v,['organisationMembershipId','organisationId','personId','role','status','isPrimary'],['effectiveStartAt','effectiveEndAt']);
    requireThat(typeof x.isPrimary==='boolean','BOOLEAN');
    return Object.freeze({organisationMembershipId:matching(x.organisationMembershipId,key),organisationId:id(x.organisationId),personId:id(x.personId),role:enumValue(x.role,MEMBERSHIP_ROLES),status:enumValue(x.status,MEMBERSHIP_STATUSES),isPrimary:x.isPrimary,...interval(x)});
  });
}
function unwrap<T>(r:Result<T>):T{if(!r.ok)throw new Rejected(r.code);return r.value;}
type Temporal='current'|'not-current'|'unknown';
type Observation=Readonly<{scope:'synthetic-membership-only';authorizationEvaluated:false;temporal:Temporal}>;
function temporal(m:Interval & {status:string},at:number,knownOpenEnd:boolean):Temporal{
  if(m.status!=='active')return 'not-current';
  if(typeof m.effectiveStartAt==='number'&&at<m.effectiveStartAt)return 'not-current';
  if(typeof m.effectiveEndAt==='number'&&at>=m.effectiveEndAt)return 'not-current';
  if(typeof m.effectiveStartAt!=='number')return 'unknown';
  if(typeof m.effectiveEndAt!=='number'&&!(m.effectiveEndAt===null&&knownOpenEnd))return 'unknown';
  return 'current';
}
// A positive result describes a synthetic relationship interval only, not eligibility
// to access resources, authenticate, or execute commands. No historical as-of claim.
export function observeMembershipFixture(input:unknown):Result<Observation>{
  return safe(()=>{
    const x=shape(input,['kind','documentId','record','at','syntheticOpenEnd']);
    requireThat(typeof x.syntheticOpenEnd==='boolean','BOOLEAN');
    const kind=enumValue(x.kind,['tenant','organisation'] as const);
    const m=kind==='tenant'?unwrap(parseTenantMembership(x.documentId,x.record)):unwrap(parseOrganisationMembership(x.documentId,x.record));
    return Object.freeze({scope:'synthetic-membership-only' as const,authorizationEvaluated:false as const,temporal:temporal(m,instant(x.at),x.syntheticOpenEnd)});
  });
}
function digest(domain:string,parts:readonly string[]):string{return createHash('sha256').update(JSON.stringify([domain,...parts]),'utf8').digest('hex');}
// Candidate new-fact key only. Never use to replace an existing MEM ID.
export function candidateTenantMembershipKey(tenantId:unknown,personId:unknown):Result<string>{
  return safe(()=> 'tmb2_'+digest('TSOS:TMB:2',[id(tenantId),id(personId)]));
}
export function candidateOrganisationMembershipKey(organisationId:unknown,personId:unknown,role:unknown):Result<string>{
  return safe(()=> 'mem2_'+digest('TSOS:MEM:2',[id(organisationId),id(personId),enumValue(role,MEMBERSHIP_ROLES)]));
}
// Checks one supplied set of current-record DTOs; not history, global uniqueness,
// ownership, or a storage transaction. Bound before inspecting each entry.
export function inspectMembershipSet(input:unknown):Result<Readonly<{count:number;authorizationEvaluated:false}>>{
  return safe(()=>{
    const x=shape(input,['kind','rows']);
    const kind=enumValue(x.kind,['tenant','organisation'] as const);
    requireThat(Array.isArray(x.rows),'SHAPE');const rows=x.rows;
    requireThat(rows.length<=100,'BOUND');
    requireThat(Reflect.ownKeys(rows).length===rows.length+1,'SHAPE');
    const ids=new Set<string>(),relations=new Set<string>();
    for(let i=0;i<rows.length;i++){
      const d=Object.getOwnPropertyDescriptor(rows,String(i));requireThat(d&&d.enumerable&&Object.hasOwn(d,'value'),'SHAPE');
      const row=shape(d.value,['documentId','record']);
      let key:string;let recordId:string;
      if(kind==='tenant'){
        const m=unwrap(parseTenantMembership(row.documentId,row.record));recordId=m.tenantMembershipId;key=unwrap(candidateTenantMembershipKey(m.tenantId,m.personId));
      }else{
        const m=unwrap(parseOrganisationMembership(row.documentId,row.record));recordId=m.organisationMembershipId;key=unwrap(candidateOrganisationMembershipKey(m.organisationId,m.personId,m.role));
      }
      requireThat(!ids.has(recordId),'DUPLICATE_ID');requireThat(!relations.has(key),'DUPLICATE_RELATIONSHIP');ids.add(recordId);relations.add(key);
    }
    return Object.freeze({count:rows.length,authorizationEvaluated:false as const});
  });
}
