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
  if(v===null||typeof v!=='object')return JSON.stringify(v);
  if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
  const row=v as Record<string,unknown>;
  return '{'+Object.keys(row).sort().map(k=>JSON.stringify(k)+':'+canonical(row[k])).join(',')+'}';
}
function fingerprint(v:unknown):string{return createHash('sha256').update(canonical(v),'utf8').digest('hex');}
type Snapshot=Readonly<{request:unknown;evidence:unknown;route:unknown;fence:unknown;actor:string;operation:string;at:number;revision:number;epoch:number;requestHash:string;routeHash:string;effect:Effect}>;
function snapshot(input:unknown):Snapshot|null{
  const s=reviewRow(copyReviewFixture(input),['request','evidence','route','fence']);if(!s)return null;
  const f=reviewRow(s.fence,['personId','at','revision','operation','epoch']);
  const q=reviewRow(s.request,['action','scope'],['resourceId','purpose','fields','targetId','operationId','expectedTargetRevision','payload']);
  if(!f||!q||!isReviewId(f.personId)||typeof f.operation!=='string'||!/^fixture\.[A-Za-z][A-Za-z0-9]{0,80}$/.test(f.operation)||!isReviewInteger(f.at,REVIEW_MIN_TIME,REVIEW_MAX_TIME)||!isReviewInteger(f.revision,1)||!isReviewInteger(f.epoch,1)||typeof q.action!=='string'||!Object.hasOwn(effects,q.action))return null;
  if(reviewUnifiedOperation(s.request,s.evidence,s.route,s.fence).result!=='synthetic-v2-match')return null;
  return Object.freeze({request:s.request,evidence:s.evidence,route:s.route,fence:s.fence,actor:f.personId,operation:f.operation,at:f.at,revision:f.revision,epoch:f.epoch,requestHash:fingerprint(s.request),routeHash:fingerprint(s.route),effect:effects[q.action as keyof typeof effects]});
}
type Answer=Readonly<{kind:'synthetic-match';effect:Effect;productionAuthorization:false;mutationPermitted:false;dataReturned:false}>|Readonly<{kind:'denied';reason:'INVALID'|'STALE'|'MISMATCH'|'UNAVAILABLE';productionAuthorization:false;mutationPermitted:false;dataReturned:false}>;
function denied(reason:Extract<Answer,{kind:'denied'}>['reason']):Answer{return Object.freeze({kind:'denied',reason,productionAuthorization:false,mutationPermitted:false,dataReturned:false});}
// The operator and consumer surfaces are separate capabilities in this local process.
// Seed and publish remain fixture-only; never pass operator controls to application callers.
export function createOfflineEvidenceProvider(seed:unknown){
  try{
    const initial=snapshot(seed);if(!initial)return null;
    let current:Snapshot=initial,available=true,watermark=initial.revision;
    const consumer=Object.freeze({
      evaluate(request:unknown,actor:unknown,at:unknown):Answer{
        try{
          if(!available)return denied('UNAVAILABLE');
          if(!isReviewId(actor)||!isReviewInteger(at,REVIEW_MIN_TIME,REVIEW_MAX_TIME))return denied('INVALID');
          if(actor!==current.actor)return denied('MISMATCH');
          if(at!==current.at)return denied('STALE');
          const copy=copyReviewFixture(request);
          if(fingerprint(copy)!==current.requestHash)return denied('MISMATCH');
          if(reviewUnifiedOperation(copy,current.evidence,current.route,current.fence).result!=='synthetic-v2-match')return denied('UNAVAILABLE');
          return Object.freeze({kind:'synthetic-match',effect:current.effect,productionAuthorization:false,mutationPermitted:false,dataReturned:false});
        }catch{return denied('INVALID');}
      }
    });
    const operator=Object.freeze({
      publish(next:unknown):boolean{
        try{
          const s=snapshot(next);
          if(!available||!s||s.actor!==current.actor||s.operation!==current.operation||s.requestHash!==current.requestHash||s.revision<=watermark||s.at<current.at||s.epoch<current.epoch)return false;
          // A route change must advance epoch; a higher epoch may keep the same phase.
          if(s.routeHash!==current.routeHash&&s.epoch===current.epoch)return false;
          current=s;watermark=s.revision;return true;
        }catch{return false;}
      },
      withdraw(nextRevision:unknown):boolean{
        if(!available||!isReviewInteger(nextRevision,1)||nextRevision<=watermark)return false;
        watermark=nextRevision;available=false;return true;
      }
    });
    return Object.freeze({consumer,operator});
  }catch{return null;}
}
