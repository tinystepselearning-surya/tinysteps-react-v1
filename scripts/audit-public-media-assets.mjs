import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
function walk(dir){
  const out=[];
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,e.name);
    if(e.isDirectory()) out.push(...walk(full));
    else if(e.isFile()&&/\.(mp3|png)$/i.test(e.name)) out.push(full);
  }
  return out;
}
const rows=walk(path.join(root,'public')).sort().map(full=>{
  const bytes=fs.readFileSync(full);
  return {
    path:path.relative(root,full).replaceAll(path.sep,'/'),
    type:/\.mp3$/i.test(full)?'mp3':'png',
    sizeBytes:bytes.length,
    sha256:crypto.createHash('sha256').update(bytes).digest('hex'),
  };
});
const groups=new Map();
for(const row of rows){
  const g=groups.get(row.sha256)||[];
  g.push(row);
  groups.set(row.sha256,g);
}
const duplicates=[...groups.entries()].filter(([,g])=>g.length>1).map(([sha256,g])=>({
  sha256,
  sizeBytes:g[0].sizeBytes,
  paths:g.map(x=>x.path),
  redundantBytes:g[0].sizeBytes*(g.length-1),
})).sort((a,b)=>b.redundantBytes-a.redundantBytes);
const report={
  generatedAt:new Date().toISOString(),
  counts:{
    mp3:rows.filter(r=>r.type==='mp3').length,
    png:rows.filter(r=>r.type==='png').length,
    total:rows.length,
    duplicateGroups:duplicates.length,
    redundantFiles:duplicates.reduce((s,g)=>s+g.paths.length-1,0),
    redundantBytes:duplicates.reduce((s,g)=>s+g.redundantBytes,0),
  },
  files:rows,
  duplicates,
};
const oi=process.argv.indexOf('--output');
if(oi>=0){
  const output=process.argv[oi+1];
  if(!output) throw new Error('--output requires a path');
  fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});
  fs.writeFileSync(path.resolve(output),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify(report.counts,null,2));
