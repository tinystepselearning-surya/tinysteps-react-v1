// R2 readiness only: synthetic two-signature approval verifier.
// No filesystem, network, credentials, live endpoint or operator entry point.
import {KeyObject,verify} from 'node:crypto';
import {createSyntheticRequestLane} from './identity-transport-request-lane.mjs';

export const APPROVAL_DOMAIN='TSOS:R2:SYNTHETIC:SAMPLER:V1\0';
export const SOURCE_PIN='5cf0672178ad389263a7391fc4133c5207ea9688';
export const POLICY_PIN='152ee5aad7ac37b98a59072e71775af952c3c24b';
const database='projects/tsos-synthetic-transport/databases/(default)';
const id=v=>typeof v==='string'&&/^synthetic-[a-z0-9][a-z0-9-]{0,79}$/.test(v);
const int=v=>Number.isSafeInteger(v)&&v>=0;
const exact=(o,keys)=>o!==null&&typeof o==='object'&&Object.getPrototypeOf(o)===Object.prototype&&
  Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const fields=['schema','scope','purpose','database','sourcePin','policyPin','approvalId','operator',
  'issuedAtMs','notBeforeMs','expiresMs','maxAgeMs','maxAttempts','maxSlots','actors'];
const keyOK=k=>k instanceof KeyObject&&k.type==='public'&&k.asymmetricKeyType==='ed25519';
const freeze=o=>{if(o&&typeof o==='object'){for(const v of Object.values(o))freeze(v);Object.freeze(o);}return o;};
// This is a deliberately narrow canonical JSON profile, not RFC 8785.
// Sorted ASCII schema keys, JSON primitives, bounded arrays and objects.
// Byte equality rejects duplicate keys, alternate escapes, whitespace and
// invalid UTF-8. Validate from bytes, never trust caller-owned objects.
function canonical(v,depth=0){
  if(depth>8)throw Error('APPROVAL_INVALID');
  if(v===null||typeof v==='boolean'||typeof v==='string'||int(v))return JSON.stringify(v);
  if(Array.isArray(v))return '['+v.map(x=>canonical(x,depth+1)).join(',')+']';
  if(v&&Object.getPrototypeOf(v)===Object.prototype)return '{'+Object.keys(v).sort()
    .map(k=>JSON.stringify(k)+':'+canonical(v[k],depth+1)).join(',')+'}';
  throw Error('APPROVAL_INVALID');
}
export function createSyntheticApprovalVerifier({ownerKey,reviewerKey,operator,clock}={}){
  if(!keyOK(ownerKey)||!keyOK(reviewerKey)||!id(operator)||typeof clock!=='function'||
    ownerKey.export({format:'der',type:'spki'}).equals(reviewerKey.export({format:'der',type:'spki'})))
    throw Error('APPROVAL_TRUST_CONFIG');
  let attempted=false;
  // One attempt per verifier instance. No retries, persistent replay ledger
  // or assertion that caller-selected fixture keys represent real people.
  return Object.freeze({consume(bytes,ownerSignature,reviewerSignature){
    if(attempted)throw Error('APPROVAL_ALREADY_ATTEMPTED');
    attempted=true;
    try{
      if(!Buffer.isBuffer(bytes)||bytes.length<1||bytes.length>32768||
        !Buffer.isBuffer(ownerSignature)||ownerSignature.length!==64||
        !Buffer.isBuffer(reviewerSignature)||reviewerSignature.length!==64)throw Error();
      const payload=Buffer.from(bytes),os=Buffer.from(ownerSignature),rs=Buffer.from(reviewerSignature);
      const manifest=JSON.parse(payload.toString('utf8'));
      if(!exact(manifest,fields)||!Buffer.from(canonical(manifest),'utf8').equals(payload))throw Error();
      const message=Buffer.concat([Buffer.from(APPROVAL_DOMAIN),payload]);
      if(!verify(null,message,ownerKey,os)||!verify(null,message,reviewerKey,rs))throw Error();
      const m=manifest,n=clock();
      if(m.schema!=='tsos-r2-synthetic-approval-v1'||m.scope!=='synthetic-only'||
        m.purpose!=='canonical-principal-sampler'||m.database!==database||
        m.sourcePin!==SOURCE_PIN||m.policyPin!==POLICY_PIN||!id(m.approvalId)||m.operator!==operator||
        ![n,m.issuedAtMs,m.notBeforeMs,m.expiresMs,m.maxAgeMs].every(int)||
        m.issuedAtMs>m.notBeforeMs||m.notBeforeMs-m.issuedAtMs>300000||
        m.notBeforeMs>n||n>=m.expiresMs||m.expiresMs-m.notBeforeMs>300000||
        m.maxAgeMs<1||m.maxAgeMs>300000)throw Error();
      const plan={scope:'synthetic-only',actors:m.actors,startMs:m.notBeforeMs,endMs:m.expiresMs,
        maxAttempts:m.maxAttempts,maxSlots:m.maxSlots};
      // Reuse the existing exact actor schema, cohort and reservation bounds.
      // The original canonical integration separately checks derived auth IDs.
      createSyntheticRequestLane(plan,clock);
      // Private fixture plan only, never serialize to a public evidence report.
      // A later supervisor must recheck time during dispatch; no clock/plan
      // conversion, live approval, durable replay protection or execution here.
      return freeze({scope:'synthetic-only',executableReady:false,plan,maxAgeMs:m.maxAgeMs});
    }catch{throw Error('APPROVAL_INVALID');}
  }});
}
