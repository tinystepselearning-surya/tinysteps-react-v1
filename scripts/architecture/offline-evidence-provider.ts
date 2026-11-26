// Operator-owned synthetic evidence provider contract. No real identity or evidence trust.
import {createHash} from 'node:crypto';
import {copyReviewFixture,reviewRow,isReviewId,isReviewInteger,REVIEW_MIN_TIME,REVIEW_MAX_TIME} from './offline-review-validation.ts';
import {reviewUnifiedOperation} from './unified-context-review-framework.ts';
type Effect='read-preview'|'mutation-intent-only';
const effects=Object.freeze({
  'institution.create':'mutation-intent-only','campus.create':'mutation-intent-only',
  'institution.manageRoster':'mutation-intent-only','attendance.markSchoolDaily':'mutation-intent-only',
  'attendance.markOnlineSession':'mutation-intent-only','learner.readTeachingView':'read-preview',
  'learner.readGuardianView':'read-preview','finance.readApprovedView':'read-preview',
  'finance.post':'mutation-intent-only','partner.readSchool':'read-preview',
  'partner.manageAssignedSchool':'mutation-intent-only','platform.supportScoped':'read-preview'
} as const satisfies Record<string,Effect>);
function canonical(v:unknown):string{
  if(v===null||typeof v!=='object'){const json=JSON.stringify(v);if(json===undefined)throw Error('invalid primitive');return json;}
  if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
  const row=v as Record<string,unknown>;
  return '{'+Object.keys(row).sort().map(k=>JSON.stringify(k)+':'+canonical(row[k])).join(',')+'}';
}
function fingerprint(v:unknown):string{return createHash('sha256').update(canonical(v),'utf8').digest('hex');}
type Fence=Readonly<{actor:string;operation:string;at:number;revision:number;epoch:number}>;
type Binding=Fence&Readonly<{requestHash:string;effect:Effect}>;
type Snapshot=Binding&Readonly<{request:unknown;evidence:unknown;route:unknown;fence:unknown;routeHash:string;publicationHash:string}>;
function readFence(input:unknown):Fence|null{
  const f=reviewRow(input,['personId','at','revision','operation','epoch']);
  if(!f||!isReviewId(f.personId)||typeof f.operation!=='string'||!/^fixture\.[A-Za-z][A-Za-z0-9]{0,80}$/.test(f.operation)||!isReviewInteger(f.at,REVIEW_MIN_TIME,REVIEW_MAX_TIME)||!isReviewInteger(f.revision,1)||!isReviewInteger(f.epoch,1))return null;
  return Object.freeze({actor:f.personId,operation:f.operation,at:f.at,revision:f.revision,epoch:f.epoch});
}
function binding(request:unknown,fence:unknown):Binding|null{
  const f=readFence(fence);
  const q=reviewRow(request,['action','scope'],['resourceId','purpose','fields','targetId','operationId','expectedTargetRevision','payload']);
  if(!f||!q||typeof q.action!=='string'||!Object.hasOwn(effects,q.action))return null;
  return Object.freeze({...f,requestHash:fingerprint(request),effect:effects[q.action as keyof typeof effects]});
}
function snapshot(input:unknown):Snapshot|null{
  const s=reviewRow(copyReviewFixture(input),['request','evidence','route','fence']);if(!s)return null;
  const b=binding(s.request,s.fence);if(!b)return null;
  if(reviewUnifiedOperation(s.request,s.evidence,s.route,s.fence).result!=='synthetic-v2-match')return null;
  return Object.freeze({...b,request:s.request,evidence:s.evidence,route:s.route,fence:s.fence,routeHash:fingerprint(s.route),publicationHash:fingerprint(s)});
}
type Answer=Readonly<{kind:'synthetic-match';effect:Effect;productionAuthorization:false;mutationPermitted:false;dataReturned:false}>|Readonly<{kind:'denied';reason:'INVALID'|'STALE'|'MISMATCH'|'UNAVAILABLE';productionAuthorization:false;mutationPermitted:false;dataReturned:false}>;
function denied(reason:Extract<Answer,{kind:'denied'}>['reason']):Answer{return Object.freeze({kind:'denied',reason,productionAuthorization:false,mutationPermitted:false,dataReturned:false});}
// Only the fixture operator holds publish/observeFence/withdraw. This models a
// trusted source boundary, not authentication, real time or distributed revocation.
// Terminal invalidation deliberately requires a new independently seeded instance.
export function createOfflineEvidenceProvider(seed:unknown){
  try{
    const initial=snapshot(seed);if(!initial)return null;
    let current:Snapshot|null=initial;
    function invalidate():false{current=null;return false;}
    const consumer=Object.freeze({
      evaluate(request:unknown,actor:unknown):Answer{
        const active=current;
        if(!active)return denied('UNAVAILABLE');
        try{
          if(!isReviewId(actor))return denied('INVALID');
          if(actor!==active.actor)return denied('MISMATCH');
          const copy=copyReviewFixture(request);
          if(fingerprint(copy)!==active.requestHash)return denied('MISMATCH');
          if(reviewUnifiedOperation(copy,active.evidence,active.route,active.fence).result!=='synthetic-v2-match'){invalidate();return denied('UNAVAILABLE');}
          return Object.freeze({kind:'synthetic-match',effect:active.effect,productionAuthorization:false,mutationPermitted:false,dataReturned:false});
        }catch{return denied('INVALID');}
      }
    });
    const operator=Object.freeze({
      publish(next:unknown):boolean{
        const active=current;if(!active)return false;
        try{
          // Parse the binding independently of positive authorization. An attributable
          // newer revoked/invalid publication must not leave the previous allow alive.
          const row=reviewRow(next,['request','evidence','route','fence']);
          if(!row)return invalidate();
          const b=binding(copyReviewFixture(row.request),copyReviewFixture(row.fence));
          if(!b)return invalidate();
          if(b.actor!==active.actor||b.operation!==active.operation||b.requestHash!==active.requestHash)return false;
          // Delayed publications are not current-source observations. They cannot roll back state.
          if(b.revision<active.revision)return false;
          const s=snapshot(next);
          // Same revision is idempotent only for an exact duplicate. Equivocation closes.
          if(b.revision===active.revision)return s&&s.publicationHash===active.publicationHash?false:invalidate();
          if(!s||s.at<active.at||s.epoch<active.epoch)return invalidate();
          if(s.routeHash!==active.routeHash&&s.epoch===active.epoch)return invalidate();
          current=s;return true;
        }catch{return invalidate();}
      },
      observeFence(next:unknown):boolean{
        const active=current;if(!active)return false;
        try{
          // This is a CURRENT observation by the operator, not a delayed publication.
          // Null, malformed, regressive, advanced or otherwise uncertain bound freshness
          // closes the snapshot. A matching observation does not itself grant authority.
          const f=readFence(copyReviewFixture(next));
          if(!f)return invalidate();
          if(f.actor!==active.actor||f.operation!==active.operation)return false;
          if(f.at!==active.at||f.revision!==active.revision||f.epoch!==active.epoch)return invalidate();
          return true;
        }catch{return invalidate();}
      },
      withdraw(nextRevision:unknown):boolean{
        const active=current;if(!active||!isReviewInteger(nextRevision,1)||nextRevision<=active.revision)return false;
        current=null;return true;
      }
    });
    return Object.freeze({consumer,operator});
  }catch{return null;}
}
