/** Brick 1: aggregate-only research reconciliation. No Firestore/network access. */
export const MONTHS = Object.freeze([
  ['Jul 2026', 'Jul', false],
  ['Aug 2026', 'Aug', true],
  ['Sep 2026', 'Sep', true],
  ['Oct 2026', 'Oct', true],
]);
export const FIVE_PROGRAMME_OWNERS = Object.freeze([
  { market: 'Phonics', c2Cluster: 'phonics-provider', owner: '/phonics' },
  { market: 'Reading', c2Cluster: 'reading-provider', owner: '/reading-classes-for-kids' },
  { market: 'Grammar', c2Cluster: 'grammar-provider', owner: '/grammar' },
  { market: 'Public Speaking', c2Cluster: 'public-speaking-provider', owner: '/speaking' },
  { market: 'Broad English', c2Cluster: 'broad-english-provider', owner: '/online-english-classes-for-kids' },
]);
const bad = (message) => { throw new Error('Brick 1 aggregate mismatch: ' + message); };
const count = (value, label) => {
  if (!Number.isSafeInteger(value) || value < 0) bad(label + ' must be a nonnegative integer');
  return value;
};
const table = (data, name) => {
  const rows = data?.queries?.[name]?.rows;
  if (!Array.isArray(rows) || !rows.length) bad('missing queries.' + name + '.rows');
  return rows;
};
const sum = (rows, key) => rows.reduce((s, row) => s + count(row[key], key), 0);
const group = (rows) => {
  const result = new Map();
  for (const row of rows) result.set(row.month, [...(result.get(row.month) || []), row]);
  return result;
};
/** Input must be reviewed, aggregate-only data, never individual customer records. */
export function reconcileReviewedIndiaAcquisition(data) {
  const base = table(data, 'month_matrix');
  const channels = group(table(data, 'channel_month'));
  const needs = group(table(data, 'intent_month'));
  const searches = group(table(data, 'search_month'));
  if (base.length !== 4) bad('expected exactly four month_matrix rows');
  const result = MONTHS.map(([label, month, historyComplete]) => {
    const matching = base.filter(row => row.month === label);
    if (matching.length !== 1) bad(label + ' missing or duplicated');
    const row = matching[0], total = count(row.genuineNewParents, label + '.genuineNewParents');
    const submissions = count(row.submissions, label + '.submissions');
    const submittingParents = count(row.distinctSubmittingParents, label + '.distinctSubmittingParents');
    const repeats = count(row.repeatSubmissions, label + '.repeatSubmissions');
    if (total > submittingParents || submittingParents > submissions || repeats > submissions) bad(label + ' incompatible counts');
    if (!Number.isFinite(row.attributionCoverage) || row.attributionCoverage < 0 || row.attributionCoverage > 1) bad(label + ' attribution coverage');
    const sourceRows = channels.get(month) || [], intentRows = needs.get(month) || [];
    if (!sourceRows.length || !intentRows.length) bad(label + ' missing channel/intent evidence');
    if (new Set(sourceRows.map(r => r.channel)).size !== sourceRows.length) bad(label + ' repeated channel');
    if (new Set(intentRows.map(r => r.intent)).size !== intentRows.length) bad(label + ' repeated intent');
    if (sum(sourceRows, 'newParents') !== total) bad(label + ' channel total != new parents');
    if (sum(intentRows, 'newParents') !== total) bad(label + ' raw-intent total != new parents');
    const searchRows = searches.get(month) || [];
    const scoped = (scope) => {
      const found = searchRows.filter(r => r.scope === scope);
      if (found.length !== 1) bad(label + ' missing/duplicate GSC ' + scope);
      return found[0];
    };
    const site = scoped('India sitewide'), phonics = scoped('/phonics'), buyer = scoped('Commercial Phonics queries');
    for (const [field, actual] of [
      ['indiaClicks', site.clicks],
      ['phonicsPageClicks', phonics.clicks],
      ['phonicsPageImpressions', phonics.impressions],
      ['commercialPhonicsClicks', buyer.clicks],
      ['commercialPhonicsImpressions', buyer.impressions],
    ]) if (count(row[field], field) !== count(actual, field + '.GSC')) bad(label + ' GSC ' + field + ' differs');
    return {
      month, newParents: total, submissions, distinctSubmittingParents: submittingParents,
      repeatSubmissions: repeats, attributionCoverage: row.attributionCoverage,
      channels: Object.fromEntries(sourceRows.map(r => [r.channel, r.newParents])),
      intents: Object.fromEntries(intentRows.map(r => [r.intent, r.newParents])),
      gsc: {
        indiaClicks: site.clicks, indiaImpressions: count(site.impressions, month + '.siteImpressions'),
        phonicsPageClicks: phonics.clicks, phonicsPageImpressions: phonics.impressions,
        commercialPhonicsClicks: buyer.clicks, commercialPhonicsImpressions: buyer.impressions,
        octoberIndiaSitePartial: month === 'Oct',
      },
      leadHistoryComplete: historyComplete,
    };
  });
  const sep = result[2], oct = result[3];
  const channelNames = new Set([...Object.keys(sep.channels), ...Object.keys(oct.channels)]);
  return {
    sourceStatus: 'owner-supplied-reviewed-aggregate; not a new live Firebase read',
    timezone: 'Asia/Kolkata',
    limitations: [
      'July lead events begin 11 July 2026: incomplete month.',
      'October sitewide GSC excludes 31 October in this snapshot.',
      'Attribution policies changed 10 August and 19 September 2026.',
      'GSC query privacy thresholds prevent treating disclosed queries as national search volume.',
      'Search clicks are not linked to individual Firestore enquiries.',
    ],
    months: result,
    septemberToOctober: {
      newParentsDelta: oct.newParents - sep.newParents,
      channelDeltas: Object.fromEntries([...channelNames].sort().map(k => [k, (oct.channels[k] || 0) - (sep.channels[k] || 0)])),
      commercialPhonicsImpressionsDelta: oct.gsc.commercialPhonicsImpressions - sep.gsc.commercialPhonicsImpressions,
      sitewideIndiaClicksDelta: oct.gsc.indiaClicks - sep.gsc.indiaClicks,
    },
    programmeOwners: FIVE_PROGRAMME_OWNERS,
    nationalMarketVolumes: 'NOT MEASURED: consistent India keyword monthly-volume export missing for all five markets',
  };
}
