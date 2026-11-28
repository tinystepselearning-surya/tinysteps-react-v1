// Dormant candidate; actual Admin SDK Timestamp, never a serialized lookalike.
// No app initialization, credentials, Firestore client or database calls.
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../../functions/package.json',import.meta.url));
const {Timestamp}=require('firebase-admin/firestore');
export function timestampParts(value){
  if(!(value instanceof Timestamp)||Object.getPrototypeOf(value)!==Timestamp.prototype)throw Error('INVALID_TIMESTAMP_TYPE');
  const seconds=value.seconds,nanoseconds=value.nanoseconds;
  if(!Number.isSafeInteger(seconds)||seconds< -62135596800||seconds>253402300799||!Number.isInteger(nanoseconds)||nanoseconds<0||nanoseconds>999999999)throw Error('INVALID_TIMESTAMP_RANGE');
  return Object.freeze({seconds,nanoseconds});
}
export function compareTimestamps(a,b){
  const x=timestampParts(a),y=timestampParts(b);
  return x.seconds<y.seconds?-1:x.seconds>y.seconds?1:x.nanoseconds<y.nanoseconds?-1:x.nanoseconds>y.nanoseconds?1:0;
}
export function intervalContains(start,end,at){
  timestampParts(start);timestampParts(at);
  if(end!==null&&compareTimestamps(start,end)>=0)throw Error('INVALID_INTERVAL');
  return compareTimestamps(start,at)<=0&&(end===null||compareTimestamps(at,end)<0);
}
// The trusted server integration supplies its own time observations.
// This helper does not certify wall-clock accuracy or commit-time validity.
export function verifyDecisionTimes({first,second,elapsedNs,dispatchLimitNs,intervals}){
  if(typeof elapsedNs!=='bigint'||typeof dispatchLimitNs!=='bigint'||elapsedNs<0n||dispatchLimitNs<=0n||elapsedNs>=dispatchLimitNs||compareTimestamps(first,second)>0)return false;
  if(!Array.isArray(intervals)||intervals.length!==3)return false;
  return intervals.every(({start,end})=>intervalContains(start,end,first)&&intervalContains(start,end,second));
}
