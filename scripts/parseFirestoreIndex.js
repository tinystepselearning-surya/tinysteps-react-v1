#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
  });
}

async function main() {
  const arg = process.argv[2];
  let content = '';
  if (arg) {
    try {
      content = fs.readFileSync(path.resolve(process.cwd(), arg), 'utf8');
    } catch (e) {
      console.error('Failed to read file:', e.message);
      process.exit(1);
    }
  } else {
    content = await readStdin();
  }

  if (!content) {
    console.error('No input provided. Provide a path to a file containing the Firestore error text, or pipe it to stdin.');
    process.exit(1);
  }

  // Try to extract a JSON snippet that looks like an index definition
  const jsonMatch = content.match(/\{[\s\S]*\}/m);
  let parsed = null;
  if (jsonMatch) {
    const candidate = jsonMatch[0];
    try {
      parsed = JSON.parse(candidate);
    } catch (e) {
      // try to find "indexes" array specifically
      const idxMatch = content.match(/\{"indexes"[\s\S]*?\}\s*$/m);
      if (idxMatch) {
        try { parsed = JSON.parse(idxMatch[0]); } catch (_) { parsed = null }
      }
    }
  }

  const indexesFile = path.resolve(process.cwd(), 'firestore.indexes.json');
  if (parsed && typeof parsed === 'object' && parsed.indexes) {
    // merge indexes
    let existing = { indexes: [], fieldOverrides: [] };
    try {
      if (fs.existsSync(indexesFile)) {
        existing = JSON.parse(fs.readFileSync(indexesFile, 'utf8'));
      }
    } catch (e) {
      console.error('Failed to read existing firestore.indexes.json:', e.message);
      process.exit(1);
    }

    const addIndex = (ix) => {
      // naive duplicate check by JSON string
      const s = JSON.stringify(ix);
      if (!existing.indexes.some(e => JSON.stringify(e) === s)) existing.indexes.push(ix);
    };

    parsed.indexes.forEach(addIndex);
    try {
      fs.writeFileSync(indexesFile, JSON.stringify(existing, null, 2));
      console.log('Appended index(es) to', indexesFile);
      process.exit(0);
    } catch (e) {
      console.error('Failed to write indexes file:', e.message);
      process.exit(1);
    }
  }

  // If we didn't find JSON, try to extract a console link
  const urlMatch = content.match(/https?:\/\/console\.firebase\.google\.com\/[^\s)]+/i);
  if (urlMatch) {
    console.log('Found Firebase Console link:\n', urlMatch[0]);
    console.log('\nOpen it and create the suggested index, or copy the error text and run this script with the error text file to append JSON to firestore.indexes.json.');
    process.exit(0);
  }

  console.error('Could not extract index JSON or Console link from input. Please paste the full Firestore error text (it usually contains a Console link or JSON).');
  process.exit(2);
}

main();
