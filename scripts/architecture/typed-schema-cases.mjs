// All fixtures synthetic; no production data or runtime imports.
export function typedSchemaCases(validate){
  const fields=[
    {name:"id",type:"id",required:true,nullable:false},
    {name:"name",type:"string",required:true,nullable:false},
    {name:"area",type:"enum",required:true,nullable:false,values:["Phonics","Grammar","Speaking"]},
    {name:"level",type:"number",required:true,nullable:false},
    {name:"description",type:"string",required:true,nullable:false},
    {name:"active",type:"boolean",required:true,nullable:false},
    {name:"count",type:"integer",required:true,nullable:false},
    {name:"day",type:"date-only",required:true,nullable:false},
    {name:"topics",type:"string-array",required:true,nullable:false},
    {name:"zone",type:"iana-time-zone",required:true,nullable:false},
    {name:"course",type:"reference",required:false,nullable:true,target:"CRS"},
    {name:"note",type:"string-or-null",required:false,nullable:true}
  ];
  const schema={scope:"synthetic-only",version:1,fields};
  const record={id:"synthetic-1",name:"Synthetic",area:"Phonics",level:1,description:"",active:false,count:0,day:"2024-02-29",topics:["a"],zone:"Asia/Kolkata"};
  const clone=x=>JSON.parse(JSON.stringify(x));
  const out=[];
  function check(name,fn){try{if(!fn())throw Error("assertion failed");out.push({name,pass:true});}catch(e){out.push({name,pass:false,error:String(e.message)});}}
  function bad(name,mutate,code){check(name,()=>{const s=clone(schema),r=clone(record);const v=mutate(s,r);const x=validate(s,r,v===undefined?1:v);return !x.valid&&!x.executableReady&&x.errors.some(e=>e.code===code);});}
  check("valid synthetic shape",()=>{const x=validate(schema,record,1);return x.valid&&!x.executableReady;});
  check("explicit optional null and empty array",()=>validate(schema,{...record,course:null,note:null,topics:[]},1).valid);
  check("syntactic reference only",()=>validate(schema,{...record,course:"unresolved-reference"},1).valid);
  bad("required absent",(_,r)=>{delete r.name},"REQUIRED_FIELD");
  bad("required null",(_,r)=>{r.name=null},"NULL_NOT_ALLOWED");
  bad("explicit undefined",(_,r)=>{r.note=undefined},"VALUE_TYPE");
  bad("unknown field",(_,r)=>{r.extra=true},"UNKNOWN_FIELD");
  bad("numeric coercion refused",(_,r)=>{r.level="1"},"VALUE_TYPE");
  bad("boolean coercion refused",(_,r)=>{r.active=0},"VALUE_TYPE");
  bad("infinite number",(_,r)=>{r.level=Infinity},"VALUE_TYPE");
  bad("NaN",(_,r)=>{r.level=NaN},"VALUE_TYPE");
  bad("fractional integer",(_,r)=>{r.count=1.1},"VALUE_TYPE");
  bad("unsafe integer",(_,r)=>{r.count=Number.MAX_SAFE_INTEGER+1},"VALUE_TYPE");
  bad("enum wrong case",(_,r)=>{r.area="phonics"},"VALUE_TYPE");
  bad("blank id",(_,r)=>{r.id=" "},"VALUE_TYPE");
  bad("invalid date",(_,r)=>{r.day="2025-02-29"},"VALUE_TYPE");
  bad("invalid century leap day",(_,r)=>{r.day="1900-02-29"},"VALUE_TYPE");
  bad("invalid month",(_,r)=>{r.day="2024-13-01"},"VALUE_TYPE");
  bad("date timestamp not date only",(_,r)=>{r.day="2024-02-29T00:00:00Z"},"VALUE_TYPE");
  bad("mixed array",(_,r)=>{r.topics=["a",1]},"VALUE_TYPE");
  bad("sparse array",(_,r)=>{r.topics=new Array(1)},"VALUE_TYPE");
  bad("invalid timezone",(_,r)=>{r.zone="Asia/Nowhere"},"VALUE_TYPE");
  bad("offset not named timezone",(_,r)=>{r.zone="+05:30"},"VALUE_TYPE");
  bad("wrong reference shape",(_,r)=>{r.course={id:"x"}},"VALUE_TYPE");
  bad("wrong version",()=>2,"VERSION_MISMATCH");
  bad("no coercion for version",()=>"1","VERSION_MISMATCH");
  bad("schema cannot activate runtime",s=>{s.scope="production"},"SCHEMA_SHAPE");
  bad("schema unknown key",s=>{s.runtime=true},"SCHEMA_SHAPE");
  bad("duplicate field",s=>{s.fields.push(s.fields[0])},"DUPLICATE_FIELD");
  bad("legacy hold",s=>{s.fields[0].type="legacy-value-unvalidated"},"HELD_TYPE");
  bad("structured hold",s=>{s.fields[0].type="structured"},"HELD_TYPE");
  bad("timestamp hold",s=>{s.fields[0].type="timestamp"},"HELD_TYPE");
  bad("unsupported type",s=>{s.fields[0].type="any"},"UNKNOWN_TYPE");
  bad("invalid field name",s=>{s.fields[0].name="constructor"},"FIELD_SHAPE");
  bad("enum duplicate",s=>{s.fields[2].values.push("Phonics")},"ENUM_CONTRACT");
  bad("enum empty",s=>{s.fields[2].values=[]},"ENUM_CONTRACT");
  bad("missing reference target",s=>{delete s.fields[10].target},"REFERENCE_CONTRACT");
  bad("nullable contract mismatch",s=>{s.fields[11].nullable=false},"FIELD_NULLABILITY");
  bad("unexpected values",s=>{s.fields[0].values=["x"]},"UNEXPECTED_ENUM");
  bad("unexpected target",s=>{s.fields[0].target="CRS"},"UNEXPECTED_REFERENCE");
  check("nonplain record refused",()=>validate(schema,Object.create(record),1).errors.some(e=>e.code==="RECORD_SHAPE"));
  check("accessor rejected without execution",()=>{const r={...record};Object.defineProperty(r,"name",{enumerable:true,get(){throw Error("executed");}});return validate(schema,r,1).errors.some(e=>e.code==="RECORD_SHAPE");});
  check("deterministic and no mutation",()=>{const s=clone(schema),r={...record,extra:true,count:"0"};const before=JSON.stringify([s,r]);return JSON.stringify(validate(s,r,1))===JSON.stringify(validate(s,r,1))&&before===JSON.stringify([s,r]);});
  return out;
}
