// B01-B.5: offline accepted-file integrity and synthetic freshness planning, not runtime certification.
export const PINNED=Object.freeze({
  "docs/architecture/registry/TSOS_V2_MASTER_RECORD_ITEM_DICTIONARY_DESIGN.md": "5a72f1da84335936844130e988d1e77b6173d89c",
  "docs/architecture/registry/TSOS_V2_MASTER_RECORD_ITEM_REGISTRY_DRAFT.json": "7f0464dfb6b79a22ddfa43d412081b13930f04c3",
  "docs/architecture/registry/domains/academic-delivery.json": "3d661e8dd3bc09feed5b666a7ebf7fc0648f8601",
  "docs/architecture/registry/domains/commerce-operations.json": "d5a8f9bf9dae3c3f875a243522bb3c782784be32",
  "docs/architecture/registry/domains/identity-institutional.json": "f4f0efc8e54b749148f5b54e1b1d37ee807e5ee1",
  "docs/architecture/registry/domains/learning-resources.json": "c20fbafee877e47fea59a25f2033e19d9213900a",
  "docs/architecture/registry/domains/platform.json": "1f116526d1bbd9017dbcd26aaed0277766e5079d",
  "scripts/architecture/business-rule-cases.mjs": "401744dd630521b535f70c8f7344a6302c2a31b0",
  "scripts/architecture/business-rule-core.mjs": "9d852c05b20a8ee9cf1bbac962db342ffa2fca9b",
  "scripts/architecture/business-rule.node-test.mjs": "26a68862eebc756b27ddd92ae0ac26c2ccc573c2",
  "scripts/architecture/config-resolver-cases.mjs": "bf7f8601862ff9325be056c971629093e060c005",
  "scripts/architecture/config-resolver-core.mjs": "2b27b2a9636079864901d63fb5ec5d092ee436d9",
  "scripts/architecture/config-resolver.node-test.mjs": "83108ba76715c2aa83dd6655d50889fe14e9899d",
  "scripts/architecture/registry-validator-cases.mjs": "1e183810763c29eddc0fb77683384874b0352520",
  "scripts/architecture/registry-validator-core.mjs": "addc239de8e07c4a856d2dc145745065b1e3b776",
  "scripts/architecture/registry-validator-files.mjs": "4877f1c5717769b7c4799f816c1ba9659539fad4",
  "scripts/architecture/registry-validator.node-test.mjs": "842116ffedb6674f7bc8b5bda80d67dbcc9fb4af",
  "scripts/architecture/schema-evolution-cases.mjs": "f474437b0e04f60bb3efa4b3b5359163d32368ef",
  "scripts/architecture/schema-evolution-core.mjs": "126be278388e74524ab79e262999146564dc061a",
  "scripts/architecture/schema-evolution.node-test.mjs": "1cbb7e21c05484562e6e3004d08b7f5dc49ad642",
  "scripts/architecture/typed-schema-cases.mjs": "5c9c17b154012e70bdd2ce571d4f359019611d81",
  "scripts/architecture/typed-schema-core.mjs": "034e0187555dee29a355aa6ea6761e0a1ab68ac4",
  "scripts/architecture/typed-schema.node-test.mjs": "72f9a3c09d4a53b49215813dcde5f15250d6bab4",
  "scripts/architecture/validate-registry.mjs": "c489e306e7fa0dbf77ec266fcbd988a32a004bd5"
});
export const CANDIDATE=Object.freeze(["scripts/architecture/architecture-fitness-core.mjs","scripts/architecture/architecture-fitness-files.mjs","scripts/architecture/architecture-fitness-cases.mjs","scripts/architecture/architecture-fitness.node-test.mjs","scripts/architecture/verify-architecture.mjs"]);
export const SUITES=Object.freeze(["registry-validator.node-test.mjs","typed-schema.node-test.mjs","config-resolver.node-test.mjs","business-rule.node-test.mjs","schema-evolution.node-test.mjs","architecture-fitness.node-test.mjs"]);
export const EXPECTED=Object.freeze([...Object.keys(PINNED),...CANDIDATE].sort());
const own=(x,k)=>Object.hasOwn(x,k);
const obj=x=>x!==null&&typeof x==="object"&&[Object.prototype,null].includes(Object.getPrototypeOf(x))&&Reflect.ownKeys(x).every(k=>typeof k==="string"&&Object.getOwnPropertyDescriptor(x,k).enumerable&&own(Object.getOwnPropertyDescriptor(x,k),"value"));
const arr=x=>Array.isArray(x)&&x.length<=1000&&Reflect.ownKeys(x).length===x.length+1&&Array.from({length:x.length},(_,i)=>Object.getOwnPropertyDescriptor(x,String(i))).every(d=>d&&d.enumerable&&own(d,"value"));
const shape=(x,keys)=>obj(x)&&Object.keys(x).length===keys.length&&keys.every(k=>own(x,k));
const text=x=>typeof x==="string"&&x.trim().length>0&&x.length<=500;
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const result=errors=>Object.freeze({valid:!errors.length,executableReady:false,errors:Object.freeze([...new Set(errors)].sort())});
export function checkInventory(entries){
  const errors=[],seen=new Set();
  if(!arr(entries))return result(["INVENTORY_SHAPE"]);
  for(const e of entries){
    if(!shape(e,["path","kind","blobSha"])||typeof e.path!=="string"){errors.push("ENTRY_SHAPE");continue;}
    if(!EXPECTED.includes(e.path)){errors.push("UNEXPECTED_FILE");continue;}
    if(seen.has(e.path))errors.push("DUPLICATE_FILE");
    seen.add(e.path);
    if(e.kind!=="regular"){errors.push("UNSAFE_FILE");continue;}
    if(typeof e.blobSha!=="string"||!(/^[0-9a-f]{40}$/.test(e.blobSha)))errors.push("DIGEST_SHAPE");
    else if(own(PINNED,e.path)&&e.blobSha!==PINNED[e.path])errors.push("PIN_MISMATCH");
  }
  if(EXPECTED.some(p=>!seen.has(p)))errors.push("MISSING_FILE");
  return result(errors);
}
const planKeys=["scope","dataset","query","action","tier","purpose","authority","authorization","cutoff","budget","projectionReuse","invalidation","dependencies","freshnessDisplay","errorDisplay","reconciliation","rollback","costEvidence","readAmplification","liveRationale","rawFallback","fabricatedZeros","operationalAuthorization"];
export function checkFreshnessPlan(p){
  const errors=[];
  if(!shape(p,planKeys)||p.scope!=="synthetic-only")return result(["PLAN_SHAPE"]);
  if(!["dataset","query","action","authority","authorization","projectionReuse","invalidation","freshnessDisplay","errorDisplay","reconciliation","rollback"].every(k=>text(p[k])))errors.push("REQUIRED_DECLARATION");
  if(!["current","t-1"].includes(p.tier)||!["operational","reporting"].includes(p.purpose))errors.push("TIER_SHAPE");
  if(!shape(p.budget,["documentReads","indexReads","writes"])||!Object.values(p.budget).every(integer))errors.push("BUDGET_SHAPE");
  if(!arr(p.dependencies)||!p.dependencies.every(text)||new Set(p.dependencies).size!==p.dependencies.length)errors.push("DEPENDENCIES_SHAPE");
  if(!["pending","declared"].includes(p.costEvidence)||!["pending","declared"].includes(p.readAmplification))errors.push("EVIDENCE_STATUS");
  if(typeof p.rawFallback!=="boolean"||typeof p.fabricatedZeros!=="boolean"||typeof p.operationalAuthorization!=="boolean")errors.push("FLAG_SHAPE");
  if(p.fabricatedZeros!==false)errors.push("FABRICATED_ZERO");
  if(p.tier==="current"){
    if(p.cutoff!==null||!text(p.liveRationale))errors.push("CURRENT_CONTRACT");
  }
  if(p.tier==="t-1"){
    if(!shape(p.cutoff,["basis","timeZone"])||p.cutoff.basis!=="prior-local-day"||!text(p.cutoff.timeZone))errors.push("REPORTING_CUTOFF");
    else {try{if(!(/^[A-Za-z][A-Za-z0-9_+.-]*(?:\/[A-Za-z0-9_+.-]+)+$/.test(p.cutoff.timeZone)||p.cutoff.timeZone==="UTC"))throw Error();new Intl.DateTimeFormat("en",{timeZone:p.cutoff.timeZone});}catch{errors.push("REPORTING_CUTOFF");}}
    if(p.purpose!=="reporting"||p.operationalAuthorization!==false)errors.push("STALE_OPERATIONAL_AUTHORITY");
    if(p.rawFallback!==false)errors.push("REPORTING_RAW_FALLBACK");
    if(p.liveRationale!==null)errors.push("REPORTING_LIVE_RATIONALE");
  }
  return result(errors);
}
