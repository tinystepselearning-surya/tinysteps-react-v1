#!/usr/bin/env node
import fs from 'node:fs';

const file = 'src/pages/BlogPostPage.tsx';
let source = fs.readFileSync(file, 'utf8');

const startMarker = "                {blogPosts\n                  .filter((p) => {";
const endMarker = "                  ))}\n";
const start = source.indexOf(startMarker);
if (start < 0) throw new Error('Could not find legacy same-category related-links block start');
const endStart = source.indexOf(endMarker, start);
if (endStart < 0) throw new Error('Could not find legacy same-category related-links block end');
source = source.slice(0, start) + source.slice(endStart + endMarker.length);

const oldCopy = "                  : 'Explore the most relevant program, related guides, or compare courses directly.'}";
const newCopy = "                  : 'Explore the most relevant program or compare course options directly.'}";
if (!source.includes(oldCopy)) throw new Error('Could not find structured-support description copy');
source = source.replace(oldCopy, newCopy);

fs.writeFileSync(file, source);
console.log('Removed legacy same-category related-link strip from BlogPostPage.');
