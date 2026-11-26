// Offline decoded-response boundary for the pinned generated Firestore client.
// No network, SDK imports, auth decisions or live data. Protobuf unknown wire
// tags are already discarded by the SDK: this validates decoded fields only.
import {FIELD_MASKS} from './identity-verification-safety-core.mjs';
const own=(o,k)=>Object.hasOwn(o,k);
const plain=o=>o!==null&&typeof o==='object'&&[Object.prototype,null].includes(Object.getPrototypeOf(o))&&
  Reflect.ownKeys(o).every(k=>typeof k==='string'&&Object.getOwnPropertyDescriptor(o,k).enumerable&&
    own(Object.getOwnPropertyDescriptor(o,k),'value'));
const allowed=(o,ks)=>plain(o)&&Object.keys(o).every(k=>ks.includes(k));
const fail=()=>{throw Error('RESPONSE_INVALID');};
const exact=(o,ks)=>allowed(o,ks)&&Object.keys(o).length===ks.length;
function timestamp(t){
  if(!exact(t,['seconds','nanos'])||typeof t.seconds!=='string'||!/^(0|[1-9][0-9]{0,11})$/.test(t.seconds)||
    Number(t.seconds)>253402300799||!Number.isInteger(t.nanos)||t.nanos<0||t.nanos>=1e9||t.nanos%1000!==0)fail();
  return Object.freeze({seconds:t.seconds,nanos:t.nanos});
}
const same=(a,b)=>a.seconds===b.seconds&&a.nanos===b.nanos;
function value(v){
  if(!plain(v)||typeof v.valueType!=='string'||!exact(v,['valueType',v.valueType]))fail();
  const x=v[v.valueType];
  switch(v.valueType){
    case 'stringValue':if(typeof x==='string'&&x.length<=500)return x;break;
    case 'booleanValue':if(typeof x==='boolean')return x;break;
    case 'integerValue':if(typeof x==='string'&&/^-?(0|[1-9][0-9]{0,15})$/.test(x)&&Number.isSafeInteger(Number(x)))return Number(x);break;
    case 'nullValue':if(x==='NULL_VALUE'||x===0)return null;break;
    case 'timestampValue':return timestamp(x);
    case 'arrayValue':
      if(exact(x,['values'])&&Array.isArray(x.values)&&x.values.length<=100&&x.values.every(y=>plain(y)&&y.valueType==='stringValue'))
        return Object.freeze(x.values.map(value));
      break;
  }
  fail();
}
const strings=['firebaseUid','personId','sourceAuthIdentityId','personStatus','authStatus','authority','authIdentityId',
  'provider','providerSubject','status','roleAssignmentId','role','scopeType','scopeId','organisationMembershipId','organisationId'];
function fields(doc,col){
  if(!allowed(doc,['name','fields','createTime','updateTime'])||typeof doc.name!=='string'||!plain(doc.fields))fail();
  for(const k of ['createTime','updateTime'])if(doc[k]!=null)timestamp(doc[k]);
  const out=Object.create(null);
  for(const [k,v] of Object.entries(doc.fields)){
    if(!FIELD_MASKS[col].includes(k))fail();
    const x=value(v);
    if(k==='updatedAt'){if(!plain(x))fail();}
    else if(k==='schemaVersion'){if(!Number.isSafeInteger(x))fail();}
    else if(['accessActive','superUser'].includes(k)){if(typeof x!=='boolean')fail();}
    else if(['globalRoles','schoolAdminOrganisationIds','roles','schoolIds'].includes(k)){
      if(!Array.isArray(x))fail();
    }else if(strings.includes(k)){
      if(typeof x!=='string'&&!(k==='scopeId'&&x===null))fail();
    }else fail();
    out[k]=x;
  }
  return Object.freeze(out);
}
export function createResponseCollector(ticket,{retain=false}={}){
  const col=ticket.collection,b=ticket.request.body,isQuery=ticket.request.method==='runQuery';
  const point=isQuery?null:b.documents[0],prefix=isQuery?b.parent+'/'+col+'/':null;
  const expectedPerson=isQuery?b.structuredQuery.where.fieldFilter.value.stringValue:null;
  const names=new Set(),decoded=[];let readTime=null,frames=0,rows=0,finished=false,missing=false;
  function accept(frame){
    if(finished||++frames>(isQuery?52:1)||!plain(frame))fail();
    // GAX proto-loader defaults: empty transaction, null message fields,
    // zero skippedResults, and a oneof selector for a present done flag.
    if(frame.transaction!==undefined&&(!Buffer.isBuffer(frame.transaction)||frame.transaction.length!==0))fail();
    const t=timestamp(frame.readTime);
    if((b.readTime&&!same(t,b.readTime))||(readTime&&!same(t,readTime)))fail();
    readTime??=t;
    if(isQuery){
      if(!allowed(frame,['transaction','document','readTime','skippedResults','done','continuationSelector','explainMetrics'])||
        (frame.skippedResults!==undefined&&frame.skippedResults!==0)||frame.explainMetrics!=null||
        (frame.continuationSelector!==undefined&&frame.continuationSelector!=='done')||
        (frame.done!==undefined&&frame.done!==true)||((frame.done===true)!==(frame.continuationSelector==='done')))fail();
      if(frame.document!=null){
        const d=frame.document,f=fields(d,col);
        if(!d.name.startsWith(prefix)||!/^[A-Za-z0-9_-]{1,128}$/.test(d.name.slice(prefix.length))||
          names.has(d.name)||f.personId!==expectedPerson||
          f[col==='roleAssignments'?'roleAssignmentId':'organisationMembershipId']!==d.name.slice(prefix.length)||
          ++rows>50)fail();
        names.add(d.name);if(retain)decoded.push(f);
      }else if(rows!==0&&frame.done!==true)fail();
      if(frame.done===true)finished=true;
    }else{
      if(!allowed(frame,['found','missing','result','transaction','readTime']))fail();
      if(frame.result==='missing'){
        if(frame.missing!==point||frame.found!=null||!['users','schoolUsers'].includes(col))fail();
        missing=true;
      }else if(frame.result==='found'){
        if(frame.missing!==undefined&&frame.missing!=='')fail();
        const d=frame.found,f=fields(d,col);
        if(d.name!==point)fail();
        const id=point.split('/').at(-1);
        if((col==='authAccessReadModels'&&f.firebaseUid!==id)||
          (col==='authIdentities'&&f.authIdentityId!==id)||
          (col==='people'&&f.personId!==id))fail();
        rows=1;if(retain)decoded.push(f);
      }else fail();
      finished=true;
    }
  }
  function finish(){
    if(!readTime||!frames||(!isQuery&&rows!==1&&!missing))fail();
    finished=true;
    // Counts/timestamp only, never export document contents.
    return Object.freeze({readTime,rows,missing,...(retain?{decoded:Object.freeze([...decoded])}:{})});
  }
  return Object.freeze({accept,finish});
}
