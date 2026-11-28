// Dormant candidate: pure contracts only. Not an authorization decision or a datastore adapter.
import {createHash} from 'node:crypto';
export const ACTION='campus.create';
export const ZONES=Object.freeze(['Asia/Kolkata','UTC']);
const CONTROL=/[\u0000-\u001f\u007f-\u009f]/u;
export function validId(s){return typeof s==='string'&&s.isWellFormed()&&s.length>0&&Buffer.byteLength(s,'utf8')<=128&&s.trim()===s&&!CONTROL.test(s)&&!s.includes('/')&&s!=='.'&&s!=='..'&&!/^__[\s\S]*__$/u.test(s)}
export function validName(s){return typeof s==='string'&&s.isWellFormed()&&s.length>0&&s.trim()===s&&!CONTROL.test(s)&&s.normalize('NFC')===s&&[...s].length<=120&&Buffer.byteLength(s,'utf8')<=480}
export function exactData(value,fields){
  if(value===null||typeof value!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(value)))return null;
  const keys=Reflect.ownKeys(value);if(keys.length!==fields.length||!fields.every(k=>keys.includes(k)))return null;
  const pairs=[];for(const k of fields){const d=Object.getOwnPropertyDescriptor(value,k);if(!d||!d.enumerable||!Object.hasOwn(d,'value'))return null;pairs.push([k,d.value])}
  return Object.freeze(Object.fromEntries(pairs));
}
export function parseCampusRequest(value){
  const p=exactData(value,['tenantId','organisationId','operationId','name','timeZone']);
  if(!p||![p.tenantId,p.organisationId,p.operationId].every(validId)||!validName(p.name)||!ZONES.includes(p.timeZone))return null;
  return p;
}
const specs=Object.freeze({TEN:['tenantId'],OTB:['organisationId'],TMB:['tenantId','personId'],MEM:['tenantId','organisationId','personId','member'],VGR:['tenantId','organisationId','personId',ACTION],AFN:['tenantId'],AOR:['tenantId',ACTION],CAM:['tenantId','organisationId','actorPersonId',ACTION,'operationId'],OCR:['tenantId','actorPersonId',ACTION,'operationId']});
function hash(parts){return createHash('sha256').update(JSON.stringify(parts),'utf8').digest('hex')}
export function recordKey(code,parts){
  if(!Object.hasOwn(specs,code)||!Array.isArray(parts)||parts.length!==specs[code].length)throw Error('KEY_CONTRACT');
  for(let i=0;i<parts.length;i++){const field=specs[code][i];if(field===ACTION||field==='member'){if(parts[i]!==field)throw Error('KEY_LITERAL')}else if(!validId(parts[i]))throw Error('KEY_ID')}
  return parts.length===1?parts[0]:code.toLowerCase()+'_'+hash(['TSOS:B02:GATE-B:KEY:1:'+code,...parts]);
}
// actorPersonId is a trusted canonical principal, never a request field.
export function campusIdentity(request,actorPersonId){
  const p=parseCampusRequest(request);if(!p||!validId(actorPersonId))throw Error('CAMPUS_IDENTITY_CONTRACT');
  const campusId=recordKey('CAM',[p.tenantId,p.organisationId,actorPersonId,ACTION,p.operationId]);
  const receiptKey=recordKey('OCR',[p.tenantId,actorPersonId,ACTION,p.operationId]);
  const semanticHash=hash(['TSOS:B02:GATE-B:SEMANTIC:1:CAM',ACTION,p.tenantId,p.organisationId,campusId,p.name,p.timeZone]);
  return Object.freeze({campusId,receiptKey,semanticHash});
}
