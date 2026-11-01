/**
 * ARG-2 OFFLINE FIXTURE CONTRACT ONLY.
 * Deliberately NOT imported by the browser, a Firebase Function or an endpoint.
 * Caller must supply complete, authorized historical records; outputs safe aggregates only.
 *
 * Phone identities are reporting proxies, not proof of distinct parents.
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

function identityFor(row) {
  const values = [row.phoneNormalized, row.primaryPhone, row.whatsappNumber]
    .filter((v) => typeof v === 'string' && v.trim());
  if (!values.length) return null;
  const keys = values.map(phoneKey);
  if (keys.some((key) => !key) || new Set(keys).size !== 1) return null;
  return keys[0];
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
 * @param {Array<Record<string, unknown>>} sourceRows recoverable historical leads, never logged
 * @param {Array<{start: string, end: string}>} periods complete Asia/Kolkata ranges
 * @returns {object} safe aggregate-only preview, NOT approved for live dashboard use
 */
export function previewFirstObservedParentCohorts(sourceRows, periods) {
  if (!Array.isArray(sourceRows) || !Array.isArray(periods)) throw new Error('Expected rows and periods');
  for (const {start, end} of periods) {
    assertDateKey(start); assertDateKey(end);
    if (end < start) throw new Error('End date precedes start date');
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

  // Group by parent phone across the COMPLETE supplied lookback before applying date filters.
  const firstByParent = new Map();
  for (const row of historical) {
    if (row.identity && row.at && !firstByParent.has(row.identity)) firstByParent.set(row.identity, row);
  }

  const result = periods.map(({start, end}) => {
    const aggregate = {
      start, end,
      firstObservedParentPhones: 0,
      laterLeadRowsForKnownParents: 0,
      datedLeadRows: 0,
      unresolvedPhoneRows: 0,
      firstTouchChannels: {},
      firstConcernGroups: {},
    };
    for (const row of historical) {
      const date = istDateKey(row.at);
      if (!date || date < start || date > end) continue;
      aggregate.datedLeadRows += 1;
      if (!row.identity) {
        aggregate.unresolvedPhoneRows += 1;
        continue;
      }
      const first = firstByParent.get(row.identity);
      if (first?.id !== row.id) {
        aggregate.laterLeadRowsForKnownParents += 1;
        continue;
      }
      aggregate.firstObservedParentPhones += 1;
      aggregate.firstTouchChannels[row.channel] = (aggregate.firstTouchChannels[row.channel] || 0) + 1;
      aggregate.firstConcernGroups[row.concern] = (aggregate.firstConcernGroups[row.concern] || 0) + 1;
    }
    return aggregate;
  });

  return {
    metric: 'first_observed_parent_phone_in_supplied_history',
    historyIsComplete: false,
    status: 'OFFLINE_FIXTURE_ONLY_NOT_LIVE_APPROVED',
    inputDocumentRows: sourceRows.length,
    uniqueDocumentRows: historical.length,
    duplicateDocumentRows: duplicatesByDocumentId,
    missingTimestampRows: historical.filter((row) => !row.at).length,
    unresolvedIdentityRows: historical.filter((row) => !row.identity).length,
    periods: result,
  };
}
