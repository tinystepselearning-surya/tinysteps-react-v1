// Standalone review-only capability catalogue. NOT a grant evaluator or runtime adapter.
import type { CanonicalRole, RoleScopeType } from '../../functions/src/schoolOS/identity/contracts.ts';

export const LEGACY_ROLES=Object.freeze(['admin','founder','teacher','parent','kid','learningPartner','schoolAdmin'] as const satisfies readonly CanonicalRole[]);
export const LEGACY_SCOPES=Object.freeze(['global','organisation','household'] as const satisfies readonly RoleScopeType[]);
export const POLICY_VERSION=1 as const; // fixture policy version, not a persisted schema version
type Scope='tenant'|'organisation'|'campus';
type Capability=
  |'institution.create'|'campus.create'|'institution.manageRoster'
  |'attendance.markSchoolDaily'|'attendance.markOnlineSession'
  |'learner.readTeachingView'|'learner.readGuardianView'
  |'finance.readApprovedView'|'finance.post'
  |'partner.readSchool'|'partner.manageAssignedSchool'|'platform.supportScoped';
type Requirement=
  |'approvedInstitutionOperator'|'approvedCampusOperator'|'activePlacement'
  |'assignedSchoolRegister'|'assignedOnlineSession'|'activeTeachingAssignment'
  |'verifiedGuardianPurposeAndRestrictions'|'approvedFinanceScope'
  |'approvedFinanceCommandAndLedger'|'verifiedPartnerSchoolReader'
  |'verifiedAssignedPartnerSchool'|'approvedTimeBoundSupportCase';
type Rule=Readonly<{capability:Capability;scope:Scope;relationship:Requirement}>;
function rule(capability:Capability,scope:Scope,relationship:Requirement):Rule{return Object.freeze({capability,scope,relationship});}
function rules(...items:Rule[]):readonly Rule[]{return Object.freeze(items);}
// Synthetic versioned keys intentionally differ from legacy canonical role labels.
// Every entry is an explicit action/scope pair, not inherited rights.
const catalogue=Object.freeze({
  institutionCreator:rules(rule('institution.create','tenant','approvedInstitutionOperator')),
  campusCreator:rules(rule('campus.create','organisation','approvedCampusOperator')),
  ownedSchoolRosterOperator:rules(rule('institution.manageRoster','organisation','activePlacement'),rule('institution.manageRoster','campus','activePlacement')),
  schoolAttendanceOperator:rules(rule('attendance.markSchoolDaily','campus','assignedSchoolRegister')),
  onlineInstructor:rules(rule('attendance.markOnlineSession','organisation','assignedOnlineSession'),rule('learner.readTeachingView','organisation','activeTeachingAssignment')),
  campusInstructor:rules(rule('learner.readTeachingView','campus','activeTeachingAssignment')),
  guardianViewer:rules(rule('learner.readGuardianView','organisation','verifiedGuardianPurposeAndRestrictions')),
  financeViewer:rules(rule('finance.readApprovedView','organisation','approvedFinanceScope')),
  financePoster:rules(rule('finance.post','organisation','approvedFinanceCommandAndLedger')),
  partnerSchoolViewer:rules(rule('partner.readSchool','organisation','verifiedPartnerSchoolReader')),
  partnerSchoolOperator:rules(rule('partner.readSchool','organisation','verifiedPartnerSchoolReader'),rule('partner.manageAssignedSchool','organisation','verifiedAssignedPartnerSchool')),
  // Scope is the exact tenant in an independently approved case; no standing global support role.
  scopedSupportOperator:rules(rule('platform.supportScoped','tenant','approvedTimeBoundSupportCase'))
} satisfies Record<string,readonly Rule[]>);
export type CandidateRole=keyof typeof catalogue;
export const CANDIDATE_ROLE_KEYS=Object.freeze(Object.keys(catalogue) as CandidateRole[]);
type Miss='INVALID_INPUT'|'UNKNOWN_VERSION'|'UNKNOWN_ROLE'|'UNREGISTERED_ACTION_OR_SCOPE';
type Match=Readonly<{kind:'candidate-policy-match';version:typeof POLICY_VERSION;rule:Rule;authorizationEvaluated:false;requiresCurrentAuthority:true;requiresExactResourceScope:true;requiresDomainRelationship:true;requiresFieldPolicy:true}>;
type NoMatch=Readonly<{kind:'no-policy-match';reason:Miss;authorizationEvaluated:false}>;
type Result=Match|NoMatch;
function miss(reason:Miss):NoMatch{return Object.freeze({kind:'no-policy-match',reason,authorizationEvaluated:false});}
function exactInput(input:unknown):Record<string,unknown>|null{
  if(input===null||typeof input!=='object'||Array.isArray(input))return null;
  const p=Object.getPrototypeOf(input);
  if(p!==Object.prototype&&p!==null)return null;
  const fields=['policyVersion','roleKey','capability','scope'];
  const keys=Reflect.ownKeys(input);
  if(keys.length!==fields.length)return null;
  const out:Record<string,unknown>=Object.create(null);
  for(const k of keys){
    if(typeof k!=='string'||!fields.includes(k))return null;
    const d=Object.getOwnPropertyDescriptor(input,k);
    if(!d||!d.enumerable||!Object.hasOwn(d,'value'))return null;
    out[k]=d.value;
  }
  return out;
}
// A match means that the proposed policy contains the action/scope pair.
// It NEVER authenticates, validates a grant, checks membership or returns allow.
export function inspectCandidateCapability(input:unknown):Result{
  try{
    const x=exactInput(input);
    if(!x)return miss('INVALID_INPUT');
    if(x.policyVersion!==POLICY_VERSION)return miss('UNKNOWN_VERSION');
    if(typeof x.roleKey!=='string'||!Object.hasOwn(catalogue,x.roleKey))return miss('UNKNOWN_ROLE');
    if(typeof x.capability!=='string'||typeof x.scope!=='string')return miss('INVALID_INPUT');
    const entry=catalogue[x.roleKey as CandidateRole].find(v=>v.capability===x.capability&&v.scope===x.scope);
    if(!entry)return miss('UNREGISTERED_ACTION_OR_SCOPE');
    return Object.freeze({kind:'candidate-policy-match',version:POLICY_VERSION,rule:entry,authorizationEvaluated:false,requiresCurrentAuthority:true,requiresExactResourceScope:true,requiresDomainRelationship:true,requiresFieldPolicy:true});
  }catch{return miss('INVALID_INPUT');}
}
// Read-only catalogue inventory for review, never input-derived or a capability grant.
export function inspectCandidateCatalogue():ReadonlyArray<Readonly<{roleKey:CandidateRole;rules:readonly Rule[]}>>{
  return Object.freeze(CANDIDATE_ROLE_KEYS.map(roleKey=>Object.freeze({roleKey,rules:catalogue[roleKey]})));
}
