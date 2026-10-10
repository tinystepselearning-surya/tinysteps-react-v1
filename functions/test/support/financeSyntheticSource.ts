import {createHmac, randomBytes} from 'node:crypto';
import type {ParentPaymentBackfillAuditInput} from '../../src/parentPaymentBackfillAudit';
import {stable, type Collected, type Json, type Page, type PageRequest, type Query, type Row, type Source} from './financeReadPagination';

export const key = (query: Query): string => [query.parent, query.kind, query.payment || ''].join('|');
export class SyntheticFinanceSource implements Source {
  readonly tables = new Map<string, Row[]>();
  readonly requests: PageRequest[] = [];
  revision = 1;
  active = 0;
  peak = 0;
  hook?: (request: PageRequest, normal: Page) => Promise<Page>;
  endHook?: () => void;
  private allowed = new Set<string>();
  private readonly secret = randomBytes(32);
  private readonly cursors = new Map<string, {scope: string; revision: string; index: number}>();
  add(query: Query, id: string, data: Record<string, Json>): void {
    const rows = this.tables.get(key(query)) || [];
    rows.push({id, parent: query.parent, ...(query.payment ? {payment: query.payment} : {}), version: 'v1', data});
    this.tables.set(key(query), rows);
  }
  change(mutate: () => void): void { mutate(); this.revision++; }
  async begin(parents: readonly string[]): Promise<string> {
    this.allowed = new Set(parents); return 'r' + this.revision;
  }
  async page(request: PageRequest): Promise<Page> {
    if (request.signal.aborted || !this.allowed.has(request.query.parent)) throw new Error('invalid_scope');
    this.requests.push(request);
    const scope = key(request.query);
    const cursor = request.cursor ? this.cursors.get(request.cursor) : null;
    if (request.cursor && (!cursor || cursor.scope !== scope || cursor.revision !== request.revision)) throw new Error('invalid_cursor');
    const all = [...(this.tables.get(scope) || [])].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    const index = cursor?.index || 0;
    const rows = structuredClone(all.slice(index, index + request.limit));
    const end = index + rows.length;
    const next = rows.length ? createHmac('sha256', this.secret)
      .update(stable([scope, request.revision, end])).digest('hex') : null;
    if (next) this.cursors.set(next, {scope, revision: request.revision, index: end});
    const normal = {rows, next, revision: 'r' + this.revision};
    this.active++; this.peak = Math.max(this.peak, this.active);
    try { return this.hook ? await this.hook(request, normal) : normal; }
    finally { this.active--; }
  }
  async end(): Promise<string> { this.endHook?.(); return 'r' + this.revision; }
  exhaustive(parents: string[]): Collected {
    const all: Collected = [];
    for (const parent of parents) {
      const payments = this.tables.get(key({parent, kind: 'payments'})) || [];
      const queries: Query[] = (['payments', 'charges', 'transactions', 'months', 'wallet', 'profile'] as const)
        .map(kind => ({parent, kind}));
      queries.push(...payments.map(p => ({parent, kind: 'allocations' as const, payment: p.id})));
      for (const query of queries) all.push({query, rows: structuredClone(this.tables.get(key(query)) || []).sort((a, b) => a.id.localeCompare(b.id))});
    }
    return all;
  }
}

export function auditInput(all: Collected, options: Partial<ParentPaymentBackfillAuditInput> = {}): ParentPaymentBackfillAuditInput {
  const rows = (kind: Query['kind']) => all.filter(t => t.query.kind === kind).flatMap(t => t.rows);
  return {mode: 'dry_run', now: new Date('2026-06-25T00:00:00Z'),
    payments: rows('payments').map(row => ({id: row.id, data: row.data,
      allocationDocs: (all.find(t => t.query.kind === 'allocations' && t.query.payment === row.id && t.query.parent === row.parent)?.rows || [])
        .map(a => ({id: a.id, data: a.data}))})),
    charges: rows('charges').map(row => ({id: row.id, data: row.data})),
    wallets: rows('wallet').map(row => ({parentId: row.parent, data: row.data})),
    walletTransactions: rows('transactions').map(row => ({id: row.id, parentId: row.parent, data: row.data})),
    monthlyReadModels: rows('months').map(row => ({parentId: row.parent, monthKey: row.id, data: row.data})),
    parentProfiles: rows('profile').map(row => ({parentId: row.parent, parentName: String(row.data.name || '')})),
    ...options};
}

export function fixture(paymentCount = 3, parents = ['parent-a']): SyntheticFinanceSource {
  const source = new SyntheticFinanceSource();
  for (const parent of parents) {
    source.add({parent, kind: 'wallet'}, 'wallet', {currentBalance: paymentCount * 40 + 20});
    source.add({parent, kind: 'profile'}, 'profile', {name: 'Synthetic actor'});
    source.add({parent, kind: 'transactions'}, 'opening', {signedAmount: 30, transactionId: 'opening'});
    source.add({parent, kind: 'transactions'}, 'refund', {signedAmount: -10, transactionId: 'refund'});
    source.add({parent, kind: 'charges'}, 'charge-old', {parentId: parent, amount: 75, monthKey: '2026-05', date: '2026-05-01', status: 'unpaid'});
    source.add({parent, kind: 'charges'}, 'charge-new', {parentId: parent, amount: 100, monthKey: '2026-06', date: '2026-06-01', status: 'unpaid'});
    source.add({parent, kind: 'months'}, '2026-05', {billedAmount: 75, settledAmount: 0, dueAmount: 75});
    for (let i = 0; i < paymentCount; i++) {
      const id = parent + '-p' + String(i).padStart(3, '0');
      source.add({parent, kind: 'payments'}, id, {parentId: parent, amount: 40,
        paidAt: '2026-06-20T09:00:00Z', createdAt: '2026-06-01T00:00:00Z',
        allocationModeUsed: 'wallet_only', walletTransactionId: 'tx-' + id, reference: id});
      source.add({parent, kind: 'transactions'}, 'tx-' + id, {signedAmount: 40, transactionId: 'tx-' + id});
    }
  }
  return source;
}
