import fs from 'node:fs';

const replaceOnce = (file, before, after, label) => {
  let source = fs.readFileSync(file, 'utf8');
  const index = source.indexOf(before);
  if (index < 0) throw new Error(`Missing patch anchor: ${label}`);
  if (source.indexOf(before, index + before.length) >= 0) throw new Error(`Non-unique patch anchor: ${label}`);
  source = source.slice(0, index) + after + source.slice(index + before.length);
  fs.writeFileSync(file, source);
};

replaceOnce(
  'src/pages/admin/TodaysNotifications.tsx',
  `        const result =\n          selectedDateKey === todayDateKey || selectedDateKey === tomorrowDateKey\n            ? await loadManualReminderDayBuckets({\n                deps: {\n                  fetchEnrollmentsByIds: (ids) => fetchDocsByIds('enrollments', ids),\n                  fetchSessionsForDate: fetchReminderSessionsForDate,\n                  readCache: readManualReminderCacheFromStorage,\n                  writeCache: writeManualReminderCacheToStorage,\n                },\n                forceRefresh,\n                todayDateKey,\n                tomorrowDateKey,\n              })\n            : await loadManualReminderSelectedDate({\n                dateKey: selectedDateKey,\n                deps: {\n                  fetchEnrollmentsByIds: (ids) => fetchDocsByIds('enrollments', ids),\n                  fetchSessionsForDate: fetchReminderSessionsForDate,\n                },\n              });`,
  `        // Today can use the low-read daily snapshot. Upcoming/date views must use the\n        // live selected-date projection so sessions created or repaired after the 04:00\n        // snapshot are visible immediately instead of appearing missing until tomorrow.\n        const result =\n          mode === 'today'\n            ? await loadManualReminderDayBuckets({\n                deps: {\n                  fetchEnrollmentsByIds: (ids) => fetchDocsByIds('enrollments', ids),\n                  fetchSessionsForDate: fetchReminderSessionsForDate,\n                  readCache: readManualReminderCacheFromStorage,\n                  writeCache: writeManualReminderCacheToStorage,\n                },\n                forceRefresh,\n                todayDateKey,\n                tomorrowDateKey,\n              })\n            : await loadManualReminderSelectedDate({\n                dateKey: selectedDateKey,\n                deps: {\n                  fetchEnrollmentsByIds: (ids) => fetchDocsByIds('enrollments', ids),\n                  fetchSessionsForDate: fetchReminderSessionsForDate,\n                },\n              });`,
  'TodaysNotifications upcoming loader',
);

replaceOnce(
  'src/lib/sessionsManagementSnapshot.ts',
  `  const snapshot = await loadSessionsManagementSnapshot();\n  const cached = readStoredCache();\n\n  if (snapshot.dateKeys.includes(dateKey)) {\n    return {\n      snapshotId: snapshot.snapshotId,\n      dateKey,\n      sessions: snapshot.sessions.filter((row) => String(row.data.date || '').trim() === dateKey),\n      enrollments: snapshot.enrollments,\n      users: snapshot.users,\n      kids: snapshot.kids,\n      students: snapshot.students,\n      courses: snapshot.courses,\n      sourceStats: snapshot.sourceStats,\n    };\n  }\n\n  const existing = cached?.extraDates[dateKey];\n  if (existing && existing.snapshotId === snapshot.snapshotId) return existing;\n\n  const callable = httpsCallable(functions, 'getSessionsManagementDateSnapshot');`,
  `  // The daily snapshot is intentionally optimized for low reads, but it can be hours\n  // old. A user explicitly selecting an upcoming date needs current session truth.\n  // Always request the bounded live date projection instead of returning an in-snapshot\n  // or sessionStorage copy that may predate schedule materialization/edits.\n  const snapshot = await loadSessionsManagementSnapshot();\n  const callable = httpsCallable(functions, 'getSessionsManagementDateSnapshot');`,
  'live selected date snapshot',
);
