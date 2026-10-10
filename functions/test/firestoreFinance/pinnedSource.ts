import {createHash, createHmac, randomBytes} from 'node:crypto';
import type {google} from '@google-cloud/firestore/types/protos/firestore_v1_proto_api';
import {collectFinance, DEFAULT_LIMITS, evaluateComplete, stable, TransientReadError,
  type Collected, type Json, type Limits, type Page, type PageRequest, type Query, type Result, type Source} from '../support/financeReadPagination';
import {assertConnection, PROJECT, type Connection} from './emulatorGuard';
type Stamp = google.protobuf.ITimestamp;
type Doc = google.firestore.v1.IDocument;
type Value = google.firestore.v1.IValue;
export const stampKey = (t: Stamp) => `${String(t.seconds || 0)}_${t.nanos || 0}`;
const digest = (v: Json) => createHash('sha256').update(stable(v)).digest('hex');
const database = `projects/${PROJECT}/databases/(default)`;
const idOK = (v: string) => /^[a-zA-Z0-9_-]{1,100}$/.test(v);
export type SDKMetrics = {attempted: number; successful: number; failed: number; returnedDocuments: number;
  queryCalls: number; pointCalls: number; retriesDisabled: true; peakAllocationRequests: number;
  timeouts: number; cancelled: number; receivedBytes: number; maxBufferedDocuments: number};
export type Hooks = {
  before?: (request: PageRequest) => Promise<void>;
  after?: (request: PageRequest, page: Page) => Promise<Page>;
};
export function decode(value: Value): Json {
  if (value.nullValue != null) return null;
  if (value.stringValue != null) return value.stringValue;
  if (value.booleanValue != null) return value.booleanValue;
  if (value.integerValue != null) {
    const n = Number(value.integerValue); if (!Number.isSafeInteger(n)) throw new Error('unsafe_integer'); return n;
  }
  if (value.doubleValue != null) { if (!Number.isFinite(value.doubleValue)) throw new Error('non_finite'); return value.doubleValue; }
  if (value.timestampValue) {
    const ms = Number(value.timestampValue.seconds || 0) * 1000 + Math.round((value.timestampValue.nanos || 0) / 1e6);
    return new Date(ms).toISOString(); // Matches existing reducer's toDate() millisecond precision.
  }
  if (value.arrayValue) return (value.arrayValue.values || []).map(decode);
  if (value.mapValue) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([k, v]) => [k, decode(v)]));
  throw new Error('unsupported_firestore_value'); // References, bytes, geo values require a reviewed codec.
}
export type Evidence = {mechanism: 'firestore-readTime-v1'; readTime: {seconds: string; nanos: number};
  parents: string[]; run: string; manifest: string[]; sourceDigest: string; metrics: SDKMetrics; budgets: Limits & {maxBytes: number}; outcome: 'COMPLETE'};
const attestations = new WeakMap<Result, Evidence>();
export function evidenceFor(result: Result): Evidence | undefined {
  const value = attestations.get(result); return value && structuredClone(value);
}

/** Every page is an actual v1 SDK streaming RPC pinned to the same server readTime.
 * The source's revision denotes an immutable historical view, NOT a live change counter.
 * COMPLETE attests collection A; it makes no assertion that the current source is unchanged. */
export class PinnedSource implements Source {
  readonly metrics: SDKMetrics = {attempted: 0, successful: 0, failed: 0, returnedDocuments: 0,
    queryCalls: 0, pointCalls: 0, retriesDisabled: true, peakAllocationRequests: 0,
    timeouts: 0, cancelled: 0, receivedBytes: 0, maxBufferedDocuments: 0};
  private time?: Stamp;
  private revision = '';
  private parents = new Set<string>();
  private readonly secret = randomBytes(32);
  private readonly cursors = new Map<string, {scope: string; name: string}>();
  private readonly payments = new Set<string>();
  private allocationActive = 0;
  private outstanding = new Set<Promise<unknown>>();
  byteBudgetExceeded = false;
  sdkBudgetExceeded = false;
  private reservedRows = 0;
  private usage = new Map<string, {rows: number; reserved: number}>();
  private bucket(key: string) {
    let value = this.usage.get(key);
    if (!value) { value = {rows: 0, reserved: 0}; this.usage.set(key, value); }
    return value;
  }
  snapshotMismatch = false;
  readonly root: string;
  constructor(private connection: Connection, readonly run: string, readonly limits: Limits,
    private hooks: Hooks = {}, private maxBytes = 2 * 1024 * 1024) {
    assertConnection(connection);
    if (!idOK(run)) throw new Error('invalid_run');
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 8 * 1024 * 1024) throw new Error('invalid_byte_budget');
    this.root = `${database}/documents/financeExperiments/${run}`;
  }
  private async stream(request: google.firestore.v1.IRunQueryRequest | google.firestore.v1.IBatchGetDocumentsRequest,
    point: boolean, signal: AbortSignal, cap: number, scope?: Query): Promise<{docs: Doc[]; time: Stamp}> {
    assertConnection(this.connection);
    if (signal.aborted) throw new Error('aborted');
    const parent = this.bucket(scope?.parent || 'anchor'), query = this.bucket('q:' + stable((scope || {}) as unknown as Json));
    if (this.metrics.attempted >= this.limits.runOperations ||
        this.metrics.returnedDocuments + this.reservedRows + cap > this.limits.runRows ||
        parent.rows + parent.reserved + cap > this.limits.parentRows ||
        query.rows + query.reserved + cap > this.limits.queryRows) {
      this.sdkBudgetExceeded = true; throw new Error('sdk_budget');
    }
    this.reservedRows += cap; parent.reserved += cap; query.reserved += cap;
    this.metrics.attempted++;
    if (point) this.metrics.pointCalls++; else this.metrics.queryCalls++;
    const operation = new Promise<{docs: Doc[]; time: Stamp}>((resolve, reject) => {
      const options = {retry: null, timeout: this.limits.requestMs};
      const stream = point ? this.connection.rpc.batchGetDocuments(request, options) : this.connection.rpc.runQuery(request, options);
      const docs: Doc[] = []; let readTime: Stamp | undefined; let settled = false;
      const finish = (error?: unknown) => {
        if (settled) return; settled = true;
        signal.removeEventListener('abort', cancel);
        if (error) { this.metrics.failed++; reject(error); }
        else if (!readTime) { this.metrics.failed++; reject(new Error('missing_read_time')); }
        else { this.metrics.successful++; resolve({docs, time: readTime}); }
      };
      const cancel = () => { this.metrics.cancelled++; stream.cancel(); finish(new Error('aborted')); };
      signal.addEventListener('abort', cancel, {once: true});
      stream.on('data', (response: google.firestore.v1.IRunQueryResponse & google.firestore.v1.IBatchGetDocumentsResponse) => {
        if (settled) return;
        if (response.readTime) {
          if (this.time && stampKey(response.readTime) !== stampKey(this.time)) {
            this.snapshotMismatch = true; stream.cancel(); finish(new Error('snapshot_mismatch')); return;
          }
          readTime = response.readTime;
        }
        const doc = response.document || response.found;
        if (doc) {
          this.metrics.returnedDocuments++; parent.rows++; query.rows++;
          this.metrics.receivedBytes += Buffer.byteLength(JSON.stringify(doc));
          if (this.metrics.receivedBytes > this.maxBytes) {
            this.byteBudgetExceeded = true; stream.cancel(); finish(new Error('byte_budget')); return;
          }
          docs.push(doc); this.metrics.maxBufferedDocuments = Math.max(this.metrics.maxBufferedDocuments, docs.length);
          if (docs.length > cap) { stream.cancel(); finish(new Error('server_limit_violation')); }
        }
      });
      stream.on('error', (error: {code?: number}) => {
        if (error.code === 4) this.metrics.timeouts++;
        finish(error.code === 14 ? new TransientReadError('sdk_unavailable') : new Error('sdk_failure'));
      });
      stream.on('end', () => finish());
    });
    this.outstanding.add(operation);
    try { return await operation; } finally {
      this.outstanding.delete(operation); this.reservedRows -= cap; parent.reserved -= cap; query.reserved -= cap;
    }
  }
  async drain(): Promise<void> { await Promise.allSettled([...this.outstanding]); }
  async begin(parents: readonly string[], signal: AbortSignal): Promise<string> {
    if (this.time) throw new Error('source_reuse');
    this.parents = new Set(parents);
    // Missing synthetic anchor establishes a server timestamp in one point RPC.
    const anchor = await this.stream({database, documents: [`${this.root}/anchors/snapshot`]}, true, signal, 0);
    this.time = anchor.time;
    this.revision = 's' + digest([this.run, [...parents], stampKey(this.time)]);
    return this.revision;
  }
  async page(req: PageRequest): Promise<Page> {
    if (!this.time || req.revision !== this.revision || !this.parents.has(req.query.parent) ||
        !Number.isInteger(req.limit) || req.limit < 1 || req.limit > this.limits.pageSize) throw new Error('invalid_scope');
    const {parent, kind, payment} = req.query;
    const scope = stable(req.query as unknown as Json);
    const cursor = req.cursor ? this.cursors.get(req.cursor) : undefined;
    if (req.cursor && (!cursor || cursor.scope !== scope)) throw new Error('invalid_cursor');
    if (kind === 'allocations' && (!payment || !this.payments.has(parent + '/' + payment))) throw new Error('invalid_payment_scope');
    if (kind !== 'allocations' && payment) throw new Error('invalid_payment_scope');
    await this.hooks.before?.(req);
    if (req.signal.aborted) throw new Error('aborted');
    const allocation = kind === 'allocations';
    if (allocation) { this.allocationActive++; this.metrics.peakAllocationRequests = Math.max(this.metrics.peakAllocationRequests, this.allocationActive); }
    try {
      let docs: Doc[];
      if (kind === 'wallet' || kind === 'profile') {
        // The first point read proves the entire scope. Its terminal page uses no RPC.
        docs = cursor ? [] : (await this.stream({database, readTime: this.time,
          documents: [`${this.root}/${kind === 'wallet' ? 'parentWallets' : 'users'}/${parent}`]}, true, req.signal, 1, req.query)).docs;
      } else {
        const nested = kind === 'allocations' ? `payments/${payment}` : kind === 'transactions' ? `parentWallets/${parent}` : kind === 'months' ? `parentMonthlyReadModels/${parent}` : '';
        const collection = kind === 'charges' ? 'billingCharges' : kind;
        docs = (await this.stream({parent: this.root + (nested ? '/' + nested : ''), readTime: this.time,
          structuredQuery: {from: [{collectionId: collection}],
            ...(kind === 'payments' || kind === 'charges' ? {where: {fieldFilter: {
              field: {fieldPath: 'parentId'}, op: 'EQUAL', value: {stringValue: parent}}}} : {}),
            orderBy: [{field: {fieldPath: '__name__'}, direction: 'ASCENDING'}], limit: {value: req.limit},
            ...(cursor ? {startAt: {values: [{referenceValue: cursor.name}], before: false}} : {}),
          }}, false, req.signal, req.limit, req.query)).docs;
      }
      const rows = docs.map(doc => {
        if (!doc.name?.startsWith(this.root + '/') || !doc.updateTime) throw new Error('invalid_document');
        const id = doc.name.split('/').at(-1)!;
        if (kind === 'payments') this.payments.add(parent + '/' + id);
        return {id, parent, ...(payment ? {payment} : {}), version: 'v' + stampKey(doc.updateTime),
          data: Object.fromEntries(Object.entries(doc.fields || {}).map(([k, v]) => [k, decode(v)]))};
      });
      const last = docs.at(-1)?.name;
      const next = last ? createHmac('sha256', this.secret).update(stable([this.revision, scope, last])).digest('hex') : null;
      if (next && last) this.cursors.set(next, {scope, name: last});
      const page = {rows, next, revision: this.snapshotMismatch ? 'mismatch' : this.revision};
      return this.hooks.after ? await this.hooks.after(req, page) : page;
    } finally { if (allocation) this.allocationActive--; }
  }
  async end(revision: string): Promise<string> { return this.snapshotMismatch ? 'mismatch' : revision; }
  evidence(rows: Collected): Evidence {
    if (!this.time) throw new Error('missing_snapshot');
    return {mechanism: 'firestore-readTime-v1', readTime: {seconds: String(this.time.seconds), nanos: this.time.nanos || 0},
      parents: [...this.parents].sort(), run: this.run, manifest: rows.map(r => stable(r.query as unknown as Json)).sort(),
      sourceDigest: digest(rows as unknown as Json), metrics: {...this.metrics}, budgets: {...this.limits, maxBytes: this.maxBytes}, outcome: 'COMPLETE'};
  }
}
export async function readPinned(connection: Connection, run: string, parents: string[],
  overrides: Partial<Limits> = {}, hooks: Hooks = {}, maxBytes?: number): Promise<{result: Result; sdk: SDKMetrics}> {
  assertConnection(connection);
  const limits = {...DEFAULT_LIMITS, ...overrides};
  const source = new PinnedSource(connection, run, limits, hooks, maxBytes);
  let result = await collectFinance(source, parents, limits);
  await source.drain();
  if (source.snapshotMismatch || source.byteBudgetExceeded || source.sdkBudgetExceeded || source.metrics.timeouts) {
    result = Object.freeze({...result, state: source.snapshotMismatch ? 'INCOMPLETE_CONCURRENT_CHANGE' : 'INCOMPLETE_BUDGET',
      reason: source.snapshotMismatch ? 'snapshot_mismatch' : source.byteBudgetExceeded ? 'byte_budget' : source.sdkBudgetExceeded ? 'sdk_budget' : 'sdk_timeout'});
  }
  if (result.state === 'COMPLETE' && !hooks.before && !hooks.after) evaluateComplete(result, rows => {
    attestations.set(result, source.evidence(rows)); return null;
  }, () => 'offline-attestation-only');
  return {result, sdk: {...source.metrics}};
}
