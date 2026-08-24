import fs from 'node:fs';

const path = 'src/pages/parent/ParentDashboard.tsx';
let source = fs.readFileSync(path, 'utf8');

const replacements = [
  [
    '        count: kidSessionsQuery.isLoading ? null : completedClassSessions.length,',
    '        count: kidSessionsQuery.isLoading || parentClassSessionReadMode !== "history" ? null : completedClassSessions.length,',
  ],
  [
    '        count: kidSessionsQuery.isLoading ? null : pastPendingClassSessions.length,',
    '        count: kidSessionsQuery.isLoading || parentClassSessionReadMode !== "history" ? null : pastPendingClassSessions.length,',
  ],
  [
    '        count: kidSessionsQuery.isLoading ? null : rescheduledClassSessions.length,',
    '        count: kidSessionsQuery.isLoading || parentClassSessionReadMode !== "history" ? null : rescheduledClassSessions.length,',
  ],
];

for (const [before, after] of replacements) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Missing expected history-count expression: ${before}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Duplicate history-count expression: ${before}`);
  source = source.slice(0, first) + after + source.slice(first + before.length);
}

fs.writeFileSync(path, source);
console.log('Guarded parent history counts until lazy history is loaded.');
