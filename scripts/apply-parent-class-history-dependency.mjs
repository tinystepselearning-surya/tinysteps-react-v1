import fs from 'node:fs';

const path = 'src/pages/parent/ParentDashboard.tsx';
let source = fs.readFileSync(path, 'utf8');
const before = `  }, [\n    completedClassSessions.length,\n    kidSessionsQuery.isLoading,\n    pastPendingClassSessions.length,\n    rescheduledClassSessions.length,\n    todayClassSessions.length,\n    upcomingClassSessions.length,\n  ]);`;
const after = `  }, [\n    completedClassSessions.length,\n    kidSessionsQuery.isLoading,\n    parentClassSessionReadMode,\n    pastPendingClassSessions.length,\n    rescheduledClassSessions.length,\n    todayClassSessions.length,\n    upcomingClassSessions.length,\n  ]);`;
const first = source.indexOf(before);
if (first < 0) throw new Error('Missing expected class-filter dependency block');
if (source.indexOf(before, first + before.length) >= 0) throw new Error('Duplicate class-filter dependency block');
source = source.slice(0, first) + after + source.slice(first + before.length);
fs.writeFileSync(path, source);
console.log('Added parentClassSessionReadMode to class-filter memo dependencies.');
