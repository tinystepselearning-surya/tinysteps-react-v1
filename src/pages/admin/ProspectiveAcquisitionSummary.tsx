import React, { useEffect, useMemo, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { Card } from '@components/ui/card';
import { functions } from '../../lib/firebaseConfig';
import { addDaysToDateKey, todayIstDateKey } from './leadFunnelAnalytics';

const CUTOVER_DATE_KEY = '2026-11-01';

type Summary = {
  startDateKey: string;
  endDateKey: string;
  cutoverDateKey: string;
  newParentChildEnquiries: number;
  unresolvedCandidateRecords: number;
  channels: Record<string, number>;
  basis: 'first_observed_canonical_parent_child';
  canonicalizationNote: string;
  repeatsAvailable: false;
};

type Props = {
  startDateKey?: string;
  endDateKey?: string;
  rangeDays: number;
  refreshKey: number;
};

export default function ProspectiveAcquisitionSummary({
  startDateKey,
  endDateKey,
  rangeDays,
  refreshKey,
}: Props): JSX.Element {
  const endKey = endDateKey || todayIstDateKey();
  const beginning = startDateKey || addDaysToDateKey(endKey, -(rangeDays - 1));
  const effectiveStart = beginning < CUTOVER_DATE_KEY ? CUTOVER_DATE_KEY : beginning;
  const [result, setResult] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const beforeCutover = endKey < CUTOVER_DATE_KEY;

  useEffect(() => {
    if (beforeCutover) {
      setResult(null);
      setLoading(false);
      setError(null);
      return undefined;
    }
    let active = true;
    setResult(null);
    setLoading(true);
    setError(null);
    const callable = httpsCallable<
      { startDateKey: string; endDateKey: string },
      Summary
    >(functions, 'getProspectiveAcquisitionSummary');
    void callable({ startDateKey: effectiveStart, endDateKey: endKey })
      .then(({ data }) => {
        if (!active) return;
        if (
          data.basis !== 'first_observed_canonical_parent_child' ||
          !Number.isFinite(data.newParentChildEnquiries)
        ) {
          throw new Error('Unrecognized acquisition report');
        }
        setResult(data);
      })
      .catch(() => {
        if (active) setError('The verified acquisition summary is unavailable. Existing lead reporting is unaffected.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [beforeCutover, effectiveStart, endKey, refreshKey]);

  const channelRows = useMemo(
    () => Object.entries(result?.channels || {})
      .sort((a, b) => b[1] - a[1]),
    [result],
  );

  return (
    <Card className="p-4 md:p-5" aria-label="New child-specific enquiries">
      <h3 className="text-base font-semibold text-slate-950">New parent–child enquiries</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        First recorded for each child and parent phone · from 1 November 2026 · Asia/Kolkata.
      </p>
      {beforeCutover ? (
        <p className="mt-3 text-sm text-slate-600">
          This new metric starts on 1 November 2026. Earlier months are not recalculated.
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
              <div className="text-xs text-muted-foreground">New child-specific enquiries</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">
                {loading ? '…' : error ? 'Unavailable' : result?.newParentChildEnquiries ?? '—'}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
              <div className="text-xs text-muted-foreground">Unresolved candidate records</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">
                {loading ? '…' : error ? 'Unavailable' : result?.unresolvedCandidateRecords ?? '—'}
              </div>
            </div>
          </div>
          {error ? <p role="status" className="mt-3 text-sm text-amber-700">{error}</p> : null}
          {result && !loading ? (
            <div className="mt-3 text-xs text-slate-600">
              <p>
                {effectiveStart} to {endKey}. Each parent enquiring for two children counts as two opportunities; repeat enquiries for the same child do not increase this total.
              </p>
              {channelRows.length ? (
                <p className="mt-1">
                  First-touch channels: {channelRows.map(([channel, count]) => channel.replace(/_/g, ' ') + ' ' + count).join(' · ')}
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      )}
      <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
        Unresolved records may still be processing or have an identity conflict; they are not included in the new-enquiry total. A newly received enquiry may appear after Firebase canonicalization completes.
        Repeat submission totals need dated inquiry history and are not inferred from lifetime counts.
        The existing lead-reporting cards below remain operational document counts.
      </p>
    </Card>
  );
}
