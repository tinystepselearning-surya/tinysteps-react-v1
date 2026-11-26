// B01-B.3 fixture policies are invented presentation decisions, never live business policy.
export function businessRuleCases(evaluate){
  const field=(name,type,required=true,nullable=false,extra={})=>({name,type,required,nullable,...extra});
  const contract={scope:"synthetic-only",version:2,dateBasis:"serviceDate",inputs:[field("mode","enum",true,false,{values:["individual","group"]}),field("preview","boolean"),field("count","integer"),field("note","string",false,true)],outcome:field("label","enum",true,false,{values:["standard","enhanced","review"]})};
  const rule=(id,version,start,end,priority,conditions,outcome)=>({id,version,start,end,priority,conditions,outcome});
  const set={scope:"synthetic-only",contractVersion:2,revision:7,rules:[
    rule("base",1,"2026-01-01",null,0,[],"standard"),
    rule("preview",1,"2026-01-01","2026-07-01",10,[{field:"preview",equals:true}],"enhanced"),
    rule("preview",2,"2026-07-01",null,10,[{field:"preview",equals:true}],"review"),
    rule("group",1,"2026-01-01",null,5,[{field:"mode",equals:"group"}],"enhanced")
  ]};
  const event={dateBasis:"serviceDate",date:"2026-06-30",inputs:{mode:"individual",preview:true,count:0}};
  const clone=x=>JSON.parse(JSON.stringify(x));
  const out=[];
  function check(name,fn){try{if(!fn())throw Error("assertion failed");out.push({name,pass:true});}catch(e){out.push({name,pass:false,error:String(e.message)});}}
  function bad(name,mutate,code){check(name,()=>{const c=clone(contract),s=clone(set),e=clone(event);mutate(c,s,e);const x=evaluate(c,s,e);return !x.valid&&!x.executableReady&&x.decision===null&&x.errors.includes(code);});}
  check("historical date uses earlier version",()=>{const x=evaluate(contract,set,event);return x.valid&&!x.executableReady&&x.decision.value==="enhanced"&&x.decision.provenance.ruleVersion===1;});
  check("exclusive end inclusive successor",()=>{const x=evaluate(contract,set,{...event,date:"2026-07-01"});return x.valid&&x.decision.value==="review"&&x.decision.provenance.ruleVersion===2;});
  check("inclusive start",()=>evaluate(contract,set,{...event,date:"2026-01-01"}).decision.provenance.ruleVersion===1);
  check("open end",()=>evaluate(contract,set,{...event,date:"2099-12-31"}).decision.provenance.ruleVersion===2);
  check("explicit fallback",()=>evaluate(contract,set,{...event,inputs:{...event.inputs,preview:false}}).decision.value==="standard");
  check("highest matching priority",()=>evaluate(contract,set,{...event,inputs:{...event.inputs,mode:"group"}}).decision.provenance.ruleId==="preview");
  check("group alternative",()=>evaluate(contract,set,{...event,inputs:{...event.inputs,mode:"group",preview:false}}).decision.provenance.ruleId==="group");
  check("rule order independent",()=>JSON.stringify(evaluate(contract,set,event))===JSON.stringify(evaluate(contract,{...set,rules:[...set.rules].reverse()},event)));
  check("all provenance pinned",()=>{const p=evaluate(contract,set,event).decision.provenance;return p.ruleSetRevision===7&&p.contractVersion===2&&p.dateBasis==="serviceDate"&&p.date===event.date&&p.priority===10&&p.effectiveStart==="2026-01-01"&&p.effectiveEnd==="2026-07-01";});
  check("immutable independent output",()=>{const s=clone(set),x=evaluate(contract,s,event);s.rules[1].id="changed";return Object.isFrozen(x)&&Object.isFrozen(x.decision)&&Object.isFrozen(x.decision.provenance)&&x.decision.provenance.ruleId==="preview";});
  check("input not mutated",()=>{const before=JSON.stringify([contract,set,event]);evaluate(contract,set,event);return before===JSON.stringify([contract,set,event]);});
  check("explicit null differs from missing",()=>{const s=clone(set);s.rules.push(rule("nullNote",1,"2026-01-01",null,20,[{field:"note",equals:null}],"review"));return evaluate(contract,s,event).decision.provenance.ruleId==="preview"&&evaluate(contract,s,{...event,inputs:{...event.inputs,note:null}}).decision.provenance.ruleId==="nullNote";});
  check("zero and false exact equality",()=>{const s=clone(set);s.rules.push(rule("zeroFalse",1,"2026-01-01",null,20,[{field:"count",equals:0},{field:"preview",equals:false}],"review"));return evaluate(contract,s,{...event,inputs:{...event.inputs,preview:false}}).decision.provenance.ruleId==="zeroFalse";});
  check("decision date contract explicit",()=>evaluate({...contract,dateBasis:"decisionDate"},set,{...event,dateBasis:"decisionDate"}).decision.provenance.dateBasis==="decisionDate");
  check("negative priority is explicit",()=>{const s=clone(set);s.rules=[rule("negative",1,"2026-01-01",null,-1,[],"standard")];return evaluate(contract,s,event).decision.provenance.priority===-1;});
  check("no match when fallback removed",()=>{const s=clone(set);s.rules=s.rules.filter(r=>r.id!=="base");return evaluate(contract,s,{...event,inputs:{...event.inputs,preview:false}}).errors.includes("NO_MATCH");});
  bad("before all effective dates",(_,s,e)=>{e.date="2025-12-31"},"NO_MATCH");
  bad("same priority conflict even same outcome",(_,s)=>{s.rules.push(rule("tie",1,"2026-01-01",null,10,[],"enhanced"));},"AMBIGUOUS_PRIORITY");
  bad("same priority conflict different outcome",(_,s)=>{s.rules.push(rule("tie",1,"2026-01-01",null,10,[],"review"));},"AMBIGUOUS_PRIORITY");
  bad("overlapping versions same id",(_,s)=>{s.rules[2].start="2026-06-30"},"OVERLAPPING_RULE_VERSIONS");
  bad("open prior version overlaps",(_,s)=>{s.rules[1].end=null},"OVERLAPPING_RULE_VERSIONS");
  bad("duplicate rule identity",(_,s)=>{s.rules.push(clone(s.rules[1]));},"DUPLICATE_RULE_VERSION");
  bad("invalid inactive rule rejected",(_,s)=>{s.rules[2].outcome="unknown"},"OUTCOME_TYPE");
  bad("unknown rule property",(_,s)=>{s.rules[0].execute="code"},"RULE_SHAPE");
  bad("invalid start date",(_,s)=>{s.rules[0].start="2026-02-29"},"RULE_SHAPE");
  bad("empty effective interval",(_,s)=>{s.rules[0].end=s.rules[0].start},"RULE_SHAPE");
  bad("reversed interval",(_,s)=>{s.rules[0].end="2025-01-01"},"RULE_SHAPE");
  bad("end omitted",(_,s)=>{delete s.rules[0].end},"RULE_SHAPE");
  bad("fractional priority",(_,s)=>{s.rules[0].priority=0.1},"RULE_SHAPE");
  bad("invalid version",(_,s)=>{s.rules[0].version=0},"RULE_SHAPE");
  bad("invalid rule id",(_,s)=>{s.rules[0].id="a/b"},"RULE_SHAPE");
  bad("unknown condition field",(_,s)=>{s.rules[0].conditions=[{field:"unknown",equals:true}]},"CONDITION_SHAPE");
  bad("condition wrong type",(_,s)=>{s.rules[1].conditions[0].equals="true"},"CONDITION_TYPE");
  bad("condition null on nonnullable",(_,s)=>{s.rules[1].conditions[0].equals=null},"CONDITION_TYPE");
  bad("duplicate condition",(_,s)=>{s.rules[1].conditions.push(clone(s.rules[1].conditions[0]))},"DUPLICATE_CONDITION");
  bad("arbitrary operator not supported",(_,s)=>{s.rules[1].conditions[0].operator="gt"},"CONDITION_SHAPE");
  bad("invalid outcome",(_,s)=>{s.rules[0].outcome=null},"OUTCOME_TYPE");
  bad("wrong date basis",(_,s,e)=>{e.dateBasis="decisionDate"},"EVENT_SHAPE");
  bad("timestamp not business date",(_,s,e)=>{e.date="2026-06-30T00:00:00Z"},"EVENT_SHAPE");
  bad("missing event date",(_,s,e)=>{delete e.date},"EVENT_SHAPE");
  bad("unknown input",(_,s,e)=>{e.inputs.extra=1},"EVENT_INPUTS");
  bad("required input missing",(_,s,e)=>{delete e.inputs.preview},"EVENT_INPUTS");
  bad("no input coercion",(_,s,e)=>{e.inputs.count="0"},"EVENT_INPUTS");
  bad("contract version mismatch",(_,s)=>{s.contractVersion=1},"CONTRACT_VERSION");
  bad("invalid rule set revision",(_,s)=>{s.revision=0},"RULE_SET_SHAPE");
  bad("no production rule set",(_,s)=>{s.scope="production"},"RULE_SET_SHAPE");
  bad("no production contract",c=>{c.scope="production"},"CONTRACT_SHAPE");
  bad("duplicate input",c=>{c.inputs.push(clone(c.inputs[0]))},"DUPLICATE_INPUT");
  bad("structured input held",c=>{c.inputs[0].type="structured"},"CONTRACT_SHAPE");
  bad("optional outcome contract refused",c=>{c.outcome.required=false},"CONTRACT_SHAPE");
  bad("unknown contract date basis",c=>{c.dateBasis="now"},"CONTRACT_SHAPE");
  bad("no empty rule set",(_,s)=>{s.rules=[]},"RULE_SET_SHAPE");
  check("accessor refused without invocation",()=>{const s=clone(set);Object.defineProperty(s.rules[0],"outcome",{enumerable:true,get(){throw Error("invoked");}});return evaluate(contract,s,event).errors.includes("RULE_SHAPE");});
  check("diagnostics never echo arbitrary values",()=>{const s=clone(set);s.rules[2].outcome="synthetic-private-value";const x=evaluate(contract,s,event);return !JSON.stringify(x).includes("synthetic-private-value")&&Object.isFrozen(x.errors);});
  check("inactive malformed condition still fails",()=>{const s=clone(set);s.rules[2].conditions=[{field:"preview",equals:1}];return evaluate(contract,s,event).errors.includes("CONDITION_TYPE");});
  return out;
}
