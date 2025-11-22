#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src');
const exts = ['.js', '.jsx', '.ts', '.tsx'];

function walk(dir) {
  const res = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      res.push(...walk(full));
    } else if (/\.(js|jsx|ts|tsx)$/.test(name)) {
      res.push(full);
    }
  }
  return res;
}

function tryResolve(baseFile, spec) {
  // spec like ./Foo or ../bar/Baz
  const baseDir = path.dirname(baseFile);
  let p = path.resolve(baseDir, spec);
  // try file with extensions
  for (const e of exts) {
    if (fs.existsSync(p + e)) return p + e;
  }
  // try as index file in directory
  for (const e of exts) {
    if (fs.existsSync(path.join(p, 'index' + e))) return path.join(p, 'index' + e);
  }
  return null;
}

const files = walk(SRC);
const importRE = /^\s*import\s+(.+)\s+from\s+['"](\.{1,2}\/[^'\"]+)['"];?/;
const namedRE = /^{\s*([\w\s,]+)\s*}$/;

const mismatches = [];

for (const file of files) {
  const txt = fs.readFileSync(file, 'utf8');
  const lines = txt.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = importRE.exec(line);
    if (!m) continue;
    const importPart = m[1].trim();
    const spec = m[2];
    if (!spec.startsWith('.') ) continue;
    const resolved = tryResolve(file, spec);
    if (!resolved) continue;
    const targetTxt = fs.readFileSync(resolved, 'utf8');
    const hasDefault = /export\s+default\s+/m.test(targetTxt) || /export\s*\{\s*default\s*\}/m.test(targetTxt) || /export\s+\*\s+from/m.test(targetTxt);
    const namedImports = importPart.startsWith('{') || importPart.includes('{');
    const defaultImport = !namedImports && !importPart.startsWith('*');
    // also handle import {A as B} and multi
    let namedList = [];
    if (namedImports) {
      const nm = importPart.match(/\{([^}]+)\}/);
      if (nm) namedList = nm[1].split(',').map(x => x.trim().split(' as ')[0].trim());
    }
    // detect named exports in target
    // Detect named exports including 'export const', 'export function', 'export type', 'export interface', and 'export { A, B }'
    const namedExports = Array.from(new Set((targetTxt.match(/export\s+(?:async\s+)?(?:const|function|let|class|type|interface)\s+([A-Za-z0-9_]+)/g) || []).map(x => x.replace(/export\s+(?:async\s+)?(?:const|function|let|class|type|interface)\s+/, ''))));
    const reExportNamed = Array.from(new Set((targetTxt.match(/export\s*\{([^}]+)\}/g) || []).flatMap(x => {
      const m = /export\s*\{([^}]+)\}/.exec(x); if (!m) return []; return m[1].split(',').map(s=>s.trim().split(' as ')[0]);
    })));
    const allNamedExports = Array.from(new Set([...namedExports, ...reExportNamed]));

    if (defaultImport && !hasDefault) {
      mismatches.push({ file, line: i+1, importLine: line.trim(), spec, resolved, issue: 'imports default but target has no default export' });
    }
    if (namedList.length > 0) {
      const missing = namedList.filter(n => !allNamedExports.includes(n));
      if (missing.length > 0) {
        mismatches.push({ file, line: i+1, importLine: line.trim(), spec, resolved, issue: `imports named {${namedList.join(',')}} but target missing ${missing.join(',')}` });
      }
    }
  }
}

if (mismatches.length === 0) {
  console.log('No import/export mismatches detected.');
  process.exit(0);
}
console.log('Found import/export mismatches:');
for (const m of mismatches) {
  console.log('\n---');
  console.log(`File: ${m.file}:${m.line}`);
  console.log(`  ${m.importLine}`);
  console.log(`  -> Resolved to: ${m.resolved}`);
  console.log(`  Issue: ${m.issue}`);
}
process.exit(0);
