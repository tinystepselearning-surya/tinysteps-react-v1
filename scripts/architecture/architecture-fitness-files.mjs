// Controlled checkout only; no external input path supplied by CLI, no network.
import {lstatSync,readdirSync,readFileSync,realpathSync} from "node:fs";
import {join,resolve} from "node:path";
import {createHash} from "node:crypto";
import {checkInventory} from "./architecture-fitness-core.mjs";
export function blobSha(bytes){return createHash("sha1").update("blob "+bytes.length+"\0","utf8").update(bytes).digest("hex");}
export function scanArchitecture(root){
  const entries=[],base=realpathSync(resolve(root));
  function visit(rel,depth){
    if(depth>5||entries.length>=1000)throw Error("inventory limit");
    const full=join(base,rel),s=lstatSync(full);
    if(s.isSymbolicLink()||!s.isDirectory()&&!s.isFile()){entries.push({path:rel,kind:"unsafe",blobSha:null});return;}
    if(s.isDirectory()){
      const children=readdirSync(full).sort();
      if(!children.length)entries.push({path:rel,kind:"empty-directory",blobSha:null});
      if(children.length>1000)throw Error("inventory limit");
      for(const child of children)visit(rel+"/"+child,depth+1);
      return;
    }
    if(s.size>4*1024*1024)throw Error("file limit");
    const bytes=readFileSync(full);
    if(bytes.length>4*1024*1024)throw Error("file limit");
    entries.push({path:rel,kind:"regular",blobSha:blobSha(bytes)});
  }
  // Reject symlink ancestors below canonical root before descending.
  for(const rel of ["scripts","docs","docs/architecture"])if(!lstatSync(join(base,rel)).isDirectory()||lstatSync(join(base,rel)).isSymbolicLink())throw Error("unsafe ancestor");
  visit("scripts/architecture",0);visit("docs/architecture/registry",0);
  return checkInventory(entries);
}
