// Synthetic orchestration only. open is the test-owned loopback RPC factory.
// Never use with a production client; no public operator or credentials here.
import {createSyntheticRequestLane} from './identity-transport-request-lane.mjs';
import {createResponseCollector} from './identity-transport-response.mjs';
export async function exerciseSyntheticTransport(plan,{clock,open,signal,canonical}){
  if(typeof open!=='function')throw Error('TEST_TRANSPORT_REQUIRED');
  if(signal!==undefined&&!(signal instanceof AbortSignal))throw Error('SIGNAL_INVALID');
  const lane=createSyntheticRequestLane(plan,clock),active=new Set();
  const actors=plan.actors.map(a=>Object.freeze({...a}));
  if(canonical!==undefined&&(!canonical||typeof canonical.sampler!=='function'||typeof canonical.buildAuthIdentityId!=='function'||typeof canonical.nowMs!=='function'||!Number.isSafeInteger(canonical.maxAgeMs)||canonical.maxAgeMs<=0))throw Error('CANONICAL_TEST_CONFIG');
  let canonicalCompleted=0;
  let blocker=null,dispatched=0,cancelRequested=0,cancelled=0,returned=0,drainExpired=0;
  function stop(code){
    if(blocker)return;
    blocker=code;lane.abort();
    for(const h of active)h.cancel();
  }
  function dispatch(i,col){
    if(blocker)return Promise.resolve();
    let ticket;
    try{ticket=lane.reserve(i,col);}catch{stop('RESERVATION_DENIED');return Promise.resolve();}
    return new Promise(resolve=>{
      const collect=createResponseCollector(ticket,{retain:canonical!==undefined});
      let stream,deadline,drain,done=false,requested=false;
      function terminal(outcome,summary=null,reason='LANE_REJECTED'){
        if(done)return;done=true;clearTimeout(deadline);clearTimeout(drain);active.delete(h);
        lane.settle(ticket,outcome,summary?.readTime);
        if(!blocker&&lane.report().code)stop(reason);
        if(!blocker&&summary)returned+=summary.rows;
        resolve(!blocker&&summary?summary:undefined);
      }
      const h={cancel(){
        if(done||requested)return;requested=true;cancelRequested++;
        drain=setTimeout(()=>{drainExpired++;terminal('unknown',null,'DRAIN_TIMEOUT');try{stream?.destroy();}catch{}},2000);
        try{stream?.cancel();}catch{/* unknown until drain expires */}
      }};
      active.add(h);
      try{
        dispatched++;stream=open(ticket);
        stream.on('error',e=>{
          if(done)return;
          if(requested&&e?.code===1)cancelled++;
          terminal('unknown',null,'RPC_ERROR');
        });
        stream.on('data',frame=>{
          if(done||blocker)return;
          try{collect.accept(frame);}catch{stop('RESPONSE_INVALID');}
        });
        stream.on('end',()=>{
          if(done)return;
          if(blocker){terminal('unknown');return;}
          let summary;try{summary=collect.finish();}catch{stop('RESPONSE_INVALID');terminal('unknown');return;}
          terminal('completed',summary);
        });
        stream.on('close',()=>{if(!done){terminal('unknown',null,'RPC_CLOSED');}});
        if(!done&&!requested)deadline=setTimeout(()=>stop('RPC_TIMEOUT'),ticket.timeoutMs);
        // An injected factory may synchronously abort while opening. If so,
        // cancellation was requested before the handle existed; forward now.
        if(!done&&requested){try{stream.cancel();}catch{}}
      }catch{terminal('unknown',null,'RPC_OPEN_FAILED');}
    });
  }
  async function sample(i){
    const a=actors[i],pending=[],seen=new Set();
    let age=null,closed=false,localReturned=0,previousWall=-1;
    function wall(){
      const n=canonical.nowMs();
      if(!Number.isSafeInteger(n)||n<previousWall||n<0)throw Error('FRESHNESS_CLOCK');
      previousWall=n;
      if(age!==null&&(n<age||n-age>canonical.maxAgeMs))throw Error('PROJECTION_FRESHNESS');
      return n;
    }
    function requireSameList(actual,expected){
      return Array.isArray(actual)&&actual.length===expected.length&&actual.every((v,j)=>v===expected[j]);
    }
    async function read(col,kind,key,op,val,limit){
      try{
        if(closed||blocker)throw Error('ACTOR_CLOSED');
        wall();
        const query=['roleAssignments','organisationMemberships'].includes(col);
        const point=['authAccessReadModels','authIdentities','people','users','schoolUsers'].includes(col);
        const expected=col==='authIdentities'?a.authIdentityId:col==='people'?a.personId:a.uid;
        if(seen.has(col)||!(kind==='point'&&point&&key===expected||
          kind==='query'&&query&&key==='personId'&&op==='=='&&val===a.personId&&limit===51))
          throw Error('DESCRIPTOR_DENIED');
        seen.add(col);
        const summary=await dispatch(i,col);
        if(!summary||blocker)throw Error('TRANSPORT_STOPPED');
        wall();
        localReturned+=summary.rows;
        if(query)return Object.freeze({size:summary.rows,docs:Object.freeze(summary.decoded.map(x=>Object.freeze({data:()=>x})))});
        let data=summary.decoded[0];
        if(col==='authAccessReadModels'){
          if(!data||data.firebaseUid!==a.uid||data.personId!==a.personId||data.sourceAuthIdentityId!==a.authIdentityId||
            data.accessActive!==true||data.personStatus!=='active'||data.authStatus!=='active'||
            !requireSameList(data.globalRoles,a.role==='schoolAdmin'?[]:[a.role])||
            !requireSameList(data.schoolAdminOrganisationIds,a.role==='schoolAdmin'?[a.organisationId]:[]))
            throw Error('PROJECTION_SCOPE');
          const ts=data.updatedAt;
          if(!ts)throw Error('PROJECTION_FRESHNESS');
          age=Number(ts.seconds)*1000+ts.nanos/1e6;wall();
          data=Object.freeze({...data,updatedAt:Object.freeze({toMillis:()=>age})});
        }
        if(col==='authIdentities'&&(!data||data.personId!==a.personId||data.providerSubject!==a.uid))throw Error('SOURCE_SCOPE');
        return Object.freeze({exists:!summary.missing,data:()=>data});
      }catch{stop('SAMPLER_READ_REJECTED');throw Error('SYNTHETIC_READ_STOPPED');}
    }
    function track(...args){
      const p=read(...args);pending.push(p);p.catch(()=>{});return p;
    }
    const db=Object.freeze({collection(col){return Object.freeze({
      doc(key){return Object.freeze({get:()=>track(col,'point',key)});},
      where(key,op,val){return Object.freeze({limit(n){return Object.freeze({get:()=>track(col,'query',key,op,val,n)});}});}
    });}});
    try{
      const report=await canonical.sampler({db,actors:[{uid:a.uid,role:a.role,organisationId:a.organisationId,legacySchoolId:a.legacySchoolId}],
        nowMs:wall(),maxAgeMs:canonical.maxAgeMs});
      wall();
      const x=report?.results?.[0];
      if(blocker||report?.results?.length!==1||report.evidenceKind!=='operator_sample_not_browser_authorization'||
        report.milestoneComplete!==false||report.measuredProductionBilledReads!==null||
        x?.actor!==1||x.role!==a.role||x.status!=='SAMPLED_FIELDS_MATCH'||!Array.isArray(x.issues)||x.issues.length||
        x.projectionAge!=='within_review_threshold'||age===null||seen.size!==7||x.sdkGetAttempts!==7||
        x.sdkGetCompleted!==7||x.documentsReturned!==localReturned||lane.report().completedActors!==i+1){
        stop('CANONICAL_REVIEW_REQUIRED');
      }else canonicalCompleted++;
    }catch{stop('CANONICAL_REVIEW_REQUIRED');}
    finally{closed=true;await Promise.allSettled(pending);}
  }
  const onAbort=()=>stop('OPERATOR_ABORT');
  if(signal?.aborted)onAbort();
  else signal?.addEventListener('abort',onAbort,{once:true});
  const planned=lane.report().plannedActors;
  try{
  if(canonical){
    try{if(actors.some(a=>canonical.buildAuthIdentityId('firebase',a.uid)!==a.authIdentityId))stop('CANONICAL_ID_MISMATCH');}
    catch{stop('CANONICAL_ID_MISMATCH');}
  }
  for(let i=0;i<planned&&!blocker;i++){
    if(canonical){await sample(i);continue;}
    for(const col of ['authAccessReadModels','authIdentities','people']){
      if(blocker)break;await dispatch(i,col);
    }
    if(blocker)break;
    await Promise.all([dispatch(i,'roleAssignments'),dispatch(i,'organisationMemberships')]);
    if(blocker)break;
    for(const col of ['users','schoolUsers']){
      if(blocker)break;await dispatch(i,col);
    }
  }
  }finally{signal?.removeEventListener('abort',onAbort);}
  const counts=lane.report();
  return Object.freeze({scope:'synthetic-only',executableReady:false,
    status:!blocker&&counts.status==='DESCRIPTORS_COMPLETE'?'SYNTHETIC_TRANSPORT_COMPLETE':'STOPPED',
    code:blocker,dispatched,cancelRequested,cancelled,drainExpired,...(canonical?{canonicalCompleted}:{}),returned:!blocker?returned:0,counts});
}
