import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {simulateContextualDecision as simulate} from './contextual-decision-review-simulation.ts';

const cases=[
  ['onlineInstructor','attendance.markOnlineSession',null,'onlineParticipant','assignedOnlineSession','attendance',['attendanceDecision']],
  ['onlineInstructor','learner.readTeachingView',null,'learnerTeachingView','activeTeachingAssignment','teaching',['learnerDisplayName','lessonProgressSummary']],
  ['campusInstructor','learner.readTeachingView','fixture-campus-a','learnerTeachingView','activeTeachingAssignment','teaching',['learnerDisplayName']],
  ['schoolAttendanceOperator','attendance.markSchoolDaily','fixture-campus-a','schoolRegisterParticipant','assignedSchoolRegister','attendance',['attendanceDecision']],
  ['guardianViewer','learner.readGuardianView',null,'learnerGuardianView','verifiedGuardianPurposeAndRestrictions','guardianProgress',['publishedProgressSummary']],
  ['financeViewer','finance.readApprovedView',null,'financeSummary','approvedFinanceScope','financeReporting',['billedSummary','paymentSummary']],
  ['partnerSchoolViewer','partner.readSchool',null,'partnerSchoolSummary','verifiedPartnerSchoolReader','partnerReporting',['schoolSummary']],
  ['partnerSchoolOperator','partner.readSchool',null,'partnerSchoolSummary','verifiedPartnerSchoolReader','partnerReporting',['schoolSummary']]
];
function fixture(index=0){
  const [roleKey,action,campusId,kind,relationship,purpose,fields]=cases[index];
  const tenantId='fixture-tenant-a',organisationId='fixture-org-a',personId='fixture-person-a',resourceId='fixture-resource-a';
  const scope={tenantId,organisationId,campusId};
  const common={status:'active',revision:3};
  const interval={...common,start:1000,end:2000};
  const request={action,resourceId,scope:{...scope},purpose,fields:[...fields]};
  const evidence={
    observedAt:1500,
    principal:{personId,personStatus:'active',authStatus:'active',revision:3},
    tenant:{tenantId,...common},
    organisation:{organisationId,tenantId,...common},
    campus:campusId===null?null:{campusId,organisationId,tenantId,...common},
    tenantMembership:{personId,tenantId,...interval},
    organisationMembership:{personId,organisationId,...interval},
    grant:{personId,scope:{...scope},roleKey,policyVersion:1,...interval},
    resource:{resourceId,scope:{...scope},kind,...common},
    relationship:{personId,resourceId,scope:{...scope},kind:relationship,purpose,action,...interval}
  };
  return {request,evidence,fence:{at:1500,revision:3}};
}
const run=f=>simulate(f.request,f.evidence,f.fence);
const yes=f=>assert.deepEqual(run(f),{simulation:'synthetic-only',productionAuthorization:false,result:'would-allow'});
const no=(f,reason)=>assert.deepEqual(run(f),{simulation:'synthetic-only',productionAuthorization:false,result:'would-deny',reason});
for(let i=0;i<cases.length;i++)test('synthetic positive '+cases[i][0]+' '+cases[i][1],()=>yes(fixture(i)));
test('wrong tenant request',()=>{const f=fixture();f.request.scope.tenantId='fixture-tenant-b';no(f,'OWNER_MISMATCH');});
test('wrong organisation even within same tenant',()=>{const f=fixture();f.request.scope.organisationId='fixture-org-b';no(f,'OWNER_MISMATCH');});
test('wrong campus and wrong campus parent independently rejected',()=>{const f=fixture(3);f.request.scope.campusId='fixture-campus-b';no(f,'OWNER_MISMATCH');const g=fixture(3);g.evidence.campus.organisationId='fixture-org-b';no(g,'OWNER_MISMATCH');});
test('wrong tenant ownership of campus',()=>{const f=fixture(3);f.evidence.campus.tenantId='fixture-tenant-b';no(f,'OWNER_MISMATCH');});
test('online does not accept an unrelated campus record',()=>{const f=fixture();f.evidence.campus=fixture(3).evidence.campus;no(f,'OWNER_MISMATCH');});
test('grant subject mismatch',()=>{const f=fixture();f.evidence.grant.personId='fixture-person-b';no(f,'SUBJECT_MISMATCH');});
test('both membership subject and scope mismatches rejected',()=>{for(const k of ['tenantMembership','organisationMembership']){const f=fixture();f.evidence[k].personId='fixture-person-b';no(f,'SUBJECT_MISMATCH');}const g=fixture();g.evidence.tenantMembership.tenantId='fixture-tenant-b';no(g,'OWNER_MISMATCH');const h=fixture();h.evidence.organisationMembership.organisationId='fixture-org-b';no(h,'OWNER_MISMATCH');});
test('exact grant scope, no organisation/campus inheritance',()=>{const f=fixture(3);f.evidence.grant.scope.campusId=null;no(f,'OWNER_MISMATCH');const g=fixture();g.evidence.grant.scope.tenantId='fixture-tenant-b';no(g,'OWNER_MISMATCH');});
test('relationship cannot be reused for another child or actor',()=>{const f=fixture(4);f.evidence.relationship.resourceId='fixture-sibling-b';no(f,'OWNER_MISMATCH');const g=fixture(4);g.evidence.relationship.personId='fixture-person-b';no(g,'SUBJECT_MISMATCH');});
test('resource exact key and owner scope',()=>{const f=fixture();f.request.resourceId='fixture-other';no(f,'OWNER_MISMATCH');const g=fixture();g.evidence.resource.scope.tenantId='fixture-tenant-b';no(g,'OWNER_MISMATCH');});
test('relation scope and action binding',()=>{const f=fixture();f.evidence.relationship.scope.organisationId='fixture-org-b';no(f,'OWNER_MISMATCH');const g=fixture();g.evidence.relationship.action='learner.readTeachingView';no(g,'RELATIONSHIP_MISMATCH');});
test('wrong resource kind and unrelated relationship rejected',()=>{const f=fixture();f.evidence.resource.kind='schoolRegisterParticipant';no(f,'RELATIONSHIP_MISMATCH');const g=fixture();g.evidence.relationship.kind='activeTeachingAssignment';no(g,'RELATIONSHIP_MISMATCH');});
test('payer or household membership cannot stand in for guardianship',()=>{for(const kind of ['payer','householdMember','guardianRelationshipOnly']){const f=fixture(4);f.evidence.relationship.kind=kind;no(f,'RELATIONSHIP_MISMATCH');}});
test('suspended person and disabled authentication',()=>{const f=fixture();f.evidence.principal.personStatus='suspended';no(f,'INACTIVE');const g=fixture();g.evidence.principal.authStatus='disabled';no(g,'INACTIVE');});
test('inactive tenant, organisation, membership, grant, resource and relationship',()=>{for(const k of ['tenant','organisation','tenantMembership','organisationMembership','grant','resource','relationship']){const f=fixture();f.evidence[k].status='inactive';no(f,'INACTIVE');}const f=fixture(3);f.evidence.campus.status='inactive';no(f,'INACTIVE');});
test('independent fence changes reject formerly positive evidence',()=>{const f=fixture();yes(f);f.fence.revision=4;no(f,'STALE_OR_REVOKED');});
test('each stale evidence record denies',()=>{for(const k of ['principal','tenant','organisation','tenantMembership','organisationMembership','grant','resource','relationship']){const f=fixture();f.evidence[k].revision=2;no(f,'STALE_OR_REVOKED');}const f=fixture(3);f.evidence.campus.revision=2;no(f,'STALE_OR_REVOKED');});
test('no cached allow or future observation',()=>{const f=fixture();f.evidence.observedAt=1499;no(f,'STALE_OR_REVOKED');const g=fixture();g.evidence.observedAt=1501;no(g,'STALE_OR_REVOKED');});
test('half-open interval start inclusive and end exclusive',()=>{for(const k of ['tenantMembership','organisationMembership','grant','relationship']){const f=fixture();f.evidence[k].start=1500;yes(f);f.evidence[k].start=1501;no(f,'NOT_EFFECTIVE');const g=fixture();g.evidence[k].end=1500;no(g,'NOT_EFFECTIVE');}});
test('unknown, null and reversed effective dates denied',()=>{const f=fixture();f.evidence.grant.start=null;no(f,'MALFORMED');const g=fixture();g.evidence.relationship.end=1000;no(g,'MALFORMED');});
test('legacy role labels never imply successor permission',()=>{for(const roleKey of ['admin','founder','teacher','parent','kid','learningPartner','schoolAdmin']){const f=fixture();f.evidence.grant.roleKey=roleKey;no(f,'NO_POLICY');}});
test('unsupported policy version or action denied',()=>{const f=fixture();f.evidence.grant.policyVersion=2;no(f,'NO_POLICY');const g=fixture();g.request.action='attendance.*';no(g,'NO_POLICY');});
test('partner reader cannot manage school or campus',()=>{const f=fixture(6);f.request.action='partner.manageAssignedSchool';no(f,'NO_POLICY');const g=fixture(6);g.request.action='institution.manageRoster';no(g,'NO_POLICY');});
test('finance viewer cannot post or access learners',()=>{const f=fixture(5);f.request.action='finance.post';no(f,'NO_POLICY');const g=fixture(5);g.request.action='learner.readGuardianView';no(g,'NO_POLICY');});
test('school daily attendance cannot imply online session or finance',()=>{const f=fixture(3);f.request.action='attendance.markOnlineSession';no(f,'NO_POLICY');const g=fixture(3);g.request.action='finance.post';no(g,'NO_POLICY');});
test('requested and relationship purpose exact',()=>{const f=fixture(4);f.request.purpose='marketing';no(f,'FIELD_OR_PURPOSE');const g=fixture(4);g.evidence.relationship.purpose='marketing';no(g,'FIELD_OR_PURPOSE');});
test('field allowlist excludes sensitive and unrelated fields',()=>{for(const field of ['dateOfBirth','healthNotes','rawPaymentId','*','guardianPhone']){const f=fixture(1);f.request.fields.push(field);no(f,'FIELD_OR_PURPOSE');}});
test('nonempty distinct bounded field array',()=>{for(const fields of [[],['attendanceDecision','attendanceDecision'],Array(9).fill('attendanceDecision'),Array(1),[1]]){const f=fixture();f.request.fields=fields;no(f,'MALFORMED');}});
test('caller cannot supply identity, membership, permission or fence',()=>{for(const [key,value] of [['personId','fixture-person-a'],['allow',true],['grant',{}],['revision',3]]){const f=fixture();f.request[key]=value;no(f,'MALFORMED');}});
test('missing grant, membership or independent fence fails closed',()=>{const f=fixture();delete f.evidence.grant;no(f,'MALFORMED');const g=fixture();g.evidence.tenantMembership=null;no(g,'MALFORMED');const h=fixture();h.fence=null;no(h,'MALFORMED');});
test('invalid identifiers, time and revision rejected',()=>{const f=fixture();f.request.resourceId='fixture/x';no(f,'MALFORMED');const g=fixture();g.fence.at=NaN;no(g,'MALFORMED');const h=fixture();h.fence.revision=0;no(h,'MALFORMED');});
test('accessor not invoked; unknown extra fields rejected',()=>{const f=fixture();let invoked=false;Object.defineProperty(f.request,'action',{enumerable:true,get(){invoked=true;return 'attendance.markOnlineSession';}});no(f,'MALFORMED');assert.equal(invoked,false);const g=fixture();g.evidence.resource.extra=true;no(g,'MALFORMED');});
test('simulation output does not mutate evidence or expose identity/fields',()=>{const f=fixture();const copy=structuredClone(f);const result=run(f);assert.deepEqual(f,copy);assert.ok(Object.isFrozen(result));assert.deepEqual(Object.keys(result).sort(),['productionAuthorization','result','simulation']);});
test('legacy source pins unchanged',()=>{const read=p=>readFileSync(new URL('../../'+p,import.meta.url));const sha=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');for(const [path,pin] of [['functions/src/schoolOS/identity/contracts.ts','be340ac4cb6be06effa1d09e1510a1e75f08c70a'],['functions/src/schoolOS/identity/idStrategy.ts','02037d2dd897cd06f5dc67e32d20b70824ea1527'],['functions/src/schoolOS/identity/authAccessReadModel.ts','461dbab181c6d77b21fc75f5871ce6244dc840ab'],['functions/src/schoolOS/identity/authAccessAuthorization.ts','812429177c5dd9c7fcad6616e4a7d05bac20aeb5'],['functions/src/helpers/schoolAuthorization.ts','0f2fa04cd1b5ed70c9ae9581d3eb7215cdcbfd6b']])assert.equal(sha(read(path)),pin,path);});
