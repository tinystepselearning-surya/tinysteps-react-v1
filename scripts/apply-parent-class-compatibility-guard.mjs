import fs from 'node:fs';

const path = 'src/pages/parent/ParentDashboard.tsx';
let source = fs.readFileSync(path, 'utf8');
const before = `      if (\n        parentClassSessionDateBounds\n        && shouldRunParentLegacySessionFallback(map.size)\n      ) {`;
const after = `      if (\n        parentClassSessionDateBounds\n        && (\n          shouldRunParentLegacySessionFallback(snapA?.size ?? 0)\n          || snapB === null\n        )\n      ) {`;
const first = source.indexOf(before);
if (first < 0) throw new Error('Missing expected compatibility fallback condition');
if (source.indexOf(before, first + before.length) >= 0) throw new Error('Duplicate compatibility fallback condition');
source = source.slice(0, first) + after + source.slice(first + before.length);
fs.writeFileSync(path, source);
console.log('Hardened parent class-session compatibility fallback.');
