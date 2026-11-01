import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIVE_PROGRAMME_OWNERS, reconcileReviewedIndiaAcquisition } from '../lib/india-acquisition-brick1.mjs';

const months = [['Jul 2026', 'Jul'], ['Aug 2026', 'Aug'], ['Sep 2026', 'Sep'], ['Oct 2026', 'Oct']];
const sample = () => ({ queries: {
  month_matrix: { rows: months.map(([month]) => ({
    month, submissions: 4, distinctSubmittingParents: 3, genuineNewParents: 2,
    repeatSubmissions: 1, attributionCoverage: .5, indiaClicks: 20,
    phonicsPageClicks: 3, phonicsPageImpressions: 30,
    commercialPhonicsClicks: 2, commercialPhonicsImpressions: 15,
  })) },
  channel_month: { rows: months.flatMap(([, month]) => [
    { month, channel: 'ChatGPT', newParents: 1 },
    { month, channel: 'Google organic', newParents: 1 },
  ]) },
  intent_month: { rows: months.flatMap(([, month]) => [
    { month, intent: 'Phonics', newParents: 1 },
    { month, intent: 'Unknown / ambiguous', newParents: 1 },
  ]) },
  search_month: { rows: months.flatMap(([, month]) => [
    { month, scope: 'India sitewide', clicks: 20, impressions: 100 },
    { month, scope: '/phonics', clicks: 3, impressions: 30 },
    { month, scope: 'Commercial Phonics queries', clicks: 2, impressions: 15 },
  ]) },
}});
test('Brick 1 reconciles parent, channel, raw need and separate GSC grains', () => {
  const result = reconcileReviewedIndiaAcquisition(sample());
  assert.equal(result.months.length, 4);
  assert.equal(result.months[0].leadHistoryComplete, false);
  assert.equal(result.months[3].gsc.octoberIndiaSitePartial, true);
  assert.equal(result.septemberToOctober.newParentsDelta, 0);
  assert.equal(result.months[2].channels['ChatGPT'], 1);
});
test('five market owners match already-frozen C2 programme owners', async () => {
  const { readFile } = await import('node:fs/promises');
  const c2 = await readFile(new URL('../../src/lib/commercialC2KeywordOwnership.ts', import.meta.url), 'utf8');
  assert.equal(FIVE_PROGRAMME_OWNERS.length, 5);
  for (const owner of FIVE_PROGRAMME_OWNERS) {
    const at = c2.indexOf("id: '" + owner.c2Cluster + "'");
    assert.ok(at >= 0, owner.c2Cluster);
    assert.ok(c2.slice(at, at + 220).includes("canonicalOwnerPath: '" + owner.owner + "'"), owner.owner);
  }
});
test('rejects source/intent/GSC disagreements rather than showing false zeros', () => {
  const c = sample();
  c.queries.channel_month.rows[0].newParents = 2;
  assert.throws(() => reconcileReviewedIndiaAcquisition(c), /channel total/);
  const i = sample();
  i.queries.intent_month.rows[0].newParents = 0;
  assert.throws(() => reconcileReviewedIndiaAcquisition(i), /raw-intent total/);
  const g = sample();
  g.queries.search_month.rows[0].clicks = 19;
  assert.throws(() => reconcileReviewedIndiaAcquisition(g), /GSC indiaClicks differs/);
  const x = sample();
  x.queries.month_matrix.rows[0].genuineNewParents = -1;
  assert.throws(() => reconcileReviewedIndiaAcquisition(x), /nonnegative integer/);
});
test('sanitizes input: raw names and phones are not emitted into aggregate output', () => {
  const input = sample();
  input.queries.month_matrix.rows[0].parentPhone = '+919999999999';
  input.extra = [{ childName: 'Private child' }];
  const output = JSON.stringify(reconcileReviewedIndiaAcquisition(input));
  assert.doesNotMatch(output, /999999|Private child|parentPhone|childName/);
});
