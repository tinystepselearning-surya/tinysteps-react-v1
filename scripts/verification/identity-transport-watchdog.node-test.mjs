// Pure watchdog fault tests, no SDK or network. Real timers exercise bounded drain.
import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {exerciseSyntheticTransport} from './identity-transport-orchestration.mjs';
const actor={uid:'synthetic-uid',personId:'synthetic-person',authIdentityId:'auth_'+'a'.repeat(32),
  role:'teacher',organisationId:null,legacySchoolId:null};
const plan={scope:'synthetic-only',actors:[actor],startMs:100,endMs:300100,maxAttempts:7,maxSlots:107};
const time={seconds:'1700000000',nanos:123000000};
const frame={result:'found',found:{name:'projects/tsos-synthetic-transport/databases/(default)/documents/authAccessReadModels/synthetic-uid',
  fields:{firebaseUid:{valueType:'stringValue',stringValue:'synthetic-uid'}}},readTime:time};
class FakeStream extends EventEmitter {
  cancels=0;destroyed=0;
  cancel(){this.cancels++;}
  destroy(){this.destroyed++;}
}
const clock=()=>100;
test('watchdog: cancel ignored, drain bounded, late events discarded',{timeout:6000},async()=>{
  const stream=new FakeStream(),c=new AbortController();
  const start=performance.now();
  const result=await exerciseSyntheticTransport(plan,{clock,signal:c.signal,open:()=>{
    setImmediate(()=>c.abort());return stream;
  }});
  assert.equal(result.status,'STOPPED');assert.equal(result.code,'OPERATOR_ABORT');
  assert.equal(result.dispatched,1);assert.equal(result.cancelRequested,1);assert.equal(result.cancelled,0);
  assert.equal(result.drainExpired,1);assert.equal(result.counts.unknown,1);
  assert.equal(result.counts.inFlight,0);assert.equal(result.counts.reservedSlots,1);
  assert.equal(result.returned,0);assert.equal(stream.cancels,1);assert.equal(stream.destroyed,1);
  assert.ok(performance.now()-start>=1900&&performance.now()-start<5500);
  const before=JSON.stringify(result);
  stream.emit('data',frame);stream.emit('end');stream.emit('error',Error('synthetic late'));
  assert.equal(JSON.stringify(result),before);
});
test('watchdog: synchronous abort while opening forwards cancellation',async()=>{
  const c=new AbortController(),stream=new FakeStream();
  stream.cancel=function(){this.cancels++;queueMicrotask(()=>this.emit('error',{code:1}));};
  const result=await exerciseSyntheticTransport(plan,{clock,signal:c.signal,open:()=>{c.abort();return stream;}});
  assert.equal(result.code,'OPERATOR_ABORT');assert.equal(result.dispatched,1);
  assert.equal(result.cancelRequested,1);assert.equal(result.cancelled,1);assert.equal(stream.cancels,1);
  assert.equal(result.drainExpired,0);assert.equal(result.counts.unknown,1);assert.equal(result.counts.inFlight,0);
});
test('watchdog: actual timer expires even if injected clock stalls',{timeout:5000},async()=>{
  const stream=new FakeStream();stream.cancel=function(){this.cancels++;queueMicrotask(()=>this.emit('error',{code:1}));};
  const result=await exerciseSyntheticTransport({...plan,endMs:150},{clock,open:()=>stream});
  assert.equal(result.code,'RPC_TIMEOUT');assert.equal(result.dispatched,1);assert.equal(result.cancelled,1);
  assert.equal(result.counts.reservedSlots,1);assert.equal(result.drainExpired,0);
});
test('watchdog: open throw is redacted and reserved',async()=>{
  const result=await exerciseSyntheticTransport(plan,{clock,open:()=>{throw Error('synthetic private error');}});
  assert.equal(result.code,'RPC_OPEN_FAILED');assert.equal(result.dispatched,1);
  assert.equal(result.counts.unknown,1);assert.equal(result.counts.reservedSlots,1);
  assert.ok(!JSON.stringify(result).includes('synthetic private error'));
});
test('watchdog: premature close never becomes completion',async()=>{
  const stream=new FakeStream();
  const result=await exerciseSyntheticTransport(plan,{clock,open:()=>{
    queueMicrotask(()=>{stream.emit('data',frame);stream.emit('close');});return stream;
  }});
  assert.equal(result.code,'RPC_CLOSED');assert.equal(result.returned,0);
  assert.equal(result.counts.unknown,1);assert.equal(result.counts.completedActors,0);
});
