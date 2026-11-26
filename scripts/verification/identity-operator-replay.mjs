// R2.2C synthetic-only local journal; not a production authorization store.
import {createHash} from 'node:crypto';
import {constants,openSync,closeSync,fsyncSync,lstatSync,fstatSync,realpathSync} from 'node:fs';
import {basename,join,isAbsolute} from 'node:path';
import {createSyntheticApprovalVerifier} from './identity-operator-approval.mjs';

// Trusted, pre-created private local fixture directory. Never reset or prune
// during its test lifetime. Same-UID adversaries, rollback and remote filesystems
// are out of scope. Empty markers contain no manifest, credentials or actor data.
export function consumeSyntheticApproval({directory,trust,bytes,ownerSignature,reviewerSignature}={}){
  let payload,approved,id,last=-1;
  const clock=()=>{const n=trust.clock();if(!Number.isSafeInteger(n)||n<last||n<0)throw Error();last=n;return n;};
  try{
    if(!Buffer.isBuffer(bytes)||bytes.length>32768)throw Error();
    payload=Buffer.from(bytes);
    approved=createSyntheticApprovalVerifier({...trust,clock}).consume(payload,ownerSignature,reviewerSignature);
    id=JSON.parse(payload.toString('utf8')).approvalId;
  }catch{throw Error('APPROVAL_INVALID');}
  let dirFd,fileFd;
  try{
    if(typeof directory!=='string'||!isAbsolute(directory)||realpathSync(directory)!==directory||
      !/^tsos-synthetic-replay-[A-Za-z0-9]+$/.test(basename(directory))||typeof process.getuid!=='function')throw Error();
    const check=s=>s.isDirectory()&&s.uid===process.getuid()&&(s.mode&0o7777)===0o700;
    const before=lstatSync(directory);if(!check(before))throw Error();
    dirFd=openSync(directory,constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);
    const after=fstatSync(dirFd);if(!check(after)||before.dev!==after.dev||before.ino!==after.ino)throw Error();
    // Approval identity, not payload digest: changed validly re-signed plans
    // with the same approval ID cannot be consumed a second time.
    const name=createHash('sha256').update('TSOS:SYNTHETIC:REPLAY:V1\0').update(id).digest('hex');
    try{fileFd=openSync(join(directory,name),constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);}
    catch(e){if(e?.code==='EEXIST')throw Error('APPROVAL_REPLAY');throw Error();}
    fsyncSync(fileFd);closeSync(fileFd);fileFd=undefined;
    fsyncSync(dirFd);closeSync(dirFd);dirFd=undefined;
    // A successful durable reservation is never refunded, including expiry
    // or failure after creation. No child may start before this return.
    const n=clock();
    if(n<approved.plan.startMs||n>=approved.plan.endMs)throw Error();
    return approved;
  }catch(e){throw Error(e?.message==='APPROVAL_REPLAY'?'APPROVAL_REPLAY':'APPROVAL_JOURNAL_BLOCKED');}
  finally{for(const fd of [fileFd,dirFd])if(fd!==undefined)try{closeSync(fd);}catch{}}
}
