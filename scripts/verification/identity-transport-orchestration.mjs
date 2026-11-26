// Synthetic orchestration only. open is the test-owned loopback RPC factory.
// Never use with a production client; no public operator or credentials here.
import {createSyntheticRequestLane} from './identity-transport-request-lane.mjs';
import {createResponseCollector} from './identity-transport-response.mjs';
export async function exerciseSyntheticTransport(plan,{clock,open}){
  if(typeof open!=='function')throw Error('TEST_TRANSPORT_REQUIRED');
  const lane=createSyntheticRequestLane(plan,clock),active=new Set();
  let blocker=null,dispatched=0,cancelRequested=0,cancelled=0,returned=0;
  function stop(code){
    if(blocker)return;
    blocker=code;lane.abort();
    for(const h of active)h.cancel();
  }
  function dispatch(i,col){
    let ticket;
    try{ticket=lane.reserve(i,col);}catch{stop('RESERVATION_DENIED');return Promise.resolve();}
    return new Promise(resolve=>{
      const collect=createResponseCollector(ticket);
      let stream,deadline,drain,done=false,requested=false;
      function terminal(outcome,summary=null){
        if(done)return;done=true;clearTimeout(deadline);clearTimeout(drain);active.delete(h);
        lane.settle(ticket,outcome,summary?.readTime);
        if(!blocker&&lane.report().code)stop('LANE_REJECTED');
        if(!blocker&&summary)returned+=summary.rows;
        resolve();
      }
      const h={cancel(){
        if(done||requested)return;requested=true;cancelRequested++;
        drain=setTimeout(()=>{terminal('unknown');try{stream?.destroy();}catch{}},2000);
        try{stream?.cancel();}catch{/* unknown until drain expires */}
      }};
      active.add(h);
      try{
        dispatched++;stream=open(ticket);
        stream.on('error',e=>{
          if(done)return;
          if(requested&&e?.code===1)cancelled++;
          terminal('unknown');
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
        stream.on('close',()=>{if(!done){terminal('unknown');}});
        deadline=setTimeout(()=>stop('RPC_TIMEOUT'),ticket.timeoutMs);
      }catch{terminal('unknown');}
    });
  }
  for(let i=0;i<plan.actors.length&&!blocker;i++){
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
  const counts=lane.report();
  return Object.freeze({scope:'synthetic-only',executableReady:false,
    status:!blocker&&counts.status==='DESCRIPTORS_COMPLETE'?'SYNTHETIC_TRANSPORT_COMPLETE':'STOPPED',
    code:blocker,dispatched,cancelRequested,cancelled,returned:!blocker?returned:0,counts});
}
