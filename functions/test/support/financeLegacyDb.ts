import type * as admin from 'firebase-admin';

export type Document = {id: string; data: Record<string, unknown>};
type Filter = {field: string; op: string; value: unknown};
type Ref = {
  collection(name: string): Ref; doc(id: string): Ref;
  where(field: string, op: string, value: unknown): Ref;
  limit(cap: number): Ref; get(): Promise<unknown>;
};
/** Only in-memory synthetic get operations. No Firebase client is instantiated. */
export function legacyDb(tables: Record<string, Document[]>) {
  const calls: {path: string; cap: number | null; returned: number; filters: Filter[]}[] = [];
  let active = 0, peak = 0;
  function ref(path: string, cap: number | null = null, filters: Filter[] = []): Ref {
    return {
      collection: name => ref(path + '/' + name), doc: id => ref(path + '/' + id),
      where: (field, op, value) => ref(path, cap, [...filters, {field, op, value}]),
      limit: n => ref(path, n, filters),
      get: async () => {
        const rows = (tables[path] || []).filter(row => filters.every(f => {
          if (f.op === '==') return row.data[f.field] === f.value;
          if (f.op === '>=') return String(row.data[f.field]) >= String(f.value);
          if (f.op === '<=') return String(row.data[f.field]) <= String(f.value);
          throw new Error('unsupported synthetic filter');
        })).slice(0, cap ?? Infinity);
        calls.push({path, cap, returned: rows.length, filters});
        if (path.endsWith('/allocations')) { active++; peak = Math.max(peak, active); }
        await Promise.resolve();
        if (path.endsWith('/allocations')) active--;
        return {docs: rows.map(row => ({id: row.id, data: () => row.data})),
          exists: rows.length > 0, data: () => rows[0]?.data};
      },
    };
  }
  return {db: {collection: (name: string) => ref(name)} as unknown as admin.firestore.Firestore,
    calls, peakAllocations: () => peak};
}
