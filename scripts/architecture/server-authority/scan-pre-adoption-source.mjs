// Gate B pre-adoption evidence collector: immutable Git objects only.
// No Firebase, credentials, network, checkout mutation, or production operation.
// Literal/fragment scans and candidate path-construction inventory are evidence,
// not an automatic proof of absence of computed paths or runtime compatibility.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const refs=Object.freeze([
  {label:'main',sha:'95b44babd7f3132b212b781eabeec000fced14c8',expectedBlobs:3417},
  {label:'approved-scope',sha:'0da0f5f1bdccab2b2dc5dacf8ce2b3beb1053274',expectedBlobs:3536}
]);
const names=Object.freeze(['tsosV2Tenants','tsosV2OrganisationTenantBindings','tsosV2TenantMemberships','tsosV2OrganisationMemberships','tsosV2AuthorityGrants','tsosV2AuthorityFences','tsosV2ActionRoutes','tsosV2Campuses','tsosV2OperationReceipts']);
const fragments=['tsos','OrganisationTenantBindings','AuthorityGrants','AuthorityFences','ActionRoutes','OperationReceipts','TenantMemberships','OrganisationMemberships','campus.create','campusCreator'];
const legacy=['authIdentities','people','organisations','roleAssignments','organisationMemberships','authAccessReadModels','IDENTITY_COLLECTIONS','loadCurrentAuthAccessPrincipal','buildAuthIdentityId','ensureSchoolReader','ensureSchoolManager','ensureCanonicalAdmin'];
const constructors='(^|[^[:alnum:]_])(collection(Group)?|doc|document|listCollections|listDocuments|recursiveDelete|batchWrite|bulkWriter|runTransaction)[[:space:]]*[(]|match[[:space:]]+/';
const sort=xs=>[...new Set(xs)].sort();
function git(args,allowNoMatch=false){
  const r=spawnSync('git',args,{encoding:'utf8',maxBuffer:32*1024*1024,timeout:120000,env:{...process.env,GIT_OPTIONAL_LOCKS:'0',LC_ALL:'C'}});
  assert.ok(!r.error&&!r.signal&&(r.status===0||allowNoMatch&&r.status===1), 'GIT_READ_FAILED '+args[0]);
  assert.equal(r.stderr.trim(),'','GIT_READ_DIAGNOSTIC '+args[0]);
  if(r.status===1)assert.equal(r.stdout,'','UNEXPECTED_NO_MATCH_OUTPUT');
  return r.stdout;
}
function records(value){if(value==='')return [];assert.ok(value.endsWith('\0'),'INVALID_NUL_OUTPUT');return value.slice(0,-1).split('\0');}
function inspect({label,sha,expectedBlobs}){
  assert.equal(git(['rev-parse',sha+'^{commit}']).trim(),sha);
  const raw=git(['ls-tree','-r','-z','--full-tree',sha]);
  const files=new Map();
  for(const row of records(raw)){
    const tab=row.indexOf('\t');assert.ok(tab>0);
    const header=row.slice(0,tab),path=row.slice(tab+1);
    assert.match(header,/^100(?:644|755) blob [a-f0-9]{40}$/,'UNCLASSIFIED_NONREGULAR_TREE_ENTRY');
    assert.ok(path&&!files.has(path));files.set(path,header.split(' ')[2]);
  }
  assert.equal(files.size,expectedBlobs,'UNEXPECTED_TREE_SIZE');
  function grep(patterns,regex=false){
    const matches=records(git(['grep','--no-textconv','--no-recurse-submodules','--full-name','-a','-i','-l','-z',regex?'-E':'-F',...patterns.flatMap(s=>['-e',s]),sha,'--'],true));
    return sort(matches.map(row=>{
      assert.ok(row.startsWith(sha+':'),'UNEXPECTED_TREE_PREFIX');
      const path=row.slice(sha.length+1);assert.ok(files.has(path),'UNKNOWN_MATCH_PATH');return path;
    }));
  }
  const literal=grep(names);
  const pathNameMatches=sort([...files.keys()].filter(path=>names.some(n=>path.toLowerCase().includes(n.toLowerCase()))));
  const namespaceAndFragments=grep(fragments);
  const legacyReferences=grep(legacy);
  const constructorCandidates=grep([constructors],true).filter(path=>!path.startsWith('docs/')&&!/\.md$/i.test(path));
  const lfsPointers=grep(['version https://git-lfs.github.com/spec/v1']);
  const evidencePaths=sort([...literal,...pathNameMatches,...namespaceAndFragments,...legacyReferences,...constructorCandidates,...lfsPointers]);
  return {label,sha,trackedBlobs:files.size,treeListingSha256:createHash('sha256').update(raw).digest('hex'),literal,pathNameMatches,namespaceAndFragments,legacyReferences,constructorCandidates,lfsPointers,evidenceBlobs:Object.fromEntries(evidencePaths.map(path=>[path,files.get(path)]))};
}
assert.equal(process.argv.length,2,'NO_ARGUMENTS');
const scans=refs.map(inspect);
process.stdout.write(JSON.stringify({format:'tsos-gate-b-source-scan-1',scope:'pinned tracked blobs; no checkout or production access',names,limitations:['literal byte scan does not inspect compressed or external artifacts','computed path candidates require source classification; no collision verdict inferred','not deployed Rules or live collection evidence'],scans},null,2)+'\n');
