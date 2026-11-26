// TSOS V2 B01-A: pure draft metadata validation; no runtime or cloud dependency.
export function validateRegistry(manifest, readShard, previous) {
  const errors = [];
  const fail = (code, location) => errors.push({code, location});
  const obj = x => x !== null && typeof x === "object" && !Array.isArray(x);
  const str = x => typeof x === "string" && x.trim().length > 0;
  const arr = (x, where) => Array.isArray(x) ? x : (fail("EXPECTED_ARRAY", where), []);
  const integer = x => Number.isSafeInteger(x) && x >= 0;
  const unique = (values, where) => {
    if (new Set(values).size !== values.length) fail("DUPLICATE", where);
  };
  const sortObject = x => Array.isArray(x) ? x.map(sortObject) :
    obj(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k, sortObject(x[k])])) : x;
  const equal = (a, b) => JSON.stringify(sortObject(a)) === JSON.stringify(sortObject(b));
  // Reject non-string membership values before sorting (no implicit coercion).
  const setEqual = (a, b) => a.every(x=>typeof x==="string") && b.every(x=>typeof x==="string") && equal([...a].sort(), [...b].sort());
  const validPath = p => typeof p === "string" && /^domains\/[a-z][a-z0-9-]*\.json$/.test(p);
  const validCode = c => typeof c === "string" && /^[A-Z]{3}$/.test(c);
  const types = new Set(["id","enum","date-only","string","reference","number","boolean","timestamp","legacy-value-unvalidated","integer","structured","string-array","iana-time-zone","string-or-null"]);
  const evidenceTypes = new Set(["source","proposed","candidate-mapping","historical-planner-field"]);
  const requiredText = ["semanticName","definition","requirednessBasis","classification","historyPolicy","readPolicy","writeCommand","validationContract","unknownPolicy"];
  const recordMap = new Map(), itemMap = new Map(), valueMap = new Map(), sharedMap = new Map();
  const pathSet = new Set(), ownerSet = new Set(), collectionSet = new Set();
  const finish = counts => ({
    structurallyValid: errors.length === 0,
    executableReady: false,
    errors: errors.sort((a,b) => a.code < b.code ? -1 : a.code > b.code ? 1 : a.location < b.location ? -1 : a.location > b.location ? 1 : 0),
    counts,
    holds: ["DESIGN_ONLY", "NO_SCHEMA_ADOPTION", "INDEPENDENT_REVIEW_REQUIRED"]
  });
  if (!obj(manifest)) { fail("MANIFEST_SHAPE", "manifest"); return finish({}); }
  if (manifest.formatVersion !== 2 || manifest.registryVersion !== "0.6-draft" ||
      manifest.status !== "design-only; no allocated identifiers or executable dependencies" ||
      manifest.sourcePin !== "701c7ec832dbe9c531964496fa09cd4a4948ddd2" ||
      Object.hasOwn(manifest,"records")) fail("MANIFEST_CONTRACT","manifest");
  if (manifest.idPolicy !== "record code and qualified item ID are proposed reservations only; no reuse after adoption; not document IDs" ||
      manifest.registryAuthority !== "This manifest plus its five owner-domain-grouped shards are the sole editable design registry. No separate master record array. Load every shard for cross-domain validation. Blob SHAs identify this reviewed snapshot; update manifest when shard changes.") fail("MANIFEST_GOVERNANCE","manifest");
  for (const [kind, entries, map] of [["valueSets",manifest.valueSets,valueMap],["sharedFieldSets",manifest.sharedFieldSets,sharedMap]]) {
    for (const [idx,v] of arr(entries,kind).entries()) {
      const where = kind+"["+idx+"]";
      if (!obj(v) || !str(v.id)) { fail("SET_SHAPE",where); continue; }
      if (map.has(v.id)) fail("DUPLICATE_SET",where);
      map.set(v.id,v);
      if (!str(v.evidence)) fail("SET_EVIDENCE",where);
      if (kind === "valueSets") {
        const codes = arr(v.codes,where+".codes");
        if (!Number.isSafeInteger(v.version) || v.version < 1 || !codes.length || codes.some(x=>!str(x))) fail("VALUE_SET_SHAPE",where);
        unique(codes,where+".codes");
      } else {
        const fields = arr(v.fields,where+".fields");
        if (!fields.length || fields.some(f=>!obj(f)||!str(f.name)||!str(f.type)||typeof f.required!=="boolean")) fail("SHARED_FIELD_SHAPE",where);
        unique(fields.map(f=>f?.name),where+".fields");
      }
    }
  }
  for (const [index, entry] of arr(manifest.shards,"shards").entries()) {
    const where = "shards["+index+"]";
    if (!obj(entry) || !validPath(entry.path)) { fail("SHARD_PATH",where); continue; }
    if (pathSet.has(entry.path)) { fail("DUPLICATE_SHARD",where); continue; }
    pathSet.add(entry.path);
    const owners = arr(entry.ownerDomains,where+".ownerDomains");
    const declaredCodes = arr(entry.recordCodes,where+".recordCodes");
    if (!owners.length || owners.some(o=>!str(o)) || !declaredCodes.length || declaredCodes.some(c=>!validCode(c)) ||
        !integer(entry.records) || !integer(entry.items) || (typeof entry.blobSha!=="string" || !/^[a-f0-9]{40}$/.test(entry.blobSha))) fail("SHARD_ENTRY_SHAPE",where);
    unique(owners,where+".ownerDomains");
    unique(declaredCodes,where+".recordCodes");
    for (const owner of owners) { if(ownerSet.has(owner)) fail("DUPLICATE_OWNER_GROUP",where); ownerSet.add(owner); }
    let loaded, shard;
    try { loaded = readShard(entry.path); } catch { fail("SHARD_READ",entry.path); continue; }
    if (!obj(loaded) || typeof loaded.text!=="string") { fail("SHARD_READ",entry.path); continue; }
    if (loaded.blobSha !== entry.blobSha) fail("SHARD_HASH",entry.path);
    try { shard = JSON.parse(loaded.text); } catch { fail("SHARD_JSON",entry.path); continue; }
    if (!obj(shard)) { fail("SHARD_SHAPE",entry.path); continue; }
    if (shard.formatVersion!==1 || shard.registryVersion!==manifest.registryVersion || shard.group!==entry.path.slice(8,-5)) fail("SHARD_VERSION_GROUP",entry.path);
    if (!Array.isArray(shard.ownerDomains) || !setEqual(owners,shard.ownerDomains)) fail("SHARD_OWNER_GROUP",entry.path);
    const records = arr(shard.records,entry.path+".records");
    if (records.length!==entry.records || !setEqual(records.map(r=>r?.code),declaredCodes)) fail("SHARD_RECORD_MEMBERSHIP",entry.path);
    let itemCount = 0;
    for (const [ri,r] of records.entries()) {
      const loc = entry.path+"#"+ri;
      if (!obj(r)||!validCode(r.code)) { fail("RECORD_SHAPE",loc); continue; }
      if (recordMap.has(r.code)) fail("DUPLICATE_RECORD",r.code);
      recordMap.set(r.code,r);
      if (!str(r.name)||!str(r.ownerDomain)||!str(r.recordClass)||!str(r.disposition)||!str(r.sourceReference)) fail("RECORD_METADATA",r.code);
      if (!owners.includes(r.ownerDomain)) fail("RECORD_OWNER",r.code);
      if (r.lifecycle!=="proposed" || r.detailStatus!=="seed") fail("PREMATURE_ADOPTION",r.code);
      if (r.fieldSet!==null && !sharedMap.has(r.fieldSet)) fail("SHARED_FIELD_REFERENCE",r.code);
      if (!obj(r.storage) || !str(r.storage.collectionCandidate)||!str(r.storage.sourceEvidence)||r.storage.liveVerified!==false) fail("STORAGE_CONTRACT",r.code);
      else {
        if(collectionSet.has(r.storage.collectionCandidate)) fail("DUPLICATE_COLLECTION_CANDIDATE",r.code);
        collectionSet.add(r.storage.collectionCandidate);
      }
      const items = arr(r.items,r.code+".items");
      if (!items.length) fail("EMPTY_RECORD",r.code);
      itemCount+=items.length;
      unique(items.map(i=>i?.semanticName),r.code+".semanticName");
      for (const [idx,i] of items.entries()) {
        const iloc = r.code+"["+idx+"]";
        if (!obj(i)||typeof i.itemId!=="string"||!new RegExp("^"+r.code+"-\\d{4}$").test(i.itemId)) { fail("ITEM_ID",iloc); continue; }
        if (itemMap.has(i.itemId)) fail("DUPLICATE_ITEM",i.itemId);
        itemMap.set(i.itemId,i);
        if (requiredText.some(k=>!str(i[k])) || (typeof i.semanticName!=="string" || !/^[A-Za-z][A-Za-z0-9]*$/.test(i.semanticName)) ||
            !types.has(i.dataType)||!evidenceTypes.has(i.evidence)||
            !["1","0..1"].includes(i.cardinality)||typeof i.nullable!=="boolean"||
            (i.dataType==="string-or-null"&&!i.nullable)) fail("ITEM_SHAPE",i.itemId);
        if (i.lifecycle!=="proposed") fail("PREMATURE_ADOPTION",i.itemId);
        if (i.ownerDomain!==r.ownerDomain) fail("ITEM_OWNER",i.itemId);
        if (["source","candidate-mapping","historical-planner-field"].includes(i.evidence) &&
            (!str(i.sourceField)||!str(i.sourceRecord)||!str(i.storageFieldCandidate))) fail("SOURCE_BINDING",i.itemId);
        if (i.evidence==="proposed" && (i.sourceField!==null||i.sourceRecord!==null)) fail("SOURCE_BINDING",i.itemId);
        if (i.storageFieldCandidate!==null && !str(i.storageFieldCandidate)) fail("STORAGE_FIELD_SHAPE",i.itemId);
        const inherited=sharedMap.get(r.fieldSet);
        if (Array.isArray(inherited?.fields) && inherited.fields.some(f=>obj(f)&&str(f.name)&&
            (f.name===i.semanticName||f.name===i.storageFieldCandidate))) fail("INHERITED_FIELD_COLLISION",i.itemId);
        if (i.valueSet!==null && (!valueMap.has(i.valueSet)||i.dataType!=="enum")) fail("VALUE_SET_REFERENCE",i.itemId);
        if (i.sourceValueSet!=null && !valueMap.has(i.sourceValueSet)) fail("SOURCE_VALUE_SET_REFERENCE",i.itemId);
        if (i.dataType==="enum" && i.valueSet===null && !(i.itemId==="ENR-1004" && i.sourceValueSet==="legacyEnrollmentStatus")) fail("ENUM_WITHOUT_SET",i.itemId);
        if ((i.dataType==="reference") !== (typeof i.reference==="string" && i.reference.length>0) ||
            (i.dataType!=="reference" && i.reference!==null)) fail("REFERENCE_SHAPE",i.itemId);
      }
    }
    if (itemCount!==entry.items) fail("SHARD_ITEM_COUNT",entry.path);
  }
  if (pathSet.size!==5) fail("SHARD_COUNT","manifest");
  for (const i of itemMap.values()) {
    if (i.dataType!=="reference"||typeof i.reference!=="string") continue;
    const poly=i.reference.startsWith("polymorphic:");
    const targets=poly?i.reference.slice(12).split("|"):[i.reference];
    if (poly && (targets.length<2||new Set(targets).size!==targets.length)) fail("REFERENCE_SHAPE",i.itemId);
    for (const code of targets) {
      if (code==="null"&&poly&&i.nullable) continue;
      if (!validCode(code)||!recordMap.has(code)) fail("UNKNOWN_REFERENCE",i.itemId);
    }
  }
  const items=[...itemMap.values()];
  const counts={records:recordMap.size,detailedRecords:[...recordMap.values()].filter(r=>Array.isArray(r.items)&&r.items.length).length,items:itemMap.size,valueSets:valueMap.size,sourceInterfaceFields:items.filter(i=>i.evidence==="source").length,historicalPlannerFields:items.filter(i=>i.evidence==="historical-planner-field").length,legacyValueUnvalidated:items.filter(i=>i.dataType==="legacy-value-unvalidated").length,structuredFields:items.filter(i=>i.dataType==="structured").length};
  if (!equal(counts,manifest.counts)) fail("MANIFEST_COUNTS","manifest");
  const pin={commit:"a743ece8566013e281d7ab1ad7dfceb6c74e5ae2",path:"docs/architecture/registry/TSOS_V2_MASTER_RECORD_ITEM_REGISTRY_DRAFT.json",registryVersion:"0.5-draft",recordCount:129,itemCount:879};
  if(!equal(manifest.previousSnapshot,pin)) fail("PREVIOUS_PIN","manifest.previousSnapshot");
  let prior;
  if (!obj(previous)||previous.blobSha!=="7aff7de8bf9efbc2cfc7b26d4b550cf91567b324"||typeof previous.text!=="string") fail("PREVIOUS_HASH","previous");
  else {
    try { prior=JSON.parse(previous.text); } catch { fail("PREVIOUS_JSON","previous"); }
    if (!obj(prior)||prior.registryVersion!==pin.registryVersion||prior.sourcePin!==manifest.sourcePin||!Array.isArray(prior.records)) fail("PREVIOUS_SHAPE","previous");
    else {
      let priorCount=0;
      for (const r of prior.records) {
        if (!obj(r)||!Array.isArray(r.items)) { fail("PREVIOUS_SHAPE","previous.records"); continue; }
        const next=recordMap.get(r.code);
        if (!next||next.name!==r.name||next.ownerDomain!==r.ownerDomain) fail("PRIOR_RECORD_CHANGED",String(r.code));
        // Exact v0.5 -> reviewed v0.6 profile seed exceptions (M04, revision 31).
        // All other prior record-level metadata must remain identical.
        const metadata = record => Object.fromEntries(Object.entries(record).filter(([key])=>key!=="items"));
        const expected=metadata(r);
        if (["CNT","PLC","LDT","FPR","PPR","LPP","APR","SPR","LRM","LPV"].includes(r.code)) {
          expected.sourceReference="scripts/migrations/wave1-identity-profile-retirement-lib.mjs";
          expected.detailStatus="seed";
          if (["CNT","PLC","LDT","SPR","LRM","LPV"].includes(r.code)) expected.fieldSet="profileMigrationAuditV1";
        }
        if (next && !equal(expected,metadata(next))) fail("PRIOR_RECORD_METADATA_CHANGED",String(r.code));
        priorCount+=r.items.length;
        for (const i of r.items) if (!obj(i)||!equal(i,itemMap.get(i.itemId))) fail("PRIOR_ITEM_CHANGED",String(i?.itemId));
      }
      if (prior.records.length!==pin.recordCount||priorCount!==pin.itemCount) fail("PREVIOUS_COUNTS","previous");
      for (const v of arr(prior.valueSets,"previous.valueSets")) if (!obj(v)||!equal(v,valueMap.get(v.id))) fail("PRIOR_VALUE_SET_CHANGED",String(v?.id));
      for (const v of arr(prior.sharedFieldSets,"previous.sharedFieldSets")) if (!obj(v)||!equal(v,sharedMap.get(v.id))) fail("PRIOR_SHARED_SET_CHANGED",String(v?.id));
    }
  }
  return finish(counts);
}
