#!/usr/bin/env node
// Brick 1: offline, aggregate-only; NO production Firestore or GSC access.
import { readFile } from 'node:fs/promises';
import { reconcileReviewedIndiaAcquisition } from './lib/india-acquisition-brick1.mjs';
const filename = process.argv[2];
if (!filename || process.argv.length !== 3) {
  console.error('Usage: node scripts/india-acquisition-brick1.mjs <reviewed-aggregate-data.json>');
  process.exitCode = 2;
} else {
  try {
    const input = JSON.parse(await readFile(filename, 'utf8'));
    // Only a known whitelist of aggregate counts is returned; never echo input.
    process.stdout.write(JSON.stringify(reconcileReviewedIndiaAcquisition(input), null, 2) + '\n');
  } catch (error) {
    console.error('Brick 1 reviewed aggregate unavailable: ' + (error?.message || 'invalid JSON'));
    process.exitCode = 1;
  }
}
