import {reviewRow,isReviewInteger} from './offline-review-validation.ts';
// Synthetic compatibility-lane routing review. No production router, authority or grant.
type Lane='v1'|'v2';
type Phase='legacy'|'shadow'|'successor'|'disabled';
type Route=Readonly<{scope:'synthetic-routing-only';productionAuthorization:false;kind:'route';lane:Lane;shadowObservationOnly:boolean}>;
type Stop=Readonly<{scope:'synthetic-routing-only';productionAuthorization:false;kind:'stop';reason:'INVALID'|'UNKNOWN_ACTION'|'STALE'|'CONFLICT'|'DISABLED'|'NO_AUTHORITY'}>;
type Result=Route|Stop;
type Row=Record<string,unknown>;
// Illustrative operation identifiers, NOT existing callable names or an approved route registry.
// Existing-action fixtures may move only through a separately reviewed handoff.
// New-action fixtures have no legacy authority, including in shadow/rollback.
const operations=Object.freeze({
  'fixture.onlineAttendance': 'existing',
  'fixture.partnerRead': 'existing',
  'fixture.partnerManage': 'existing',
  'fixture.onlineTeachingView': 'existing',
  'fixture.campusTeachingView': 'new',
  'fixture.guardianView': 'existing',
  'fixture.financeView': 'existing',
  'fixture.physicalAttendance': 'new',
  'fixture.campusCreate': 'new',
  'fixture.institutionCreate': 'new',
  'fixture.organisationRoster': 'new',
  'fixture.campusRoster': 'new',
  'fixture.financePost': 'existing',
  'fixture.scopedSupport': 'new',
} as const);
function stop(reason:Stop['reason']):Stop{return Object.freeze({scope:'synthetic-routing-only',productionAuthorization:false,kind:'stop',reason});}
function route(lane:Lane,shadowObservationOnly=false):Route{return Object.freeze({scope:'synthetic-routing-only',productionAuthorization:false,kind:'route',lane,shadowObservationOnly});}
function row(v:unknown,fields:readonly string[]):Row|null{return reviewRow(v,fields);}
function epoch(x:unknown):x is number{return isReviewInteger(x,1);}
function lane(x:unknown):x is Lane{return x==='v1'||x==='v2';}
function phase(x:unknown):x is Phase{return x==='legacy'||x==='shadow'||x==='successor'||x==='disabled';}
// All arguments are test-harness data. A real route policy must be loaded by the
// server from an independently governed source. Neither request nor policy/fence
// here authenticates anyone. Route selection is not an authorization result.
export function simulateAuthorityRoute(request:unknown,policy:unknown,currentFence:unknown):Result{
  try{
    const q=row(request,['operation']);
    const p=row(policy,['operation','epoch','phase','decisionLane','writerLane','handoff']);
    const f=row(currentFence,['operation','epoch']);
    if(!q||!p||!f||typeof q.operation!=='string'||!epoch(p.epoch)||!epoch(f.epoch)||!phase(p.phase))return stop('INVALID');
    if(!Object.hasOwn(operations,q.operation))return stop('UNKNOWN_ACTION');
    if(p.operation!==q.operation||f.operation!==q.operation||p.epoch!==f.epoch)return stop('STALE');
    if(p.handoff!=='none'&&p.handoff!=='synthetic-complete')return stop('INVALID');
    if(p.phase==='disabled'){
      if(p.decisionLane!==null||p.writerLane!==null)return stop('CONFLICT');
      return stop('DISABLED');
    }
    if(!lane(p.decisionLane)||!lane(p.writerLane))return stop('NO_AUTHORITY');
    if(p.decisionLane!==p.writerLane)return stop('CONFLICT');
    const existing=operations[q.operation as keyof typeof operations]==='existing';
    if(p.phase==='legacy'||p.phase==='shadow'){
      if(!existing)return stop('NO_AUTHORITY');
      if(p.decisionLane!=='v1'||p.handoff!=='none')return stop('CONFLICT');
      return route('v1',p.phase==='shadow');
    }
    // Both new activation and migration of an existing operation are represented
    // only after a synthetic completed handoff. No runtime switch is implemented.
    if(p.decisionLane!=='v2'||p.handoff!=='synthetic-complete')return stop('CONFLICT');
    return route('v2');
  }catch{return stop('INVALID');}
}
// This is a terminal synthetic outcome, never a real authorization decision.
// No result, including unavailable, can request a retry against another lane.
// Validate the exact selected route and re-evaluate against the current fence;
// this is not a real transactional compare-and-set or revocation implementation.
export function simulateTerminalAuthorityOutcome(request:unknown,policy:unknown,currentFence:unknown,observation:unknown):Readonly<{scope:'synthetic-routing-only';productionAuthorization:false;result:'would-allow'|'would-deny';alternateLaneAttempt:false}>{
  let result:'would-allow'|'would-deny'='would-deny';
  try{
    const selected=simulateAuthorityRoute(request,policy,currentFence);
    const observed=row(observation,['operation','epoch','lane','outcome']);
    const q=row(request,['operation']),f=row(currentFence,['operation','epoch']);
    if(selected.kind==='route'&&observed&&q&&f&&observed.operation===q.operation&&observed.epoch===f.epoch&&observed.lane===selected.lane&&observed.outcome==='synthetic-allow')result='would-allow';
  }catch{/* deny */}
  return Object.freeze({scope:'synthetic-routing-only',productionAuthorization:false,result,alternateLaneAttempt:false});
}
