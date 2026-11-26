// R2.2D offline composition: signed/consumed approval -> one fixed canonical child.
// Not a live operator, OS sandbox, or durable production trust boundary.
import {spawn} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import {readFileSync,mkdtempSync,mkdirSync,rmSync,lstatSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {consumeSyntheticApproval} from './identity-operator-replay.mjs';

const worker=fileURLToPath(new URL('./identity-operator-canonical-worker.mjs',import.meta.url));
const functionsDir=resolve(fileURLToPath(new URL('../../functions/',import.meta.url)));
const pins=Object.freeze({
  'identity-operator-canonical-worker.mjs':'a4a2115b42d5af002310906393c1a1dfec98aabe',
  'identity-operator-approval.mjs':'7f0c7b81fd437a85540225745326741922bef8ae',
  'identity-operator-replay.mjs':'f5d778c39c97fc5f55dee8edfba8e0615f7dee36'
});
const digest=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const report=(code,{started=false,reaped=false,escalated=false,cleanupPending=false,result=null}={})=>
  Object.freeze({scope:'synthetic-only',executableReady:false,status:code===null?'CANONICAL_FIXTURE_COMPLETE':'STOPPED',
    code,started,reaped,escalated,cleanupPending,outcome:code===null?'fixture-complete':started?'unknown':'not-started',
    result:code===null?Object.freeze(result):null});

export async function superviseSyntheticCanonical({directory,ownerKey,reviewerKey,operator,bytes,ownerSignature,reviewerSignature,maxRunMs}={}){
  if(process.version!=='v22.22.1'||!['darwin','linux'].includes(process.platform)||
    !Number.isSafeInteger(maxRunMs)||maxRunMs<1||maxRunMs>30000)return report('SUPERVISOR_CONFIG');
  const startWall=Date.now(),startMono=performance.now();
  // Pin trusted checkout bytes before reserving the approval. This is not
  // executable bundle attestation or protection against same-UID file races.
  try{for(const [name,sha] of Object.entries(pins)){
    const p=join(dirname(worker),name);
    if(!lstatSync(p).isFile()||digest(readFileSync(p))!==sha)throw Error();
  }}catch{return report('SUPERVISOR_SOURCE_DRIFT');}
  let approval;
  try{approval=consumeSyntheticApproval({directory,trust:{ownerKey,reviewerKey,operator,clock:Date.now},bytes,ownerSignature,reviewerSignature});}
  catch(e){return report(['APPROVAL_INVALID','APPROVAL_REPLAY','APPROVAL_JOURNAL_BLOCKED'].includes(e?.message)?e.message:'APPROVAL_INVALID');}
  const end=Math.min(approval.plan.endMs,startWall+maxRunMs);
  let lastWall=startWall;
  function expired(){
    const n=Date.now(),bad=n<lastWall||n>=end||performance.now()-startMono>=maxRunMs;lastWall=n;return bad;
  }
  if(expired())return report('SUPERVISOR_DEADLINE');
  const expected={scope:'synthetic-only',status:'CANONICAL_FIXTURE_COMPLETE',actors:approval.plan.actors.length,
    attempts:approval.plan.maxAttempts,slots:approval.plan.maxSlots,
    returned:approval.plan.actors.reduce((n,a)=>n+(a.role==='schoolAdmin'?7:5),0)};
  let stage;
  function cleanup(){if(!stage)return true;try{rmSync(stage,{recursive:true,force:true});return true;}catch{return false;}}
  try{
    stage=mkdtempSync(join(functionsDir,'.tsos-r2d-'));
    mkdirSync(join(stage,'home'),{mode:0o700});mkdirSync(join(stage,'tmp'),{mode:0o700});
  }catch{return report('SUPERVISOR_STAGE_FAILED',{cleanupPending:!cleanup()});}
  if(expired())return report('SUPERVISOR_DEADLINE',{cleanupPending:!cleanup()});
  const input=Buffer.from(JSON.stringify({approval,deadlineMs:end}));
  if(input.length>32768)return report('SUPERVISOR_INPUT_LIMIT',{cleanupPending:!cleanup()});
  return new Promise(resolveReport=>{
    let child,watch,grace,reap,done=false,started=false,escalated=false,code=null,output=Buffer.alloc(0),received=0;
    function finish(reaped){
      if(done)return;done=true;clearInterval(watch);clearTimeout(grace);clearTimeout(reap);
      if(!reaped&&child){child.stdin?.destroy();child.stdout?.destroy();child.stderr?.destroy();child.unref();}
      // Never remove a stage which an unconfirmed child may still be using.
      const cleanupPending=started&&!reaped?true:!cleanup();
      if(cleanupPending&&!code)code='SUPERVISOR_CLEANUP_PENDING';
      resolveReport(report(code,{started,reaped,escalated,cleanupPending,result:code===null?expected:null}));
    }
    function stop(reason){
      if(done||code)return;code=reason;
      try{child.kill('SIGTERM');}catch{}
      grace=setTimeout(()=>{if(done)return;escalated=true;try{child.kill('SIGKILL');}catch{}
        reap=setTimeout(()=>{if(!done){code='SUPERVISOR_REAP_UNKNOWN';finish(false);}},1000);
      },100);
    }
    try{
      child=spawn(process.execPath,['--unhandled-rejections=strict','--disable-warning=DEP0040',worker],{
        shell:false,cwd:stage,stdio:['pipe','pipe','pipe'],
        env:{PATH:dirname(process.execPath),HOME:join(stage,'home'),TMPDIR:join(stage,'tmp'),TZ:'UTC',TSOS_OFFLINE_LOOPBACK:'1'}
      });
      child.on('spawn',()=>{started=true;if(expired())stop('SUPERVISOR_DEADLINE');});
      child.on('error',()=>{if(!started){code='SUPERVISOR_SPAWN_FAILED';finish(false);}else stop('SUPERVISOR_CHILD_ERROR');});
      child.stdin.on('error',()=>stop('SUPERVISOR_PIPE_ERROR'));
      child.stdout.on('error',()=>stop('SUPERVISOR_PIPE_ERROR'));
      child.stderr.on('error',()=>stop('SUPERVISOR_PIPE_ERROR'));
      child.stdout.on('data',chunk=>{if(done||code)return;received+=chunk.length;
        if(received>1024){stop('SUPERVISOR_OUTPUT_LIMIT');return;}output=Buffer.concat([output,chunk]);});
      child.stderr.on('data',()=>stop('SUPERVISOR_STDERR'));
      child.on('close',(exit,signal)=>{
        if(done)return;
        if(!code){
          if(expired())code='SUPERVISOR_DEADLINE';
          else if(exit!==0||signal)code='SUPERVISOR_WORKLOAD_FAILED';
          else if(!output.equals(Buffer.from(JSON.stringify(expected)+'\n')))code='SUPERVISOR_RESULT_INVALID';
        }
        finish(true);
      });
      watch=setInterval(()=>{if(expired())stop('SUPERVISOR_DEADLINE');},10);
      if(expired())stop('SUPERVISOR_DEADLINE');
      else child.stdin.end(input);
    }catch{
      code='SUPERVISOR_SPAWN_FAILED';
      if(child){try{child.kill('SIGKILL');}catch{}escalated=true;reap=setTimeout(()=>finish(false),1000);}
      else finish(false);
    }
  });
}
