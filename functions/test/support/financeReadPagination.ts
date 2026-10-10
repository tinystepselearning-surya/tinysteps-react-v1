/** Offline prototype: no Firebase imports, credentials, IO adapter or write API. */
export type Json = null | boolean | number | string | Json[] | {[key: string]: Json};
export type Kind = 'payments' | 'allocations' | 'charges' | 'transactions' | 'months' | 'wallet' | 'profile';
export type Query = {parent: string; kind: Kind; payment?: string};
export type Row = {id: string; parent: string; payment?: string; version: string; data: Record<string, Json>};
export type PageRequest = {query: Query; cursor: string | null; limit: number; revision: string; signal: AbortSignal};
export type Page = {rows: Row[]; next: string | null; revision: string};
export interface Source {
  // Contract: monotonic revision covers ALL declared scopes, including inserts,
  // deletes, empty scopes and allocation children. A doc updateTime is insufficient.
  begin(parents: readonly string[], signal: AbortSignal): Promise<string>;
  page(request: PageRequest): Promise<Page>;
  end(revision: string, signal: AbortSignal): Promise<string>;
}
export interface Limits {
  pageSize: number; queryRows: number; queryAttempts: number;
  parentRows: number; parentAttempts: number; runRows: number; runOperations: number;
  allocationConcurrency: number; retries: number; durationMs: number; requestMs: number;
}
export const DEFAULT_LIMITS: Readonly<Limits> = Object.freeze({
  pageSize: 20, queryRows: 200, queryAttempts: 30,
  parentRows: 1000, parentAttempts: 200, runRows: 4000, runOperations: 800,
  allocationConcurrency: 3, retries: 2, durationMs: 5000, requestMs: 500,
});
export type State = 'COMPLETE' | 'INCOMPLETE_BUDGET' | 'INCOMPLETE_CONCURRENT_CHANGE' | 'INVALID_SOURCE';
export type Metrics = {
  sourceCalls: number; pageAttempts: number; documentsReturned: number;
  uniqueRows: number; retries: number; duplicatePages: number; peakAllocationRequests: number;
};
export type Result = Readonly<{state: State; reason: string; metrics: Readonly<Metrics>;
  productionBilledReads: null; writeAuthorized: false}>;
export type Collected = {query: Query; rows: Row[]}[];
const verified = new WeakMap<Result, Collected>();
export class TransientReadError extends Error {}
class Stop extends Error {
  constructor(readonly state: State, readonly reason: string) { super(reason); }
}
const validId = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(v);
const validCursor = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
export function stable(value: Json): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}';
  }
  throw new Stop('INVALID_SOURCE', 'non_json_data');
}

export async function collectFinance(source: Source, parents: string[], limits: Limits = {...DEFAULT_LIMITS}): Promise<Result> {
  const metrics: Metrics = {sourceCalls: 0, pageAttempts: 0, documentsReturned: 0,
    uniqueRows: 0, retries: 0, duplicatePages: 0, peakAllocationRequests: 0};
  const finish = (state: State, reason: string, rows?: Collected): Result => {
    const result = Object.freeze({state, reason, metrics: Object.freeze({...metrics}),
      productionBilledReads: null, writeAuthorized: false as const});
    if (state === 'COMPLETE' && rows) verified.set(result, structuredClone(rows));
    return result;
  };
  if (!Array.isArray(parents) || parents.length < 1 || parents.length > 12 ||
      parents.some(p => !validId(p)) || new Set(parents).size !== parents.length ||
      Object.keys(DEFAULT_LIMITS).some(k => {
        const n = limits[k as keyof Limits];
        return !Number.isSafeInteger(n) || n < (k === 'retries' ? 0 : 1) || n > 100000;
      }) || limits.pageSize > 100 || limits.allocationConcurrency > 8 || limits.retries > 3) {
    return finish('INVALID_SOURCE', 'invalid_manifest_or_limits');
  }
  const controller = new AbortController();
  const deadline = Date.now() + limits.durationMs;
  let reserved = 0, activeAllocations = 0;
  let stopped: Stop | null = null;
  const collected: Collected = [];
  const parentUsage = new Map(parents.map(p => [p, {rows: 0, reserved: 0, attempts: 0}]));
  const stop = (state: State, reason: string): never => {
    stopped ||= new Stop(state, reason);
    controller.abort();
    throw stopped;
  };
  async function invoke<T>(call: (signal: AbortSignal) => Promise<T>, allocation = false): Promise<T> {
    if (stopped) throw stopped;
    if (Date.now() >= deadline) stop('INCOMPLETE_BUDGET', 'deadline');
    if (metrics.sourceCalls >= limits.runOperations) stop('INCOMPLETE_BUDGET', 'run_operations');
    metrics.sourceCalls++;
    if (allocation) {
      activeAllocations++;
      metrics.peakAllocationRequests = Math.max(metrics.peakAllocationRequests, activeAllocations);
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          stopped ||= new Stop('INCOMPLETE_BUDGET', 'request_timeout');
          controller.abort(); reject(stopped);
        }, Math.min(limits.requestMs, deadline - Date.now()));
      });
      const value = await Promise.race([Promise.resolve().then(() => call(controller.signal)), timeout]);
      if (stopped) throw stopped;
      return value;
    } finally {
      clearTimeout(timer);
      if (allocation) activeAllocations--;
    }
  }
  try {
    const revision = await invoke(signal => source.begin([...parents].sort(), signal));
    if (!validId(revision)) stop('INVALID_SOURCE', 'invalid_revision');
    async function traverse(query: Query): Promise<void> {
      let cursor: string | null = null, lastId = '', queryRows = 0, attempts = 0, repeat = 0;
      const seen = new Map<string, string>(), cursors = new Set<string>(), rows: Row[] = [];
      const usage = parentUsage.get(query.parent)!;
      while (true) {
        if (stopped) throw stopped;
        if (attempts >= limits.queryAttempts || usage.attempts >= limits.parentAttempts) stop('INCOMPLETE_BUDGET', 'query_or_parent_attempts');
        const cap = Math.min(limits.pageSize, limits.queryRows - queryRows,
          limits.parentRows - usage.rows - usage.reserved, limits.runRows - metrics.documentsReturned - reserved);
        if (cap < 1) stop('INCOMPLETE_BUDGET', 'row_budget');
        attempts++; usage.attempts++; metrics.pageAttempts++;
        reserved += cap; usage.reserved += cap;
        let page: Page;
        try {
          page = await invoke(signal => source.page({query: {...query}, cursor, limit: cap, revision, signal}), query.kind === 'allocations');
        } catch (error) {
          if (!stopped && error instanceof TransientReadError && repeat < limits.retries) {
            repeat++; metrics.retries++; continue;
          }
          if (!stopped && error instanceof TransientReadError) stop('INCOMPLETE_BUDGET', 'transient_retry_exhausted');
          throw error;
        } finally { reserved -= cap; usage.reserved -= cap; }
        if (!page || !Array.isArray(page.rows)) stop('INVALID_SOURCE', 'invalid_page');
        metrics.documentsReturned += page.rows.length; usage.rows += page.rows.length; queryRows += page.rows.length;
        if (page.rows.length > cap) stop('INVALID_SOURCE', 'source_exceeded_limit');
        if (page.revision !== revision) stop('INCOMPLETE_CONCURRENT_CHANGE', 'source_revision_changed');
        if (!page.rows.length) {
          if (page.next !== null) stop('INVALID_SOURCE', 'empty_page_cursor');
          collected.push({query, rows}); return;
        }
        const next = page.next;
        if (!validCursor(next)) return stop('INVALID_SOURCE', 'missing_or_invalid_cursor');
        let previous = '', added = 0;
        for (const row of page.rows) {
          if (!row || !validId(row.id) || !validId(row.version) || row.parent !== query.parent ||
              row.payment !== query.payment || row.id <= previous ||
              !row.data || typeof row.data !== 'object' || Array.isArray(row.data) ||
              (row.data.parentId !== undefined && row.data.parentId !== query.parent) ||
              (['payments', 'charges'].includes(query.kind) && row.data.parentId !== query.parent)) {
            stop('INVALID_SOURCE', 'scope_or_order_invalid');
          }
          previous = row.id;
          const fingerprint = row.version + ':' + stable(row.data);
          if (seen.has(row.id)) {
            if (seen.get(row.id) !== fingerprint) stop('INCOMPLETE_CONCURRENT_CHANGE', 'duplicate_changed');
            continue;
          }
          if (row.id <= lastId) stop('INVALID_SOURCE', 'out_of_order');
          seen.set(row.id, fingerprint); lastId = row.id;
          rows.push(structuredClone(row)); metrics.uniqueRows++; added++;
          if (['wallet', 'profile'].includes(query.kind) && rows.length > 1) stop('INVALID_SOURCE', 'multiple_point_records');
        }
        if (!added) {
          metrics.duplicatePages++;
          if (page.next !== cursor) stop('INVALID_SOURCE', 'replay_cursor_mismatch');
          if (++repeat > limits.retries) stop('INCOMPLETE_BUDGET', 'duplicate_retry_exhausted');
          continue;
        }
        if (cursors.has(next)) stop('INVALID_SOURCE', 'cursor_cycle');
        cursors.add(next); cursor = next; repeat = 0;
      }
    }
    for (const parent of [...parents].sort()) {
      for (const kind of ['payments', 'charges', 'transactions', 'months', 'wallet', 'profile'] as const) {
        await traverse({parent, kind});
      }
      const payments = collected.find(q => q.query.parent === parent && q.query.kind === 'payments')!.rows;
      let index = 0;
      const workers = Array.from({length: Math.min(limits.allocationConcurrency, payments.length)}, async () => {
        while (!stopped && index < payments.length) {
          const payment = payments[index++];
          try { await traverse({parent, kind: 'allocations', payment: payment.id}); }
          catch (error) {
            if (error instanceof Stop) stop(error.state, error.reason);
            stop('INVALID_SOURCE', 'source_read_failed');
          }
        }
      });
      const settled = await Promise.allSettled(workers);
      if (stopped) throw stopped;
      if (settled.some(r => r.status === 'rejected')) stop('INVALID_SOURCE', 'source_read_failed');
    }
    if (await invoke(signal => source.end(revision, signal)) !== revision) stop('INCOMPLETE_CONCURRENT_CHANGE', 'final_revision_changed');
    collected.sort((a, b) => stable(a.query as unknown as Json).localeCompare(stable(b.query as unknown as Json)));
    return finish('COMPLETE', 'declared_scope_exhausted_at_verified_revision', collected);
  } catch (error) {
    controller.abort();
    const failure = stopped || (error instanceof Stop ? error : new Stop('INVALID_SOURCE', 'source_read_failed'));
    return finish(failure.state, failure.reason);
  }
}

/** Opaque in-process completion capability: an edited/cloned result is not valid.
 * No partial rows escape. Even COMPLETE confers no production write authority. */
export function evaluateComplete<T>(result: Result, evaluate: (rows: Collected) => T,
  hash: (report: T) => string): {state: State; report: T | null; reportHash: string | null; writeAuthorized: false} {
  const rows = verified.get(result);
  if (result.state !== 'COMPLETE' || !rows) return {state: result.state === 'COMPLETE' ? 'INVALID_SOURCE' : result.state,
    report: null, reportHash: null, writeAuthorized: false};
  const report = evaluate(structuredClone(rows));
  return {state: 'COMPLETE', report, reportHash: hash(report), writeAuthorized: false};
}
