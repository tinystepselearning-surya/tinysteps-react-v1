// Synthetic pure checks; no real usage/cost evidence.
import {PINNED,CANDIDATE,EXPECTED,checkInventory,checkFreshnessPlan} from "./architecture-fitness-core.mjs";
export function fitnessCases(){
  const entries=EXPECTED.map(path=>({path,kind:"regular",blobSha:PINNED[path]??"0".repeat(40)}));
  const p={scope:"synthetic-only",dataset:"sample history",query:"sample query",action:"view sample",tier:"t-1",purpose:"reporting",authority:"sample source",authorization:"current contextual check",cutoff:{basis:"prior-local-day",timeZone:"Asia/Kolkata"},budget:{documentReads:1,indexReads:0,writes:0},projectionReuse:"reuse sample",invalidation:"sample revision",dependencies:["sample job"],freshnessDisplay:"watermark",errorDisplay:"unavailable",reconciliation:"sample parity",rollback:"last verified",costEvidence:"pending",readAmplification:"pending",liveRationale:null,rawFallback:false,fabricatedZeros:false,operationalAuthorization:false};
  const clone=x=>JSON.parse(JSON.stringify(x)),out=[];
  function check(name,fn){try{if(!fn())throw Error("assertion failed");out.push({name,pass:true});}catch(e){out.push({name,pass:false,error:String(e.message)});}}
  function inv(name,mutate,code){check(name,()=>{const e=clone(entries);mutate(e);const x=checkInventory(e);return !x.valid&&!x.executableReady&&x.errors.includes(code);});}
  function bad(name,mutate,code){check(name,()=>{const q=clone(p);mutate(q);const x=checkFreshnessPlan(q);return !x.valid&&!x.executableReady&&x.errors.includes(code);});}
  check("exact accepted inventory",()=>checkInventory(entries).valid);
  check("inventory order independent",()=>JSON.stringify(checkInventory(entries))===JSON.stringify(checkInventory([...entries].reverse())));
  check("candidate files explicitly not self pinned",()=>CANDIDATE.every(x=>!Object.hasOwn(PINNED,x)));
  inv("missing file",e=>e.pop(),"MISSING_FILE");
  inv("duplicate file",e=>e.push(e[0]),"DUPLICATE_FILE");
  inv("unexpected file",e=>e.push({path:"scripts/architecture/unreviewed.mjs",kind:"regular",blobSha:"0".repeat(40)}),"UNEXPECTED_FILE");
  inv("unsafe file",e=>{e[0].kind="symlink"},"UNSAFE_FILE");
  inv("digest mismatch",e=>{e.find(x=>Object.hasOwn(PINNED,x.path)).blobSha="0".repeat(40)},"PIN_MISMATCH");
  inv("invalid digest",e=>{e[0].blobSha="bad"},"DIGEST_SHAPE");
  inv("unknown entry property",e=>{e[0].extra=true},"ENTRY_SHAPE");
  check("report plan valid but not executable",()=>{const x=checkFreshnessPlan(p);return x.valid&&!x.executableReady;});
  check("current operational plan with reason",()=>checkFreshnessPlan({...p,tier:"current",purpose:"operational",cutoff:null,liveRationale:"current action",operationalAuthorization:true}).valid);
  check("current reporting exception with reason",()=>checkFreshnessPlan({...p,tier:"current",cutoff:null,liveRationale:"bounded investigation"}).valid);
  bad("unknown tier",q=>{q.tier="weekly"},"TIER_SHAPE");
  bad("missing action declaration",q=>{q.action=""},"REQUIRED_DECLARATION");
  bad("missing current authorization",q=>{q.authorization=""},"REQUIRED_DECLARATION");
  bad("missing budget",q=>{q.budget=null},"BUDGET_SHAPE");
  bad("negative budget",q=>{q.budget.writes=-1},"BUDGET_SHAPE");
  bad("fractional budget",q=>{q.budget.documentReads=0.5},"BUDGET_SHAPE");
  bad("numeric coercion refused",q=>{q.budget.indexReads="0"},"BUDGET_SHAPE");
  bad("missing dependency declaration",q=>{q.dependencies=null},"DEPENDENCIES_SHAPE");
  bad("duplicate dependency",q=>{q.dependencies.push(q.dependencies[0])},"DEPENDENCIES_SHAPE");
  bad("claimed certification refused",q=>{q.costEvidence="certified"},"EVIDENCE_STATUS");
  bad("amplification evidence required",q=>{q.readAmplification=null},"EVIDENCE_STATUS");
  bad("missing cutoff",q=>{q.cutoff=null},"REPORTING_CUTOFF");
  bad("invalid timezone",q=>{q.cutoff.timeZone="Asia/Nowhere"},"REPORTING_CUTOFF");
  bad("offset not named zone",q=>{q.cutoff.timeZone="+05:30"},"REPORTING_CUTOFF");
  bad("current data as report cutoff",q=>{q.cutoff.basis="today"},"REPORTING_CUTOFF");
  bad("stale operational purpose",q=>{q.purpose="operational"},"STALE_OPERATIONAL_AUTHORITY");
  bad("stale operational authorization",q=>{q.operationalAuthorization=true},"STALE_OPERATIONAL_AUTHORITY");
  bad("raw fallback forbidden",q=>{q.rawFallback=true},"REPORTING_RAW_FALLBACK");
  bad("fabricated zeros forbidden",q=>{q.fabricatedZeros=true},"FABRICATED_ZERO");
  bad("current reason missing",q=>{q.tier="current";q.cutoff=null},"CURRENT_CONTRACT");
  bad("current cutoff incompatible",q=>{q.tier="current";q.liveRationale="reason"},"CURRENT_CONTRACT");
  bad("reporting live rationale unexpected",q=>{q.liveRationale="reason"},"REPORTING_LIVE_RATIONALE");
  bad("production plan refused",q=>{q.scope="production"},"PLAN_SHAPE");
  bad("missing reconciliation",q=>{q.reconciliation=""},"REQUIRED_DECLARATION");
  bad("missing rollback",q=>{q.rollback=""},"REQUIRED_DECLARATION");
  bad("missing projection reuse",q=>{q.projectionReuse=""},"REQUIRED_DECLARATION");
  check("diagnostics immutable and no raw values",()=>{const x=checkFreshnessPlan({...p,tier:"private-value"});return Object.isFrozen(x)&&Object.isFrozen(x.errors)&&!JSON.stringify(x).includes("private-value");});
  return out;
}
