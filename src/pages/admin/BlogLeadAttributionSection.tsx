import React, { useMemo, useState } from 'react';
import { Button } from '@components/ui/button';
import {
  ANALYTICS_METRIC_LABELS,
  hasLeadDemoCompletedMilestone,
  hasLeadEnrolledMilestone,
} from './analyticsMeasurementContract';
import {
  attributionDetail,
  resolveAcquisitionAnalytics,
  type AcquisitionAnalyticsLead,
} from './leadAcquisitionAnalytics';
import {
  aggregateBlogLeadAttribution,
  blogAttributionModeForSlug,
  resolveBlogLeadAttributionCredit,
  type BlogAttributionLead,
} from './blogLeadAttributionAnalytics';

export type BlogLeadAttributionPanelLead = AcquisitionAnalyticsLead & BlogAttributionLead & {
  sourceDetail?: string | null;
};

export type BlogLeadAttributionSectionProps = {
  leads: BlogLeadAttributionPanelLead[];
  loading?: boolean;
  error?: string | null;
};

const pct = (part: number, total: number): string =>
  total > 0 ? `${((part / total) * 100).toFixed(1)}%` : '0.0%';

const humanizeToken = (value: string): string =>
  value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const modeLabel = (mode: ReturnType<typeof blogAttributionModeForSlug>): string => {
  switch (mode) {
    case 'both':
      return 'First touch + influenced';
    case 'first_touch':
      return 'First touch';
    case 'influenced':
      return 'Influenced';
    default:
      return '—';
  }
};

export default function BlogLeadAttributionSection({
  leads,
  loading = false,
  error = null,
}: BlogLeadAttributionSectionProps): JSX.Element {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const summary = useMemo(() => aggregateBlogLeadAttribution(leads), [leads]);
  const leadById = useMemo(
    () => new Map(leads.map((lead) => [lead.id, lead])),
    [leads],
  );
  const selectedArticle = useMemo(
    () => summary.articleRows.find((row) => row.slug === selectedSlug) || null,
    [selectedSlug, summary.articleRows],
  );

  const metricValue = (value: string | number): string | number => {
    if (error) return '—';
    if (loading) return '…';
    return value;
  };

  const unavailableMessage = error
    ? 'Unavailable because lead attribution data could not be loaded.'
    : loading
      ? 'Loading blog attribution…'
      : null;

  return (
    <section aria-labelledby="blog-lead-attribution-heading" className="mt-5 rounded-lg border border-slate-200 bg-slate-50/30">
      <div className="border-b border-slate-200 px-3 py-3 md:px-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h4 id="blog-lead-attribution-heading" className="text-sm font-semibold text-slate-950">
              Brick 5 · Blog lead attribution
            </h4>
            <p className="mt-1 max-w-4xl text-[11px] text-muted-foreground">
              Business attribution only: first-touch blog entry and saved blog conversion context through Demo Created, Demo Completed and Enrolled. This does not measure article visits, Google clicks, impressions, sessions or rankings.
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
            Existing lead cohort · no extra read
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-3 md:grid-cols-3 md:p-4 xl:grid-cols-6">
        {[
          ['Blog-attributed leads', summary.uniqueBlogLeadCount],
          ['First-touch blog', summary.firstTouchBlogLeadCount],
          ['Blog-influenced', summary.influencedBlogLeadCount],
          [ANALYTICS_METRIC_LABELS.demoCompleted, summary.demoCompletedCount],
          [ANALYTICS_METRIC_LABELS.enrolled, summary.enrolledCount],
          ['Lead → Enrolled', pct(summary.enrolledCount, summary.uniqueBlogLeadCount)],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="mt-1 text-lg font-semibold text-slate-950">{metricValue(value)}</div>
          </div>
        ))}
      </div>

      <div className="px-3 pb-3 text-[11px] text-muted-foreground md:px-4">
        <p>
          <span className="font-medium text-slate-700">First touch</span> means the stored lead landing page is a specific <span className="font-mono">/blog/&lt;slug&gt;</span> article. <span className="font-medium text-slate-700">Influenced</span> means the existing blog conversion context was saved into the lead source detail. One lead can legitimately satisfy both.
        </p>
        {summary.crossArticleJourneyCount > 0 && !loading && !error ? (
          <p className="mt-1">
            {summary.crossArticleJourneyCount} lead{summary.crossArticleJourneyCount === 1 ? '' : 's'} first entered on one blog article and later carried conversion context from another article. Article rows therefore use explicit credit and can sum above the unique blog-lead total.
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto border-t border-slate-200 bg-white">
        <table className="w-full min-w-[1040px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="p-2">Blog article</th>
              <th className="p-2 text-right">Attributed leads</th>
              <th className="p-2 text-right">First touch</th>
              <th className="p-2 text-right">Influenced</th>
              <th className="p-2 text-right">{ANALYTICS_METRIC_LABELS.demoCreated}</th>
              <th className="p-2 text-right">{ANALYTICS_METRIC_LABELS.demoCompleted}</th>
              <th className="p-2 text-right">{ANALYTICS_METRIC_LABELS.enrolled}</th>
              <th className="p-2 text-right">Lead → Completed</th>
              <th className="p-2 text-right">Lead → Enrolled</th>
              <th className="p-2 text-right">Detail</th>
            </tr>
          </thead>
          <tbody>
            {summary.articleRows.length === 0 ? (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={10}>
                  {unavailableMessage || 'No blog-attributed leads in this cohort.'}
                </td>
              </tr>
            ) : summary.articleRows.map((row) => (
              <tr key={row.slug} className="border-b last:border-b-0">
                <td className="max-w-[340px] p-2">
                  <a
                    href={`/blog/${row.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-2"
                  >
                    {humanizeToken(row.slug)}
                  </a>
                  <div className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground" title={`/blog/${row.slug}`}>
                    /blog/{row.slug}
                  </div>
                </td>
                <td className="p-2 text-right font-semibold">{row.leadCount}</td>
                <td className="p-2 text-right">{row.firstTouchCount}</td>
                <td className="p-2 text-right">{row.influencedCount}</td>
                <td className="p-2 text-right">{row.demoCreatedCount}</td>
                <td className="p-2 text-right">{row.demoCompletedCount}</td>
                <td className="p-2 text-right">{row.enrolledCount}</td>
                <td className="p-2 text-right">{pct(row.demoCompletedCount, row.leadCount)}</td>
                <td className="p-2 text-right font-semibold">{pct(row.enrolledCount, row.leadCount)}</td>
                <td className="p-2 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant={selectedSlug === row.slug ? 'default' : 'outline'}
                    onClick={() => setSelectedSlug((current) => current === row.slug ? null : row.slug)}
                  >
                    Inspect
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedArticle ? (
        <div className="border-t border-slate-200 bg-slate-50/50">
          <div className="px-3 py-2 md:px-4">
            <div className="text-sm font-semibold text-slate-950">Blog credit detail · {humanizeToken(selectedArticle.slug)}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              Shows why each cohort lead is credited to this article. Blog family and CTA/context values only exist when the saved blog conversion context supports them.
            </div>
          </div>
          <div className="overflow-x-auto border-t border-slate-200 bg-white">
            <table className="w-full min-w-[980px] text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-2">Lead</th>
                  <th className="p-2">Credit</th>
                  <th className="p-2">Blog family</th>
                  <th className="p-2">CTA / context</th>
                  <th className="p-2">Acquisition source</th>
                  <th className="p-2">First landing page</th>
                  <th className="p-2 text-right">Demo completed</th>
                  <th className="p-2 text-right">Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {selectedArticle.leadIds.slice(0, 25).map((leadId) => {
                  const lead = leadById.get(leadId);
                  if (!lead) return null;
                  const credit = resolveBlogLeadAttributionCredit(lead);
                  const mode = credit ? blogAttributionModeForSlug(credit, selectedArticle.slug) : null;
                  const influenceMatches = Boolean(credit?.influencedSlug === selectedArticle.slug);
                  const acquisition = resolveAcquisitionAnalytics(lead);
                  const detail = attributionDetail(lead);
                  return (
                    <tr key={leadId} className="border-b last:border-b-0">
                      <td className="p-2 font-mono">{leadId}</td>
                      <td className="p-2">{modeLabel(mode)}</td>
                      <td className="p-2">{influenceMatches && credit?.family ? humanizeToken(credit.family) : '—'}</td>
                      <td className="p-2">{influenceMatches && credit?.ctaPosition ? humanizeToken(credit.ctaPosition) : '—'}</td>
                      <td className="p-2">{acquisition.label}</td>
                      <td className="max-w-[280px] truncate p-2 font-mono" title={detail.landingPage}>{detail.landingPage}</td>
                      <td className="p-2 text-right">{hasLeadDemoCompletedMilestone(lead) ? 'Yes' : '—'}</td>
                      <td className="p-2 text-right">{hasLeadEnrolledMilestone(lead) ? 'Yes' : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {selectedArticle.leadIds.length > 25 ? (
              <p className="border-t px-3 py-2 text-[11px] text-muted-foreground">
                Showing the first 25 of {selectedArticle.leadIds.length} credited cohort leads for this article.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <p className="border-t border-slate-200 px-3 py-2 text-[11px] text-muted-foreground md:px-4">
        Brick 5 answers which blog articles are creating or influencing leads and downstream admissions. It still cannot say whether blog traffic improved or declined; that requires the later GA4 / Google Search Console traffic brick.
      </p>
    </section>
  );
}
