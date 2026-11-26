import { performance } from 'node:perf_hooks';

const aliasPattern = /^[a-z][a-zA-Z0-9_]{0,63}$/;
const segmentPattern = /^[a-zA-Z0-9_-]{1,128}$/;
const fieldPattern = /^[a-zA-Z][a-zA-Z0-9_]{0,127}$/;

function isRecord(value) {
  return value !== null && typeof value === 'object'
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function hasShape(value, keys) {
  return isRecord(value) && Reflect.ownKeys(value).length === keys.length
    && keys.every(key => Object.hasOwn(value, key)
      && Object.getOwnPropertyDescriptor(value, key).enumerable
      && Object.hasOwn(Object.getOwnPropertyDescriptor(value, key), 'value'));
}

function inRange(value, min, max) {
  return Number.isSafeInteger(value) && value >= min && value <= max;
}

function matches(pattern, value) {
  return typeof value === 'string' && pattern.test(value);
}

function validPath(path, kind) {
  if (typeof path !== 'string') return false;
  const segments = path.split('/');
  return segments.length <= 20 && segments.every(segment => matches(segmentPattern, segment))
    && segments.length % 2 === (kind === 'point' ? 0 : 1);
}

function validateTarget(target) {
  if (hasShape(target, ['mode']) && target.mode === 'synthetic') {
    return Object.freeze({ mode: 'synthetic' });
  }
  if (!hasShape(target, ['mode', 'projectId', 'host', 'port']) || target.mode !== 'emulator'
    || !matches(/^demo-[a-z0-9]+(?:-[a-z0-9]+)*$/, target.projectId)
    || target.projectId.length > 63 || target.host !== '127.0.0.1' || !inRange(target.port, 1, 65535)) {
    throw new CollectorError('INVALID_TARGET');
  }
  return Object.freeze({ ...target });
}

function validateQuery(query) {
  if (!hasShape(query, ['id', 'kind', 'path', 'fields', 'where', 'cap'])
    || !matches(aliasPattern, query.id) || !['point', 'set'].includes(query.kind)
    || !validPath(query.path, query.kind)
    || !Array.isArray(query.fields) || !inRange(query.fields.length, 1, 32)
    || !Array.from(query.fields).every(field => matches(fieldPattern, field))
    || new Set(query.fields).size !== query.fields.length
    || !Array.isArray(query.where) || query.where.length > 8
    || !inRange(query.cap, 1, 100)
    || (query.kind === 'point' && (query.cap !== 1 || query.where.length !== 0))) {
    throw new CollectorError('INVALID_QUERY');
  }

  const approvedPredicates = new Set();
  const where = Array.from(query.where, predicate => {
    if (!hasShape(predicate, ['field', 'equals']) || !query.fields.includes(predicate.field)
      || approvedPredicates.has(predicate.field)
      || !(typeof predicate.equals === 'boolean' || Number.isFinite(predicate.equals)
        || (typeof predicate.equals === 'string' && predicate.equals.length <= 256))) {
      throw new CollectorError('INVALID_QUERY');
    }
    approvedPredicates.add(predicate.field);
    return Object.freeze({ ...predicate });
  });
  return Object.freeze({
    ...query,
    fields: Object.freeze([...query.fields]),
    where: Object.freeze(where),
  });
}

export class CollectorError extends Error {
  constructor(code) {
    super(code);
    this.name = 'CollectorError';
    this.code = code;
  }
}

/**
 * The caller supplies a reviewed approval manifest, independent of the selection
 * sent to collect(). There is no CLI, SDK, endpoint discovery or implicit I/O.
 * The injected fixture transport must apply the request as sent, disable retries
 * and attest a common snapshot. A shared token cannot prove the transport's claims.
 */
export function createBoundedReconciliationCollector(approval, read) {
  if (!hasShape(approval, ['target', 'maxRequests', 'maxDocuments', 'timeoutMs', 'queries', 'summaryKeys'])
    || !inRange(approval.maxRequests, 1, 40) || !inRange(approval.maxDocuments, 1, 1000)
    || !inRange(approval.timeoutMs, 1, 60_000) || !Array.isArray(approval.queries)
    || !inRange(approval.queries.length, 1, 40) || !Array.isArray(approval.summaryKeys)
    || approval.summaryKeys.length > 40 || new Set(approval.summaryKeys).size !== approval.summaryKeys.length
    || !Array.from(approval.summaryKeys).every(key => matches(aliasPattern, key)) || typeof read !== 'function') {
    throw new CollectorError('INVALID_APPROVAL');
  }
  const target = validateTarget(approval.target);
  const { maxRequests, maxDocuments, timeoutMs } = approval;
  const summaryKeys = [...approval.summaryKeys];
  const queries = new Map();
  for (const input of approval.queries) {
    const query = validateQuery(input);
    if (queries.has(query.id)) throw new CollectorError('INVALID_QUERY');
    queries.set(query.id, query);
  }
  let used = false;

  return async function collect(selection, summarize = () => ({})) {
    if (used) throw new CollectorError('ALREADY_ATTEMPTED');
    used = true;
    if (!Array.isArray(selection) || !inRange(selection.length, 1, maxRequests)
      || new Set(selection).size !== selection.length || typeof summarize !== 'function') {
      throw new CollectorError('INVALID_SELECTION');
    }
    if (Array.from(selection).some(id => !queries.has(id))) {
      throw new CollectorError('UNAPPROVED_QUERY');
    }

    if (selection.length !== queries.size) throw new CollectorError('INCOMPLETE_SELECTION');
    const plan = [...queries.values()];
    const reserved = plan.reduce((total, query) => total + resultLimit(query), 0);
    if (reserved > maxDocuments) throw new CollectorError('DOCUMENT_BUDGET');

    const deadline = performance.now() + timeoutMs;
    let snapshot = null;
    let returned = 0;
    const results = [];
    for (const query of plan) {
      const limit = resultLimit(query);
      const request = Object.freeze({
        target,
        kind: query.kind,
        path: query.path,
        fields: query.fields,
        where: query.where,
        orderBy: query.kind === 'set' ? '__name__' : null,
        limit,
        snapshot,
      });
      const response = await readBeforeDeadline(read, request, deadline);
      validateResponse(response, query, limit, snapshot);
      snapshot = response.snapshot;
      returned += response.documents.length;
      try {
        results.push([query.id, structuredClone(response.documents)]);
      } catch {
        throw new CollectorError('INVALID_RESPONSE');
      }
    }

    // Run only after every required operation completed. The result boundary
    // exposes only counts, never documents, snapshot tokens or transport errors.
    const counts = Object.fromEntries(results.map(([id, rows]) => [id, rows.length]));
    let summary;
    try {
      summary = summarize(Object.fromEntries(results));
    } catch {
      throw new CollectorError('SUMMARY_FAILED');
    }
    if (!hasShape(summary, summaryKeys)
      || summaryKeys.some(key => !inRange(summary[key], 0, Number.MAX_SAFE_INTEGER))) {
      throw new CollectorError('INVALID_SUMMARY');
    }
    return {
      status: 'COMPLETE',
      requests: plan.length,
      reserved,
      returned,
      counts,
      summary: { ...summary },
    };
  };
}

function resultLimit(query) {
  return query.kind === 'set' ? query.cap + 1 : 1;
}

async function readBeforeDeadline(read, request, deadline) {
  const remaining = deadline - performance.now();
  if (remaining <= 0) throw new CollectorError('TIMEOUT');

  const controller = new AbortController();
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new CollectorError('TIMEOUT'));
      controller.abort();
    }, Math.ceil(remaining));
  });
  try {
    const pending = Promise.resolve().then(() => read(request, { signal: controller.signal }))
      .catch(() => { throw new CollectorError('TRANSPORT_ERROR'); });
    const response = await Promise.race([pending, timeout]);
    if (performance.now() > deadline) {
      controller.abort();
      throw new CollectorError('TIMEOUT');
    }
    return response;
  } finally {
    clearTimeout(timer);
  }
}

function validateResponse(response, query, limit, snapshot) {
  if (hasShape(response, ['status'])) {
    if (response.status === 'missing' && query.kind === 'point') throw new CollectorError('MISSING_REFERENCE');
    if (response.status === 'denied') throw new CollectorError('DENIED');
    if (response.status === 'error') throw new CollectorError('TRANSPORT_ERROR');
  }
  if (!hasShape(response, ['status', 'snapshot', 'documents', 'complete']) || response.status !== 'ok'
    || typeof response.snapshot !== 'string' || !response.snapshot.trim() || response.snapshot.length > 128
    || !Array.isArray(response.documents) || response.documents.length > limit
    || typeof response.complete !== 'boolean') {
    throw new CollectorError('INVALID_RESPONSE');
  }
  if (snapshot !== null && snapshot !== response.snapshot) throw new CollectorError('SNAPSHOT_MISMATCH');
  if (query.kind === 'set' && response.documents.length === limit) throw new CollectorError('OVERFLOW');
  if (!response.complete) throw new CollectorError('INCOMPLETE_RESPONSE');
  if (query.kind === 'point' && response.documents.length === 0) throw new CollectorError('MISSING_REFERENCE');

  let previousPath = '';
  for (const row of response.documents) {
    if (!hasShape(row, ['path', 'fields']) || !validPath(row.path, 'point')
      || (query.kind === 'point' ? row.path !== query.path
        : row.path.slice(0, row.path.lastIndexOf('/')) !== query.path || row.path <= previousPath)
      || !isRecord(row.fields)
      || !hasShape(row.fields, Reflect.ownKeys(row.fields).filter(field => query.fields.includes(field)))
      || query.where.some(({ field, equals }) => !Object.hasOwn(row.fields, field) || row.fields[field] !== equals)) {
      throw new CollectorError('INVALID_RESPONSE');
    }
    previousPath = row.path;
  }
}
