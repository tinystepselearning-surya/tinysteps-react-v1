/**
 * ARG-2 OFFLINE FIXTURE CONTRACT ONLY.
 * Deliberately NOT imported by the browser, a Firebase Function or an endpoint.
 * Caller supplies authorized canonical lead anchors for the prospective reporting window.
 * No July–October cohort reconstruction, migration or baseline backfill is required.
 * Older canonical lead anchors are used solely to exclude returning children.
 *
 * Acquisition identity = normalized parent phone + normalized child name.
 * It measures distinct child-learning opportunities, not distinct parents.
 * International phone formats are accepted conservatively, not formally validated.
 */
const KNOWN_CHANNELS = new Set([
  'google_organic', 'google_ads', 'bing_organic', 'microsoft_ads',
  'chatgpt', 'google_gemini', 'perplexity', 'microsoft_copilot',
  'claude', 'instagram', 'facebook', 'linkedin', 'youtube',
  'referral', 'direct', 'other',
]);
const INDIA_LOCAL = /^[6-9]\d{9}$/;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
});

function phoneKey(value) {
  if (typeof value !== 'string' || !value.trim() || /[^\d+()\s-]/.test(value)) return null;
  const compact = value.replace(/[()\s-]/g, '');
  if (!/^(?:\+?\d+)$/.test(compact) || (compact.match(/\+/g) || []).length > 1) return null;
  const digits = compact.replace(/\D/g, '');
  if (INDIA_LOCAL.test(digits) && !compact.startsWith('+')) return '+91' + digits;
  if (digits.length === 12 && digits.startsWith('91') && INDIA_LOCAL.test(digits.slice(2))) {
    return '+91' + digits.slice(2);
  }
  if (digits.length === 14 && digits.startsWith('0091') && INDIA_LOCAL.test(digits.slice(4))) {
    return '+91' + digits.slice(4);
  }
  if (compact.startsWith('00') && digits.length >= 10 && digits.length <= 17) {
    return '+' + digits.slice(2);
  }
  if (compact.startsWith('+') && digits.length >= 8 && digits.length <= 15 && /^[1-9]/.test(digits)) {
    return '+' + digits;
  }
  return null;
}

function normalizeChildName(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().slice(0, 160)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return normalized.length >= 2 ? normalized : null;
}

function identityFor(row) {
  const values = [row.phoneNormalized, row.primaryPhone, row.whatsappNumber]
    .filter((v) => typeof v === 'string' && v.trim());
  if (!values.length) return null;
  const keys = values.map(phoneKey);
  if (keys.some((key) => !key) || new Set(keys).size !== 1) return null;
  const child = normalizeChildName(row.childName);
  if (!child) return null;
  // Preserve two children under the same parent as separate acquisition opportunities.
  // Array encoding avoids delimiter collisions. Never return this key from the report.
  return JSON.stringify([keys[0], child]);
}

function millis(value) {
  if (!value) return 0;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : 0;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : 0;
  if (typeof value === 'string') {
    const n = Date.parse(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof value === 'object') {
    if (typeof value.toMillis === 'function') return millis(value.toMillis());
    if (typeof value.seconds === 'number') return millis(value.seconds * 1000);
  }
  return 0;
}

function firstObservedMillis(row) {
  for (const field of ['firstInquiryAt', 'receivedAtOriginal', 'receivedAt', 'requestedAt', 'createdAt']) {
    const time = millis(row[field]);
    if (time) return time;
  }
  return 0;
}

function istDateKey(timestamp) {
  if (!timestamp) return null;
  const parts = Object.fromEntries(formatter.formatToParts(new Date(timestamp))
    .map((part) => [part.type, part.value]));
  return [parts.year, parts.month, parts.day].join('-');
}

function channelFor(row) {
  const raw = row.acquisitionChannel ?? row.attribution?.acquisitionChannel;
  return KNOWN_CHANNELS.has(raw) ? raw : 'unknown';
}

function concernFor(row) {
  const concern = row.mainConcern;
  if (concern === 'Not sure where to start') return 'undecided';
  if (['Starting to read words after learning ABC/sounds', 'Blending sounds to read words'].includes(concern)) return 'phonics';
  if (['Reading speed and word accuracy', 'Spelling while reading and writing', 'Understanding what they read'].includes(concern)) return 'reading';
  if (concern === 'Grammar while speaking or writing') return 'grammar';
  if (['Answering in full sentences', 'Speaking English with confidence', 'Confidence for speaking / presentations'].includes(concern)) return 'speaking';
  return 'unknown';
}

function assertDateKey(value) {
  if (!DATE_KEY.test(value) || !Number.isFinite(Date.parse(value + 'T00:00:00Z')) ||
    new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) !== value) {
    throw new Error('ARG-2 requires valid ISO date keys');
  }
}

/**
 * @param {Array<Record<string, unknown>>} sourceRows canonical lead snapshots/records, never logged
 * @param {Array<{start: string, end: string}>} periods prospective Asia/Kolkata ranges
 * @param {{cutoverDate?: string}} options fixed reporting cutover, defaults to 1 Nov 2026 IST
 * @returns {object} aggregate-only preview, NOT approved for live dashboard use
 */
export function previewFirstObservedParentChildCohorts(sourceRows, periods, options = {}) {
  if (!Array.isArray(sourceRows) || !Array.isArray(periods)) throw new Error('Expected rows and periods');
  const cutoverDate = options.cutoverDate ?? '2026-11-01';
  assertDateKey(cutoverDate);
  for (const {start, end} of periods) {
    assertDateKey(start); assertDateKey(end);
    if (end < start) throw new Error('End date precedes start date');
    if (start < cutoverDate) throw new Error('Prospective reporting period predates ARG-2 cutover');
  }

  const byId = new Map();
  let duplicatesByDocumentId = 0;
  for (const row of sourceRows) {
    if (!row || typeof row !== 'object' || typeof row.id !== 'string' || !row.id) {
      throw new Error('Each historical row must have a nonempty document id');
    }
    if (byId.has(row.id)) {
      duplicatesByDocumentId += 1;
      continue;
    }
    byId.set(row.id, row);
  }

  const historical = [...byId.values()].map((row) => ({
    id: row.id,
    identity: identityFor(row),
    at: firstObservedMillis(row),
    channel: channelFor(row),
    concern: concernFor(row),
  }));
  historical.sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));

  // Use the canonical parent-child first-inquiry anchor, including older anchors
  // only when needed to classify an active pair as pre-cutover returning.
  // No full pre-November cohort reconstruction is needed.
  const firstByParentChild = new Map();
  for (const row of historical) {
    if (row.identity && row.at && !firstByParentChild.has(row.identity)) firstByParentChild.set(row.identity, row);
  }

  const result = periods.map(({start, end}) => {
    const aggregate = {
      start, end,
      firstObservedParentChildEnquiries: 0,
      laterLeadRowsForKnownParentChild: 0,
      datedLeadRows: 0,
      unresolvedParentChildIdentityRows: 0,
      firstTouchChannels: {},
      firstConcernGroups: {},
    };
    for (const row of historical) {
      const date = istDateKey(row.at);
      if (!date || date < start || date > end) continue;
      aggregate.datedLeadRows += 1;
      if (!row.identity) {
        aggregate.unresolvedParentChildIdentityRows += 1;
        continue;
      }
      const first = firstByParentChild.get(row.identity);
      if (first?.id !== row.id) {
        aggregate.laterLeadRowsForKnownParentChild += 1;
        continue;
      }
      aggregate.firstObservedParentChildEnquiries += 1;
      aggregate.firstTouchChannels[row.channel] = (aggregate.firstTouchChannels[row.channel] || 0) + 1;
      aggregate.firstConcernGroups[row.concern] = (aggregate.firstConcernGroups[row.concern] || 0) + 1;
    }
    return aggregate;
  });

  return {
    metric: 'new_parent_child_opportunity_since_cutover',
    cutoverDate,
    historicalReconciliationRequired: false,
    historyIsComplete: false,
    status: 'OFFLINE_PROSPECTIVE_FIXTURE_ONLY_NOT_LIVE_APPROVED',
    inputDocumentRows: sourceRows.length,
    uniqueDocumentRows: historical.length,
    duplicateDocumentRows: duplicatesByDocumentId,
    missingTimestampRows: historical.filter((row) => !row.at).length,
    unresolvedIdentityRows: historical.filter((row) => !row.identity).length,
    periods: result,
  };
}
