// R2.2B: fixed synthetic child only. No SDK, shell, arbitrary command or live adapter.
import {spawn} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import {consumeSyntheticApproval} from './identity-operator-replay.mjs';

const OK='{"scope":"synthetic-only","status":"FIXTURE_COMPLETE"}\n';
const scenarios=new Set(['ok','hang','ignore-term','overflow','stderr','bad-result','exit-fail']);
// Child receives no approval bytes, keys, actor plan, environment credentials
// or file paths. It never creates subprocesses or opens a network connection.
const CHILD=`
const mode=process.argv[1];
if(mode==='ok')process.stdout.write(${JSON.stringify(OK)});
else if(mode==='hang')setInterval(()=>{},1000);
else if(mode==='ignore-term'){process.on('SIGTERM',()=>{});setInterval(()=>{},1000);}
else if(mode==='overflow'){process.stdout.write('x'.repeat(4096));setInterval(()=>{},1000);}
else if(mode==='stderr'){process.stderr.write('fixture-only');setInterval(()=>{},1000);}
else if(mode==='bad-result')process.stdout.write('unexpected');
else if(mode==='exit-fail')process.exitCode=2;
else process.exitCode=3;
`;
const report=(code,started=false,reaped=false,escalated=false)=>Object.freeze({scope:'synthetic-only',executableReady:false,
  status:code===null?'FIXTURE_COMPLETE':'STOPPED',code,started,reaped,escalated,
  outcome:code===null?'fixture-complete':started?'unknown':'not-started'});
export async function superviseSyntheticFixture({directory,ownerKey,reviewerKey,operator,bytes,ownerSignature,reviewerSignature,scenario,maxRunMs}={}){
  if(!scenarios.has(scenario)||!Number.isSafeInteger(maxRunMs)||maxRunMs<1||maxRunMs>5000||process.platform==='win32')return report('SUPERVISOR_CONFIG');
  const startedWall=Date.now(),startedMono=performance.now();
  let approval;
  try{approval=consumeSyntheticApproval({directory,trust:{ownerKey,reviewerKey,operator,clock:Date.now},bytes,ownerSignature,reviewerSignature});}
  catch(e){return report(['APPROVAL_INVALID','APPROVAL_REPLAY','APPROVAL_JOURNAL_BLOCKED'].includes(e?.message)?e.message:'APPROVAL_INVALID');}
  const end=Math.min(approval.plan.endMs,startedWall+maxRunMs);
  let lastWall=startedWall;
  function expired(){const wall=Date.now();const bad=wall<lastWall||wall>=end||performance.now()-startedMono>=maxRunMs;lastWall=wall;return bad;}
  if(expired())return report('SUPERVISOR_DEADLINE');
  return new Promise(resolve=>{
    let child,watch,grace,reap,done=false,started=false,escalated=false,code=null,output=Buffer.alloc(0),received=0;
    function finish(reaped){if(done)return;done=true;clearInterval(watch);clearTimeout(grace);clearTimeout(reap);
      if(!reaped&&child){child.stdout?.destroy();child.stderr?.destroy();child.unref();}
      resolve(report(code,started,reaped,escalated));}
    function stop(reason){if(done||code)return;code=reason;
      try{child.kill('SIGTERM');}catch{}
      grace=setTimeout(()=>{if(done)return;escalated=true;try{child.kill('SIGKILL');}catch{}
        reap=setTimeout(()=>{if(!done){code='SUPERVISOR_REAP_UNKNOWN';finish(false);}},1000);
      },100);
    }
    try{
      child=spawn(process.execPath,['--input-type=module','-e',CHILD,scenario],{shell:false,stdio:['ignore','pipe','pipe'],env:{TZ:'UTC'},cwd:directory});
      child.on('spawn',()=>{started=true;if(expired())stop('SUPERVISOR_DEADLINE');});
      child.on('error',()=>{if(!started){code='SUPERVISOR_SPAWN_FAILED';finish(false);}else stop('SUPERVISOR_CHILD_ERROR');});
      child.stdout.on('data',chunk=>{if(done||code)return;received+=chunk.length;
        if(received>1024){stop('SUPERVISOR_OUTPUT_LIMIT');return;}output=Buffer.concat([output,chunk]);});
      child.stderr.on('data',()=>stop('SUPERVISOR_STDERR'));
      child.stdout.on('error',()=>stop('SUPERVISOR_PIPE_ERROR'));
      child.stderr.on('error',()=>stop('SUPERVISOR_PIPE_ERROR'));
      child.on('close',(exit,signal)=>{if(done)return;
        if(!code){if(expired())code='SUPERVISOR_DEADLINE';else if(exit!==0||signal)code='SUPERVISOR_CHILD_FAILED';
          else if(!output.equals(Buffer.from(OK)))code='SUPERVISOR_RESULT_INVALID';}
        finish(true);
      });
      watch=setInterval(()=>{if(expired())stop('SUPERVISOR_DEADLINE');},10);
      if(expired())stop('SUPERVISOR_DEADLINE');
    }catch{code='SUPERVISOR_SPAWN_FAILED';if(child){try{child.kill('SIGKILL');}catch{}escalated=true;
      reap=setTimeout(()=>finish(false),1000);}else finish(false);}
  });
}
