import fs from 'node:fs';

const path = 'src/pages/parent/ParentDashboard.tsx';
let source = fs.readFileSync(path, 'utf8');

const replaceOnce = (needle, replacement, label) => {
  const first = source.indexOf(needle);
  if (first < 0) throw new Error(`Missing expected ${label}`);
  if (source.indexOf(needle, first + needle.length) >= 0) {
    throw new Error(`Expected exactly one ${label}`);
  }
  source = source.slice(0, first) + replacement + source.slice(first + needle.length);
};

replaceOnce(
  'import { stripParentStagePrefix } from "./parentVisualTokens";\n',
  'import { stripParentStagePrefix } from "./parentVisualTokens";\nimport {\n  resolveParentClassSessionDateBounds,\n  resolveParentClassSessionReadMode,\n  shouldRunParentLegacySessionFallback,\n} from "./parentClassSessionReadPolicy";\n',
  'parent class read-policy import anchor',
);

replaceOnce(
  '  const shouldLoadFullClassHistory = activeTab === "classes";\n',
  '',
  'legacy full-history flag',
);

const startMarker = '  // Fetch sessions for this kid (manual refresh model: loads when tab opens)\n';
const endMarker = '  const classRecordingsQuery = useQuery({\n';
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);
if (start < 0 || end < 0 || end <= start) {
  throw new Error('Unable to locate kidSessionsQuery block');
}
if (source.indexOf(startMarker, start + startMarker.length) >= 0) {
  throw new Error('Expected exactly one kidSessionsQuery start marker');
}

const replacement = `  const parentClassSessionReadMode = resolveParentClassSessionReadMode({\n    activeTab,\n    classesView,\n  });\n  const parentClassSessionDateBounds = resolveParentClassSessionDateBounds({\n    activeTab,\n    classesView,\n    calendarMonth: classesCalendarMonth,\n  });\n\n  // Parent operational reads are intentionally bounded. Historical class data remains\n  // available on demand when a history filter is opened, and calendar reads are scoped\n  // to the selected month. A zero-result compatibility pass protects legacy sessions\n  // that predate the canonical date field.\n  const kidSessionsQuery = useQuery({\n    queryKey: [\n      "kidSessions",\n      user?.uid,\n      selectedKidId,\n      parentClassSessionReadMode,\n      parentClassSessionDateBounds?.startKey ?? "unbounded",\n      parentClassSessionDateBounds?.endKey ?? "unbounded",\n    ],\n    enabled: !!selectedKidId && shouldLoadClassSessions,\n    staleTime: 2 * 60 * 1000,\n    refetchOnWindowFocus: false,\n    refetchOnMount: false,\n    queryFn: async (): Promise<KidSession[]> => {\n      if (!selectedKidId || !user?.uid) return [];\n      debugParentDashboard("🔍 [ParentDashboard] Fetching sessions for:", {\n        selectedKidId,\n        parentUid: user.uid,\n        parentEmail: user.email,\n        readMode: parentClassSessionReadMode,\n        dateBounds: parentClassSessionDateBounds,\n      });\n\n      const classSessionsCol = collection(db, "classSessions");\n\n      const logQueryError = (queryName: string, error: any) => {\n        console.warn(\`⚠️ [ParentDashboard] \${queryName} query failed\`, {\n          code: error?.code,\n          message: error?.message,\n        });\n        debugParentDashboard(\`❌ [\${queryName}] query failed\`, {\n          code: error?.code,\n          message: error?.message,\n          details: error,\n        });\n      };\n\n      const readQueryDocs = async (\n        queryName: string,\n        buildQuery: () => ReturnType<typeof query>,\n      ) => {\n        try {\n          return await getDocs(buildQuery());\n        } catch (error: any) {\n          logQueryError(queryName, error);\n          return null;\n        }\n      };\n\n      const buildCanonicalQuery = () =>\n        parentClassSessionDateBounds\n          ? query(\n              classSessionsCol,\n              where("kidIds", "array-contains", selectedKidId),\n              where("parentId", "==", user.uid),\n              where("date", ">=", parentClassSessionDateBounds.startKey),\n              where("date", "<=", parentClassSessionDateBounds.endKey),\n            )\n          : query(\n              classSessionsCol,\n              where("kidIds", "array-contains", selectedKidId),\n              where("parentId", "==", user.uid),\n            );\n\n      const buildLegacyQuery = () =>\n        parentClassSessionDateBounds\n          ? query(\n              classSessionsCol,\n              where("kidId", "==", selectedKidId),\n              where("parentId", "==", user.uid),\n              where("date", ">=", parentClassSessionDateBounds.startKey),\n              where("date", "<=", parentClassSessionDateBounds.endKey),\n            )\n          : query(\n              classSessionsCol,\n              where("kidId", "==", selectedKidId),\n              where("parentId", "==", user.uid),\n            );\n\n      const [snapA, snapB] = await Promise.all([\n        readQueryDocs("Query A", buildCanonicalQuery),\n        readQueryDocs("Query B", buildLegacyQuery),\n      ]);\n\n      const map = new Map<string, KidSession>();\n      (snapA?.docs ?? []).forEach((d) => map.set(d.id, { id: d.id, ...(d.data() as any) }));\n      (snapB?.docs ?? []).forEach((d) => map.set(d.id, { id: d.id, ...(d.data() as any) }));\n\n      if ((snapB?.size ?? 0) > 0) {\n        emitParentLegacyFallbackTelemetry("classSessions_kidId", {\n          kidId: selectedKidId,\n          count: snapB?.size ?? 0,\n          canonicalHit: (snapA?.size ?? 0) > 0,\n        });\n      }\n\n      // Compatibility only: if a bounded read sees nothing at all, retry the old\n      // ownership lookups once. This protects legacy sessions that have startAt but\n      // no canonical date field. Canonical parents never pay this extra read cost.\n      if (\n        parentClassSessionDateBounds\n        && shouldRunParentLegacySessionFallback(map.size)\n      ) {\n        const [legacyCanonicalSnap, legacyKidIdSnap] = await Promise.all([\n          readQueryDocs(\n            "Query A legacy compatibility",\n            () => query(\n              classSessionsCol,\n              where("kidIds", "array-contains", selectedKidId),\n              where("parentId", "==", user.uid),\n            ),\n          ),\n          readQueryDocs(\n            "Query B legacy compatibility",\n            () => query(\n              classSessionsCol,\n              where("kidId", "==", selectedKidId),\n              where("parentId", "==", user.uid),\n            ),\n          ),\n        ]);\n\n        (legacyCanonicalSnap?.docs ?? []).forEach((d) => {\n          const row = { id: d.id, ...(d.data() as any) } as KidSession;\n          const start = sessionStartDate(row);\n          if (!start) return;\n          const dayKey = toYMD(start);\n          if (\n            dayKey >= parentClassSessionDateBounds.startKey\n            && dayKey <= parentClassSessionDateBounds.endKey\n          ) {\n            map.set(d.id, row);\n          }\n        });\n        (legacyKidIdSnap?.docs ?? []).forEach((d) => {\n          const row = { id: d.id, ...(d.data() as any) } as KidSession;\n          const start = sessionStartDate(row);\n          if (!start) return;\n          const dayKey = toYMD(start);\n          if (\n            dayKey >= parentClassSessionDateBounds.startKey\n            && dayKey <= parentClassSessionDateBounds.endKey\n          ) {\n            map.set(d.id, row);\n          }\n        });\n\n        if (map.size > 0) {\n          emitParentLegacyFallbackTelemetry("classSessions_missing_date", {\n            kidId: selectedKidId,\n            count: map.size,\n            canonicalHit: false,\n          });\n        }\n      }\n\n      const all = Array.from(map.values());\n      debugParentDashboard("📊 [Final Result] Total unique sessions:", all.length);\n\n      all.sort((a, b) => {\n        const da = sessionStartDate(a)?.getTime() ?? 0;\n        const db = sessionStartDate(b)?.getTime() ?? 0;\n        return da - db;\n      });\n\n      return all;\n    },\n  });\n\n`;

source = source.slice(0, start) + replacement + source.slice(end);

replaceOnce(
  '        scopeText: "All future scheduled classes.",\n',
  '        scopeText: "Scheduled classes in the next 14 days.",\n',
  'upcoming scope label',
);

fs.writeFileSync(path, source);
console.log('Applied bounded parent class-session read policy.');
