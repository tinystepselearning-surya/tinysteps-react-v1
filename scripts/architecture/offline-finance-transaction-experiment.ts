// Single-process, single-charge synthetic transaction experiment. Never a financial writer.
import {types} from 'node:util';
import {reviewExtendedCapability,fixtureCommandFingerprint} from './extended-capability-review.ts';
import {reviewRow,isReviewId,isReviewInteger,REVIEW_MIN_TIME,REVIEW_MAX_TIME} from './offline-review-validation.ts';
type Row=Record<string,unknown>;
type Reason='INVALID'|'DENIED'|'STALE'|'REPLAY'|'BOUND';
type Receipt=Readonly<{kind:'simulated-commit';productionAuthorization:false;productionMutation:false;fixtureCommitCount:1;fixtureTargetRevision:number}>;
type Denial=Readonly<{kind:'denied';reason:Reason;productionAuthorization:false;productionMutation:false}>;
type Ticket=Readonly<{kind:'synthetic-ticket'}>;
type Prepared=Readonly<{kind:'prepared';ticket:Ticket;productionAuthorization:false;productionMutation:false}>|Denial;
type CommitResult=Receipt|Denial;
type Pending=Readonly<{request:unknown;generation:number;fingerprint:string}>;
function deny(reason:Reason):Denial{return Object.freeze({kind:'denied',reason,productionAuthorization:false,productionMutation:false});}
// Bounded copy of ordinary fixture data; no getters, proxies, cycles or object aliases.
// This is not a process sandbox or a cryptographic evidence provider.
function copyFixture(value:unknown):unknown{
  let nodes=0,chars=0;
  const seen=new WeakSet<object>();
  function visit(v:unknown,depth:number):unknown{
    if(++nodes>512||depth>12)throw Error('fixture bound');
    if(v===null||typeof v==='boolean')return v;
    if(typeof v==='string'){chars+=v.length;if(v.length>512||chars>32768)throw Error('fixture string bound');return v;}
    if(typeof v==='number'&&Number.isSafeInteger(v))return v;
    if(typeof v!=='object'||types.isProxy(v)||seen.has(v))throw Error('invalid fixture');
    seen.add(v);
    const proto=Object.getPrototypeOf(v);if(proto!==null&&proto!==Object.prototype)throw Error('invalid fixture prototype');
    const keys=Reflect.ownKeys(v);if(keys.length>32)throw Error('fixture field bound');
    const result:Row=Object.create(null);
    for(const k of keys){
      if(!isReviewId(k)||k.length>64)throw Error('invalid fixture key');
      const d=Object.getOwnPropertyDescriptor(v,k);
      if(!d||!d.enumerable||!Object.hasOwn(d,'value'))throw Error('invalid fixture descriptor');
      result[k]=visit(d.value,depth+1);
    }
    return Object.freeze(result);
  }
  return visit(value,0);
}
type State=Readonly<{generation:number;at:number;targetRevision:number;closed:boolean;receipt:Receipt|null}>;
type Experiment=Readonly<{
  prepare:(request:unknown)=>Prepared;
  commit:(ticket:unknown)=>CommitResult;
  invalidate:(event:unknown)=>boolean;
  advanceClock:(at:unknown)=>boolean;
  inspect:()=>Readonly<{fixtureCommitCount:0|1;fixtureTargetRevision:number;closed:boolean}>;
}>;
// Only the fixture operator seeds this experiment. Each instance contains exactly
// one finance charge, one actor and one private evidence snapshot. No replacement
// evidence, refresh or reopening API exists. Untrusted callers supply only requests
// and opaque one-use ticket references; invalidate/advanceClock are harness controls.
export function createFinanceTransactionExperiment(seed:unknown):Experiment|null{
  try{
    const s=reviewRow(copyFixture(seed),['evidence','route','fence']);if(!s)return null;
    const e=reviewRow(s.evidence,['observedAt','principal','institutional','tenantMembership','organisationMembership','grant','target','approval','domain']);
    const f=reviewRow(s.fence,['personId','at','revision','operation','epoch']);
    const t=e&&reviewRow(e.target,['targetId','scope','kind','state','targetRevision','revision']);
    if(!e||!f||!t||f.operation!=='fixture.financePost'||t.kind!=='charge'||t.state!=='present'||!isReviewId(f.personId)||!isReviewInteger(f.at,REVIEW_MIN_TIME,REVIEW_MAX_TIME)||!isReviewInteger(f.revision,1)||!isReviewInteger(f.epoch,1)||!isReviewInteger(t.targetRevision,1,Number.MAX_SAFE_INTEGER-1))return null;
    let state:State=Object.freeze({generation:1,at:f.at,targetRevision:t.targetRevision,closed:false,receipt:null});
    const pending=new Map<Ticket,Pending>();
    let issued=0;
    const inspect=()=>Object.freeze({fixtureCommitCount:(state.receipt?1:0) as 0|1,fixtureTargetRevision:state.targetRevision,closed:state.closed});
    function prepare(request:unknown):Prepared{
      try{
        if(state.closed)return deny('STALE');
        if(state.receipt)return deny('REPLAY');
        if(issued>=32)return deny('BOUND');
        const copy=copyFixture(request),q=reviewRow(copy,['action','scope','targetId','operationId','expectedTargetRevision','payload']);
        if(!q||q.action!=='finance.post'||q.expectedTargetRevision!==state.targetRevision)return deny('INVALID');
        const decision=reviewExtendedCapability(copy,s.evidence,s.route,s.fence);
        const fingerprint=fixtureCommandFingerprint(copy,s.fence);
        if(decision.result!=='synthetic-v2-match'||!fingerprint)return deny('DENIED');
        const ticket:Ticket=Object.freeze({kind:'synthetic-ticket'});
        pending.set(ticket,Object.freeze({request:copy,generation:state.generation,fingerprint}));issued++;
        return Object.freeze({kind:'prepared',ticket,productionAuthorization:false,productionMutation:false});
      }catch{return deny('INVALID');}
    }
    function commit(ticket:unknown):CommitResult{
      if(typeof ticket!=='object'||ticket===null)return deny('INVALID');
      const item=pending.get(ticket as Ticket);
      if(!item)return deny('REPLAY');
      pending.delete(ticket as Ticket);
      if(state.closed||item.generation!==state.generation)return deny('STALE');
      if(state.receipt)return deny('REPLAY');
      // Synchronous re-evaluation from the private current fixture snapshot.
      // There is no await, callback, external write or supplied allow observation.
      const q=reviewRow(item.request,['action','scope','targetId','operationId','expectedTargetRevision','payload']);
      if(!q||q.expectedTargetRevision!==state.targetRevision||state.at!==f.at||fixtureCommandFingerprint(item.request,s.fence)!==item.fingerprint||reviewExtendedCapability(item.request,s.evidence,s.route,s.fence).result!=='synthetic-v2-match')return deny('DENIED');
      const receipt:Receipt=Object.freeze({kind:'simulated-commit',productionAuthorization:false,productionMutation:false,fixtureCommitCount:1,fixtureTargetRevision:state.targetRevision+1});
      // One local state replacement models receipt + revision together. No actual
      // ledger posting or database atomicity, crash recovery or distributed CAS.
      state=Object.freeze({...state,generation:state.generation+1,targetRevision:receipt.fixtureTargetRevision,receipt});
      return receipt;
    }
    function invalidate(event:unknown):boolean{
      if(state.closed||!['revoke','target-changed','route-changed','evidence-unavailable'].includes(event as string))return false;
      if(event==='target-changed'&&state.targetRevision===Number.MAX_SAFE_INTEGER)return false;
      state=Object.freeze({...state,generation:state.generation+1,closed:true,targetRevision:state.targetRevision+(event==='target-changed'?1:0)});
      pending.clear();return true;
    }
    function advanceClock(at:unknown):boolean{
      if(state.closed||!isReviewInteger(at,REVIEW_MIN_TIME,REVIEW_MAX_TIME)||at<=state.at)return false;
      // Same-tick policy: any advance closes this fixed snapshot, even before expiry.
      state=Object.freeze({...state,generation:state.generation+1,at,closed:true});pending.clear();return true;
    }
    return Object.freeze({prepare,commit,invalidate,advanceClock,inspect});
  }catch{return null;}
}
