import {randomUUID} from 'node:crypto';
import type {Query} from '../support/financeReadPagination';
import type {SyntheticFinanceSource} from '../support/financeSyntheticSource';
import {assertConnection, type Connection} from './emulatorGuard';
export const runId = () => 'run-' + randomUUID();
export function path(run: string, q: Query, id: string): string {
  const prefix = `financeExperiments/${run}/`;
  switch (q.kind) {
    case 'payments': return prefix + `payments/${id}`;
    case 'allocations': return prefix + `payments/${q.payment}/allocations/${id}`;
    case 'charges': return prefix + `billingCharges/${id}-${q.parent}`;
    case 'transactions': return prefix + `parentWallets/${q.parent}/transactions/${id}`;
    case 'months': return prefix + `parentMonthlyReadModels/${q.parent}/months/${id}`;
    case 'wallet': return prefix + `parentWallets/${q.parent}`;
    case 'profile': return prefix + `users/${q.parent}`;
  }
}
/** Only explicit synthetic rows, no scans/deletes and no production path acceptance. */
export async function seed(connection: Connection, run: string, source: SyntheticFinanceSource, parents: string[]) {
  assertConnection(connection);
  const rows = source.exhaustive(parents).flatMap(scope => scope.rows.map(row => ({scope: scope.query, row})));
  for (let i = 0; i < rows.length; i += 100) {
    const batch = connection.db.batch();
    for (const {scope, row} of rows.slice(i, i + 100)) batch.set(connection.db.doc(path(run, scope, row.id)), row.data);
    await batch.commit();
  }
}
