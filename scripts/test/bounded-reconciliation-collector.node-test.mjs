import assert from 'node:assert/strict';
import test from 'node:test';

import { auditAcademicEnrollmentSnapshot } from '../audit-academic-enrollment.mjs';
import { auditIdentitySnapshot } from '../audit-identity-references.mjs';
import { CollectorError, createBoundedReconciliationCollector } from '../discovery/bounded-reconciliation-collector.mjs';

const point = { id: 'owner', kind: 'point', path: 'users/owner-fixture', fields: ['active'], where: [], cap: 1 };
const set = { id: 'children', kind: 'set', path: 'schools/demo-fixture/children',
  fields: ['active', 'age'], where: [{ field: 'active', equals: true }], cap: 2 };
const owner = { path: point.path, fields: { active: true } };
const child = (id, fields = { active: true, age: 5 }) => ({ path: set.path + '/' + id, fields });
const ok = (documents, overrides = {}) => ({ status: 'ok', snapshot: 'fixture-version', complete: true, documents, ...overrides });
const approval = overrides => ({
  target: { mode: 'synthetic' }, maxRequests: 2, maxDocuments: 4, timeoutMs: 1000,
  queries: [point, set], summaryKeys: [], ...overrides,
});
const selection = ['owner', 'children'];
const failure = code => error => error instanceof CollectorError && error.code === code && error.message === code;

test('dispatches only approved projections, predicates and bounds in manifest order', async () => {
  const requests = [];
  const manifest = structuredClone(approval({ summaryKeys: ['activeChildren'] }));
  const collect = createBoundedReconciliationCollector(manifest, (query, { signal }) => {
    assert.equal(signal.aborted, false);
    assert.ok(Object.isFrozen(query) && Object.isFrozen(query.target) && Object.isFrozen(query.fields));
    requests.push(query);
    return query.kind === 'point' ? ok([owner]) : ok([child('a'), child('z')]);
  });
  manifest.queries[1].fields.push('private');
  manifest.queries[1].where[0].equals = false;
  const out = await collect([...selection].reverse(), rows => ({ activeChildren: rows.children.length }));
  assert.deepEqual(requests, [
    { target: { mode: 'synthetic' }, kind: 'point', path: point.path, fields: point.fields,
      where: [], orderBy: null, limit: 1, snapshot: null },
    { target: { mode: 'synthetic' }, kind: 'set', path: set.path, fields: set.fields,
      where: set.where, orderBy: '__name__', limit: 3, snapshot: 'fixture-version' },
  ]);
  assert.deepEqual(out, { status: 'COMPLETE', requests: 2, reserved: 4, returned: 3,
    counts: { owner: 1, children: 2 }, summary: { activeChildren: 2 } });
  assert.doesNotMatch(JSON.stringify(out), /fixture-version|owner-fixture|demo-fixture/);
});

test('accepts a fully read empty set on an approved demo loopback target', async () => {
  const target = { mode: 'emulator', projectId: 'demo-tsos-d13', host: '127.0.0.1', port: 8085 };
  const collect = createBoundedReconciliationCollector(approval({ target, queries: [set] }), request => {
    assert.deepEqual(request.target, target);
    return ok([]);
  });
  assert.deepEqual((await collect(['children'])).counts, { children: 0 });
});

for (const [name, options, code] of [
  ['production', { target: { mode: 'production' } }, 'INVALID_TARGET'],
  ['synthetic with address', { target: { mode: 'synthetic', host: '127.0.0.1' } }, 'INVALID_TARGET'],
  ['external host', { target: { mode: 'emulator', projectId: 'demo-safe', host: 'example.com', port: 8085 } }, 'INVALID_TARGET'],
  ['production project', { target: { mode: 'emulator', projectId: 'tinysteps-react-v1', host: '127.0.0.1', port: 8085 } }, 'INVALID_TARGET'],
  ['invalid port', { target: { mode: 'emulator', projectId: 'demo-safe', host: '127.0.0.1', port: 0 } }, 'INVALID_TARGET'],
  ['invalid time limit', { timeoutMs: 0 }, 'INVALID_APPROVAL'],
  ['extra config', { retries: 1 }, 'INVALID_APPROVAL'],
  ['duplicate metrics', { summaryKeys: ['metric', 'metric'] }, 'INVALID_APPROVAL'],
  ['duplicate aliases', { queries: [point, point] }, 'INVALID_QUERY'],
  ['wide mask', { queries: [{ ...point, fields: ['*'] }] }, 'INVALID_QUERY'],
  ['no field mask', { queries: [{ ...point, fields: [] }] }, 'INVALID_QUERY'],
  ['nested mask outside contract', { queries: [{ ...point, fields: ['private.value'] }] }, 'INVALID_QUERY'],
  ['relative path', { queries: [{ ...point, path: 'users/../children/x' }] }, 'INVALID_QUERY'],
  ['collection in point request', { queries: [{ ...point, path: 'users' }] }, 'INVALID_QUERY'],
  ['document in set request', { queries: [{ ...set, path: point.path }] }, 'INVALID_QUERY'],
  ['predicate outside mask', { queries: [{ ...set, where: [{ field: 'unselected', equals: true }] }] }, 'INVALID_QUERY'],
  ['unbounded set', { queries: [{ ...set, cap: 101 }] }, 'INVALID_QUERY'],
  ['caller order override', { queries: [{ ...set, orderBy: 'age' }] }, 'INVALID_QUERY'],
]) {
  test('rejects ' + name + ' before any transport access', () => {
    let calls = 0;
    assert.throws(() => createBoundedReconciliationCollector(approval(options), () => { calls++; }), failure(code));
    assert.equal(calls, 0);
  });
}

for (const [name, options, requested, code] of [
  ['request budget', { maxRequests: 1 }, selection, 'INVALID_SELECTION'],
  ['document budget includes sentinel', { maxDocuments: 3 }, selection, 'DOCUMENT_BUDGET'],
  ['unauthorized path', {}, ['users/private', 'children'], 'UNAPPROVED_QUERY'],
  ['query override object', {}, [{ ...point, path: 'users/private' }, 'children'], 'UNAPPROVED_QUERY'],
  ['duplicate selection', {}, ['owner', 'owner'], 'INVALID_SELECTION'],
  ['incomplete selection', {}, ['owner'], 'INCOMPLETE_SELECTION'],
]) {
  test('rejects ' + name + ' before dispatch', async () => {
    const collect = createBoundedReconciliationCollector(approval(options), () => assert.fail('dispatched'));
    await assert.rejects(collect(requested), failure(code));
  });
}

for (const [name, response, code] of [
  ['overflow sentinel', ok([child('a'), child('b'), child('c')]), 'OVERFLOW'],
  ['oversized response', ok([child('a'), child('b'), child('c'), child('d')]), 'INVALID_RESPONSE'],
  ['snapshot drift', ok([], { snapshot: 'different' }), 'SNAPSHOT_MISMATCH'],
  ['incomplete response', ok([], { complete: false }), 'INCOMPLETE_RESPONSE'],
  ['unapproved fields', ok([child('a', { active: true, secret: 1 })]), 'INVALID_RESPONSE'],
  ['different predicate', ok([child('a', { active: false })]), 'INVALID_RESPONSE'],
  ['missing predicate', ok([child('a', { age: 4 })]), 'INVALID_RESPONSE'],
  ['duplicate rows', ok([child('a'), child('a')]), 'INVALID_RESPONSE'],
  ['unsorted rows', ok([child('z'), child('a')]), 'INVALID_RESPONSE'],
  ['different path', ok([owner]), 'INVALID_RESPONSE'],
  ['nested descendant', ok([{ path: child('a').path + '/more/b', fields: { active: true } }]), 'INVALID_RESPONSE'],
  ['denial', { status: 'denied' }, 'DENIED'],
  ['transport response error', { status: 'error' }, 'TRANSPORT_ERROR'],
  ['contradictory status', ok([child('a')], { status: 'missing' }), 'INVALID_RESPONSE'],
  ['sparse documents', ok(Array(2)), 'INVALID_RESPONSE'],
  ['uncloneable fixture', ok([child('a', { active: true, age: () => 4 })]), 'INVALID_RESPONSE'],
]) {
  test('stops on ' + name + ' and never reduces partial data', async () => {
    const tail = { ...point, id: 'tail', path: 'users/tail' };
    const paths = [];
    const collect = createBoundedReconciliationCollector(
      approval({ queries: [point, set, tail], maxRequests: 3, maxDocuments: 5 }),
      request => {
        paths.push(request.path);
        return request.kind === 'point' ? ok([owner]) : response;
      },
    );
    await assert.rejects(collect([...selection, 'tail'], () => assert.fail('partial reduction')), failure(code));
    assert.deepEqual(paths, [point.path, set.path]);
    await assert.rejects(collect([...selection, 'tail']), failure('ALREADY_ATTEMPTED'));
  });
}

for (const response of [ok([]), { status: 'missing' }]) {
  test('rejects a missing required point read in form ' + response.status, async () => {
    const collect = createBoundedReconciliationCollector(approval(), () => response);
    await assert.rejects(collect(selection), failure('MISSING_REFERENCE'));
  });
}

test('redacts transport throws and avoids implicit retries', async () => {
  let attempts = 0;
  const collect = createBoundedReconciliationCollector(approval(), () => {
    attempts++;
    throw new Error('private transport payload');
  });
  await assert.rejects(collect(selection), failure('TRANSPORT_ERROR'));
  assert.equal(attempts, 1);
});

test('concurrent execution cannot reuse the approval or the budget', async () => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const collect = createBoundedReconciliationCollector(approval(), query => query.kind === 'point' ? pending : ok([]));
  const first = collect(selection);
  await assert.rejects(collect(selection), failure('ALREADY_ATTEMPTED'));
  release(ok([owner]));
  assert.equal((await first).requests, 2);
});

test('aborts timed-out reads without allowing follow-on operations', async () => {
  let attempts = 0;
  let aborted = false;
  const collect = createBoundedReconciliationCollector(approval({ timeoutMs: 25 }), (_, { signal }) => {
    attempts++;
    signal.addEventListener('abort', () => { aborted = true; }, { once: true });
    return new Promise(() => {});
  });
  await assert.rejects(collect(selection), failure('TIMEOUT'));
  assert.equal(attempts, 1);
  assert.equal(aborted, true);
});

test('rejects row-shaped summaries and redacts reducer exceptions', async () => {
  const read = query => query.kind === 'point' ? ok([owner]) : ok([]);
  const make = () => createBoundedReconciliationCollector(approval({ summaryKeys: ['metric'] }), read);
  await assert.rejects(make()(selection, rows => ({ metric: rows.owner })), failure('INVALID_SUMMARY'));
  await assert.rejects(make()(selection, () => ({ privateIdentifier: 1 })), failure('INVALID_SUMMARY'));
  await assert.rejects(make()(selection, () => { throw new Error('private row'); }), failure('SUMMARY_FAILED'));
});

test('clones prior records before another transport call can change them', async () => {
  const mutable = structuredClone(owner);
  const collect = createBoundedReconciliationCollector(approval({ summaryKeys: ['active'] }), request => {
    if (request.kind === 'point') return ok([mutable]);
    mutable.fields.active = false;
    return ok([]);
  });
  const out = await collect(selection, rows => ({ active: Number(rows.owner[0].fields.active) }));
  assert.deepEqual(out.summary, { active: 1 });
});

test('preserves identity and academic issue counts on the same projected fixture', async () => {
  const enrollment = { path: 'enrollments/enrollment-a',
    fields: { kidId: 'kid-a', studentId: 'kid-b', status: 'active', courseId: 'course-a' } };
  const snapshot = rows => ({
    users: [], parents: [], teachers: [], learningPartners: [], admins: [], kids: [],
    students: [], nestedStudents: [], schools: [], schoolUsers: [], demoSessions: [],
    courses: [], classSessions: [], operationalEnrollmentKeys: [],
    enrollmentCreationOperations: [], enrollmentCourseTransitions: [], schoolStructure: [],
    programmes: [], curriculumVersions: [], deliveryOfferings: [], learningGroups: [],
    groupPlacements: [], teachingAssignments: [], schedulePlans: [],
    enrollments: rows.map(({ path, fields }) => ({ id: path.split('/').at(-1), path, data: fields })),
  });
  const summarize = input => ({
    identityIssues: auditIdentitySnapshot(input).issues.total,
    academicIssues: auditAcademicEnrollmentSnapshot(input).issues.total,
  });
  const manifest = approval({
    queries: [{ id: 'enrollments', kind: 'set', path: 'enrollments',
      fields: Object.keys(enrollment.fields), where: [], cap: 1 }],
    summaryKeys: ['identityIssues', 'academicIssues'],
  });
  const collect = createBoundedReconciliationCollector(manifest, () => ok([enrollment]));
  const expected = summarize(snapshot([enrollment]));
  assert.ok(expected.identityIssues > 0 && expected.academicIssues > 0);
  assert.deepEqual((await collect(['enrollments'], rows => summarize(snapshot(rows.enrollments)))).summary, expected);
});
