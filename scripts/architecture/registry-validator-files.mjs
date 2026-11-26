// B01-A offline adapter. Reads metadata only; no network or application imports.
import {readFileSync,lstatSync,realpathSync} from "node:fs";
import {resolve,dirname,join,relative,isAbsolute,basename} from "node:path";
import {createHash} from "node:crypto";
import {TextDecoder} from "node:util";
import {validateRegistry} from "./registry-validator-core.mjs";

export const MANIFEST_NAME = "TSOS_V2_MASTER_RECORD_ITEM_REGISTRY_DRAFT.json";
export function gitBlobSha(bytes) {
  return createHash("sha1").update("blob "+bytes.length+"\0","utf8").update(bytes).digest("hex");
}
function readMetadata(path) {
  const info=lstatSync(path);
  if (!info.isFile() || info.isSymbolicLink() || info.size>4*1024*1024) throw Error("unsafe metadata file");
  const bytes=readFileSync(path);
  if(bytes.length>4*1024*1024) throw Error("oversized metadata file");
  return {text:new TextDecoder("utf-8",{fatal:true,ignoreBOM:true}).decode(bytes),blobSha:gitBlobSha(bytes)};
}
export function validateRegistryFiles(root, previousFile) {
  const canonicalRoot=realpathSync(resolve(root));
  if(!lstatSync(canonicalRoot).isDirectory()) throw Error("invalid registry root");
  const manifestPath=join(canonicalRoot,MANIFEST_NAME);
  const manifest=JSON.parse(readMetadata(manifestPath).text);
  const previous=readMetadata(resolve(previousFile));
  const readShard=path=>{
    if(typeof path!=="string" || !/^domains\/[a-z][a-z0-9-]*\.json$/.test(path)) throw Error("unsafe shard path");
    const candidate=resolve(canonicalRoot,path);
    const parent=dirname(candidate);
    if(lstatSync(parent).isSymbolicLink()||!lstatSync(parent).isDirectory()) throw Error("unsafe shard directory");
    const resolved=realpathSync(candidate);
    const rel=relative(canonicalRoot,resolved);
    if(rel!==path || isAbsolute(rel) || basename(resolved)!==basename(candidate)) throw Error("shard escaped registry root");
    return readMetadata(candidate);
  };
  return validateRegistry(manifest,readShard,previous);
}
