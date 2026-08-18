#!/usr/bin/env node
/**
 * Check for .js/.jsx files that shadow .ts/.tsx files in src/
 * 
 * Purpose: Prevent compiled JavaScript artifacts from shadowing TypeScript sources.
 * When both src/Foo.js and src/Foo.tsx exist, Vite may resolve imports to the .js file,
 * making TypeScript edits invisible.
 * 
 * Exit codes:
 *   0 - No shadowing files found
 *   1 - Shadowing files detected
 */

import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const srcDir = join(rootDir, 'src');
const rootShadowPairs = [
  ['vite.config.js', 'vite.config.ts'],
  ['vite.config.jsx', 'vite.config.tsx'],
];

// Ignore patterns
const ignoreDirs = new Set(['tests', '__tests__', 'node_modules', '.git']);
const ignorePatterns = [
  /\.test\.(js|jsx)$/,
  /\.spec\.(js|jsx)$/,
];

/**
 * Recursively find all .js/.jsx files in a directory
 */
async function findJsFiles(dir, results = []) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (!ignoreDirs.has(entry.name)) {
          await findJsFiles(fullPath, results);
        }
      } else if (entry.isFile()) {
        const ext = extname(entry.name);
        if ((ext === '.js' || ext === '.jsx') && !shouldIgnore(entry.name)) {
          results.push(fullPath);
        }
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err.message);
  }
  
  return results;
}

/**
 * Check if a file should be ignored
 */
function shouldIgnore(filename) {
  return ignorePatterns.some(pattern => pattern.test(filename));
}

/**
 * Check if a TypeScript equivalent exists for a JS file
 */
async function hasTsEquivalent(jsPath) {
  const base = jsPath.replace(/\.(js|jsx)$/, '');
  const tsPath = base + '.ts';
  const tsxPath = base + '.tsx';
  
  try {
    await stat(tsPath);
    return { exists: true, path: tsPath };
  } catch {
    // .ts doesn't exist, check .tsx
  }
  
  try {
    await stat(tsxPath);
    return { exists: true, path: tsxPath };
  } catch {
    // Neither exists
  }
  
  return { exists: false };
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Checking for JS/JSX files shadowing TS/TSX sources and root config...\n');
  
  const jsFiles = await findJsFiles(srcDir);
  const shadowingFiles = [];

  for (const [jsName, tsName] of rootShadowPairs) {
    try {
      await stat(join(rootDir, jsName));
      await stat(join(rootDir, tsName));
      shadowingFiles.push({ js: jsName, ts: tsName });
    } catch {
      // A pair only shadows when both variants exist.
    }
  }
  
  for (const jsPath of jsFiles) {
    const { exists, path: tsPath } = await hasTsEquivalent(jsPath);
    if (exists) {
      const relativePath = jsPath.replace(rootDir + '/', '');
      const relativeTsPath = tsPath.replace(rootDir + '/', '');
      shadowingFiles.push({ js: relativePath, ts: relativeTsPath });
    }
  }
  
  if (shadowingFiles.length > 0) {
    console.error('❌ ERROR: Found JS/JSX files shadowing TS/TSX sources:\n');
    shadowingFiles.forEach(({ js, ts }) => {
      console.error(`  ${js} shadows ${ts}`);
    });
    console.error(`\n💡 Fix: Delete the stale .js/.jsx file or keep only one canonical config variant.\n`);
    process.exit(1);
  }
  
  console.log('✅ OK: No shadowing JS/JSX files or root config duplicates found\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
