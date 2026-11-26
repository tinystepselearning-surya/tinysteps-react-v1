import assert from 'node:assert/strict';
import test from 'node:test';

import { createBoundedReconciliationCollector } from '../discovery/bounded-reconciliation-collector.mjs';

const target = { mode: 'emulator', projectId: 'demo-tsos-bounded-collector', host: '127.0.0.1', port: 8787 };

test('applies the approved projection, filter, order and sentinel on the Firestore emulator', async () => {
  const address = target.host + ':' + target.port;
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, address);
  assert.equal(process.env.GCLOUD_PROJECT, target.projectId);
  const { FieldPath, Firestore } = await import('@google-cloud/firestore');
  const db = new Firestore({ projectId: target.projectId, host: address, ssl: false });
  const scope = 'collectorFixtures/synthetic';
  const rows = scope + '/rows';
  try {
    const batch = db.batch();
    batch.set(db.doc(scope), { active: true, unpublished: 'fixture-only' });
    batch.set(db.doc(rows + '/b'), { active: true, unpublished: 'fixture-only' });
    batch.set(db.doc(rows + '/a'), { active: false });
    batch.set(db.doc(rows + '/c'), { active: true });
    await batch.commit();

    const verify = cap => db.runTransaction(transaction => {
      const approval = {
        target, maxRequests: 2, maxDocuments: 4, timeoutMs: 5000, summaryKeys: ['active'],
        queries: [
          { id: 'scope', kind: 'point', path: scope, fields: ['active'], where: [], cap: 1 },
          { id: 'rows', kind: 'set', path: rows, fields: ['active'],
            where: [{ field: 'active', equals: true }], cap },
        ],
      };
      // Test-only transport. Both reads are attached to this actual read-only transaction.
      const snapshot = 'fixture-read-only-transaction';
      const collect = createBoundedReconciliationCollector(approval, async request => {
        assert.deepEqual(request.target, target);
        assert.ok(request.snapshot === null || request.snapshot === snapshot);
        let docs;
        if (request.kind === 'point') {
          docs = await transaction.getAll(db.doc(request.path), { fieldMask: request.fields });
          if (!docs[0].exists) return { status: 'missing' };
        } else {
          assert.equal(request.orderBy, '__name__');
          let query = db.collection(request.path).select(...request.fields);
          for (const { field, equals } of request.where) query = query.where(field, '==', equals);
          docs = (await transaction.get(query.orderBy(FieldPath.documentId()).limit(request.limit))).docs;
        }
        return { status: 'ok', complete: true, snapshot,
          documents: docs.map(doc => ({ path: doc.ref.path, fields: doc.data() })) };
      });
      return collect(['scope', 'rows'], input => {
        assert.deepEqual(input.scope[0].fields, { active: true });
        assert.deepEqual(input.rows.map(row => row.path.split('/').at(-1)), ['b', 'c']);
        assert.deepEqual(input.rows.map(row => row.fields), [{ active: true }, { active: true }]);
        return { active: input.rows.length };
      });
    }, { readOnly: true });

    assert.deepEqual(await verify(2), { status: 'COMPLETE', requests: 2, reserved: 4,
      returned: 3, counts: { scope: 1, rows: 2 }, summary: { active: 2 } });
    await assert.rejects(verify(1), { code: 'OVERFLOW' });
  } finally {
    await db.terminate();
  }
});
