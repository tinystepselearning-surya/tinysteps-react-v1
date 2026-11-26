// Synthetic fixtures only. No operational configuration values are used.
export function configCases(resolve){
  const nodes=[{scope:"platform",id:"platform"},{scope:"tenant",id:"test-tenant"},{scope:"organisation",id:"test-org"},{scope:"campus",id:"test-campus"},{scope:"programme",id:"test-programme"}];
  const field=(name,type,required=true,nullable=false,extra={})=>({name,type,required,nullable,...extra});
  const contract={scope:"synthetic-only",version:2,settings:[
    {field:field("previewEnabled","boolean"),allowedScopes:["platform","tenant","organisation","programme"],default:true},
    {field:field("displayCount","integer"),allowedScopes:["platform","tenant","organisation","campus","programme"],default:7},
    {field:field("label","string",false,true),allowedScopes:["organisation","programme"],default:"sample"},
    {field:field("theme","enum",true,false,{values:["neutral","warm"]}),allowedScopes:["platform"],default:"neutral"},
    {field:field("tags","string-array",false),allowedScopes:["programme"]},
    {field:field("optionalNote","string",false),allowedScopes:["organisation"]}
  ]};
  const layer=(depth,values,revision=1)=>({lineage:nodes.slice(0,depth),schemaVersion:2,revision,values});
  const layers=[layer(1,{displayCount:6}),layer(2,{displayCount:5}),layer(3,{displayCount:4}),layer(4,{displayCount:3}),layer(5,{displayCount:0,previewEnabled:false,label:null,tags:[]},9)];
  const clone=x=>JSON.parse(JSON.stringify(x));
  const out=[];
  function check(name,fn){try{if(!fn())throw Error("assertion failed");out.push({name,pass:true});}catch(e){out.push({name,pass:false,error:String(e.message)});}}
  function bad(name,mutate,code){check(name,()=>{const c=clone(contract),n=clone(nodes),l=clone(layers);mutate(c,n,l);const x=resolve(c,n,l);return !x.valid&&x.settings===null&&!x.executableReady&&x.errors.some(e=>e.code===code);});}
  check("full hierarchy and falsy overrides",()=>{const x=resolve(contract,nodes,layers);return x.valid&&!x.executableReady&&x.settings.displayCount.value===0&&x.settings.previewEnabled.value===false&&x.settings.label.value===null&&x.settings.tags.value.length===0;});
  check("fallback uses nearest supplied ancestor",()=>resolve(contract,nodes,layers.slice(0,3)).settings.displayCount.value===4);
  check("campus override",()=>resolve(contract,nodes,layers.slice(0,4)).settings.displayCount.value===3);
  check("tenant override",()=>resolve(contract,nodes,layers.slice(0,2)).settings.displayCount.value===5);
  check("platform override",()=>resolve(contract,nodes,layers.slice(0,1)).settings.displayCount.value===6);
  check("explicit defaults only",()=>{const x=resolve(contract,nodes,[]);return x.valid&&x.settings.displayCount.value===7&&x.settings.displayCount.provenance.kind==="default"&&x.settings.tags.state==="missing"&&x.settings.optionalNote.state==="missing";});
  check("online programme without campus",()=>{const n=[...nodes.slice(0,3),nodes[4]];return resolve(contract,n,[{lineage:n,schemaVersion:2,revision:1,values:{displayCount:2}}]).settings.displayCount.value===2;});
  check("platform context",()=>resolve(contract,nodes.slice(0,1),[]).valid);
  check("tenant context",()=>resolve(contract,nodes.slice(0,2),[]).valid);
  check("empty string remains explicit",()=>resolve(contract,nodes,[layer(3,{label:""})]).settings.label.value==="");
  check("provenance exact scope revision",()=>{const p=resolve(contract,nodes,layers).settings.displayCount.provenance;return p.kind==="override"&&p.revision===9&&p.schemaVersion===2&&p.lineage[4].id==="test-programme";});
  check("order independence",()=>JSON.stringify(resolve(contract,nodes,layers))===JSON.stringify(resolve(contract,nodes,[...layers].reverse())));
  check("immutable independent result",()=>{const l=clone(layers);l[4].values.tags=["x"];const x=resolve(contract,nodes,l);l[4].values.tags[0]="changed";l[4].lineage[4].id="changed";return Object.isFrozen(x)&&Object.isFrozen(x.settings)&&Object.isFrozen(x.settings.tags)&&Object.isFrozen(x.settings.tags.value)&&Object.isFrozen(x.settings.tags.provenance.lineage[4])&&x.settings.tags.value[0]==="x"&&x.settings.tags.provenance.lineage[4].id==="test-programme";});
  check("inputs not mutated",()=>{const before=JSON.stringify([contract,nodes,layers]);resolve(contract,nodes,layers);return before===JSON.stringify([contract,nodes,layers]);});
  bad("cross tenant rejected",(_,n,l)=>{l[4].lineage[1].id="other-tenant";},"FOREIGN_LINEAGE");
  bad("cross organisation rejected",(_,n,l)=>{l[4].lineage[2].id="other-org";},"FOREIGN_LINEAGE");
  bad("cross campus rejected",(_,n,l)=>{l[4].lineage[3].id="other-campus";},"FOREIGN_LINEAGE");
  bad("cross programme rejected",(_,n,l)=>{l[4].lineage[4].id="other-programme";},"FOREIGN_LINEAGE");
  bad("missing tenant in context",(_,n)=>{n.splice(1,1);},"CONTEXT_LINEAGE");
  bad("missing organisation in context",(_,n)=>{n.splice(2,1);},"CONTEXT_LINEAGE");
  bad("misordered scope",(_,n)=>{[n[1],n[2]]=[n[2],n[1]];},"CONTEXT_LINEAGE");
  bad("invalid platform root",(_,n)=>{n[0].id="other";},"CONTEXT_LINEAGE");
  bad("invalid scope id",(_,n)=>{n[4].id="a/b";},"CONTEXT_LINEAGE");
  bad("duplicate scope snapshot",(_,n,l)=>{l[3]=clone(l[2]);l[3].revision=2;},"DUPLICATE_SCOPE");
  bad("wrong schema version",(_,n,l)=>{l[4].schemaVersion=1;},"VERSION_MISMATCH");
  bad("schema version not coerced",(_,n,l)=>{l[4].schemaVersion="2";},"VERSION_MISMATCH");
  bad("invalid revision",(_,n,l)=>{l[4].revision=0;},"LAYER_SHAPE");
  bad("unknown setting",(_,n,l)=>{l[4].values.unknown=true;},"UNKNOWN_SETTING");
  bad("forbidden scope override",(_,n,l)=>{l[4].values.theme="warm";},"SCOPE_NOT_ALLOWED");
  bad("invalid lower layer even when overridden",(_,n,l)=>{l[0].values.displayCount="6";},"INVALID_VALUE");
  bad("invalid null",(_,n,l)=>{l[4].values.displayCount=null;},"INVALID_VALUE");
  bad("invalid boolean",(_,n,l)=>{l[4].values.previewEnabled=0;},"INVALID_VALUE");
  bad("invalid enum",(_,n,l)=>{l[0].values.theme="other";},"INVALID_VALUE");
  bad("invalid array",(_,n,l)=>{l[4].values.tags=[1];},"INVALID_VALUE");
  bad("explicit undefined",(_,n,l)=>{l[4].values.label=undefined;},"INVALID_VALUE");
  bad("invalid default even if overridden",c=>{c.settings[1].default="7";},"INVALID_DEFAULT");
  bad("missing required no default", (c,n,l)=>{delete c.settings[3].default;},"MISSING_REQUIRED");
  bad("duplicate definition",c=>{c.settings.push(clone(c.settings[0]));},"DUPLICATE_SETTING");
  bad("unknown allowed scope",c=>{c.settings[0].allowedScopes.push("user");},"SETTING_CONTRACT");
  bad("duplicate allowed scope",c=>{c.settings[0].allowedScopes.push("platform");},"SETTING_CONTRACT");
  bad("held structured type",c=>{c.settings[0].field.type="structured";},"SETTING_CONTRACT");
  bad("reference type excluded",c=>{c.settings[0].field.type="reference";},"SETTING_CONTRACT");
  bad("malformed field contract",c=>{delete c.settings[0].field.nullable;},"SETTING_CONTRACT");
  bad("runtime contract refused",c=>{c.scope="production";},"CONTRACT_SHAPE");
  bad("unknown contract option",c=>{c.execute=true;},"CONTRACT_SHAPE");
  bad("unexpected layer property",(_,n,l)=>{l[4].execute=true;},"LAYER_SHAPE");
  check("accessor refused without invocation",()=>{const l=clone(layers);Object.defineProperty(l[4].values,"label",{enumerable:true,get(){throw Error("invoked");}});return resolve(contract,nodes,l).errors.some(e=>e.code==="LAYER_SHAPE");});
  check("unknown key not echoed",()=>{const l=clone(layers);l[4].values["synthetic-private-value"]=1;const x=resolve(contract,nodes,l);return !JSON.stringify(x).includes("synthetic-private-value");});
  check("no partial resolution on multiple errors",()=>{const l=clone(layers);l[4].values.displayCount="bad";l[4].values.unknown=1;const x=resolve(contract,nodes,l);return x.settings===null&&x.errors.length===2&&Object.isFrozen(x.errors);});
  return out;
}
