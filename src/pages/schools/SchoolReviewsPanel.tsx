import { useState } from 'react';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { useToast } from '@components/hooks/use-toast';

import { createSchoolReview } from '../../services/schoolEvidenceService';
import type {
  ReviewImplementationRating,
  ReviewMastery,
  ReviewOverallStatus,
  SchoolReview,
  SchoolSection,
} from '../../types/SchoolProgramme';

const dateText = (value: unknown): string => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toLocaleDateString();
  }
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === 'string') {
    const millis = new Date(value).getTime();
    if (Number.isFinite(millis)) return new Date(millis).toLocaleDateString();
  }
  if (value && typeof value === 'object' && 'toDate' in value) {
    const fn = (value as { toDate?: () => Date }).toDate;
    if (typeof fn === 'function') return fn.call(value).toLocaleDateString();
  }
  return '—';
};

interface Props {
  schoolId: string;
  academicYearId: string;
  sections: SchoolSection[];
  reviews: SchoolReview[];
  canEdit: boolean;
  onRefresh: () => Promise<void>;
}

export default function SchoolReviewsPanel({
  schoolId,
  academicYearId,
  sections,
  reviews,
  canEdit,
  onRefresh,
}: Props) {
  const { toast } = useToast();
  const [sectionId, setSectionId] = useState('');
  const [implementationRating, setImplementationRating] = useState<ReviewImplementationRating>('developing');
  const [overallStatus, setOverallStatus] = useState<ReviewOverallStatus>('on_track');
  const [blending, setBlending] = useState<ReviewMastery | ''>('');
  const [segmenting, setSegmenting] = useState<ReviewMastery | ''>('');
  const [decoding, setDecoding] = useState<ReviewMastery | ''>('');
  const [summary, setSummary] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [nextReviewAt, setNextReviewAt] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!summary.trim() || !recommendation.trim()) return;
    setSaving(true);
    try {
      await createSchoolReview({
        schoolId,
        academicYearId,
        sectionId: sectionId || null,
        implementationRating,
        blending: blending || null,
        segmenting: segmenting || null,
        decoding: decoding || null,
        overallStatus,
        summary,
        recommendation,
        nextReviewAt: nextReviewAt ? new Date(`${nextReviewAt}T12:00:00`).toISOString() : null,
      });
      setSummary('');
      setRecommendation('');
      setNextReviewAt('');
      await onRefresh();
      toast({ title: 'Review recorded' });
    } catch (error) {
      toast({
        title: 'Unable to record review',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {canEdit && (
        <Card className="p-5">
          <h3 className="text-lg font-semibold text-slate-900">Record implementation review</h3>
          <p className="mt-1 text-sm text-slate-500">
            Reviews are historical evidence. New reviews are appended rather than overwriting previous observations.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs text-slate-500">Scope
              <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={sectionId} onChange={(event) => setSectionId(event.target.value)}>
                <option value="">Whole school / general</option>
                {sections.filter((item) => item.status === 'active').map((section) => (
                  <option key={section.id} value={section.id}>{section.gradeLabel} — {section.sectionName}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-500">Implementation
              <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={implementationRating} onChange={(event) => setImplementationRating(event.target.value as ReviewImplementationRating)}>
                <option value="strong">Strong</option>
                <option value="developing">Developing</option>
                <option value="needs_support">Needs support</option>
              </select>
            </label>
            <label className="text-xs text-slate-500">Overall status
              <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={overallStatus} onChange={(event) => setOverallStatus(event.target.value as ReviewOverallStatus)}>
                <option value="on_track">On track</option>
                <option value="needs_attention">Needs attention</option>
                <option value="intervention">Intervention</option>
              </select>
            </label>
            <label className="text-xs text-slate-500">Next review
              <Input className="mt-1" type="date" value={nextReviewAt} onChange={(event) => setNextReviewAt(event.target.value)} />
            </label>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <MasterySelect label="Blending" value={blending} onChange={setBlending} />
            <MasterySelect label="Segmenting" value={segmenting} onChange={setSegmenting} />
            <MasterySelect label="Decoding" value={decoding} onChange={setDecoding} />
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <textarea className="min-h-24 rounded-md border border-slate-300 p-3 text-sm" placeholder="Review summary" value={summary} onChange={(event) => setSummary(event.target.value)} />
            <textarea className="min-h-24 rounded-md border border-slate-300 p-3 text-sm" placeholder="Recommendation / next action" value={recommendation} onChange={(event) => setRecommendation(event.target.value)} />
          </div>
          <Button className="mt-3" type="button" disabled={saving || !summary.trim() || !recommendation.trim()} onClick={() => void submit()}>
            {saving ? 'Recording…' : 'Record review'}
          </Button>
        </Card>
      )}

      <Card className="p-5">
        <h3 className="text-lg font-semibold text-slate-900">Review history</h3>
        {reviews.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No implementation reviews recorded yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {[...reviews].reverse().map((review) => (
              <article key={review.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {review.sectionId ? `${review.gradeLabel || ''} ${review.sectionName || ''}`.trim() : 'Whole-school review'}
                    </p>
                    <p className="text-xs text-slate-500">{dateText(review.reviewedAt)} · {review.reviewedByName}</p>
                  </div>
                  <Badge variant="outline">{review.overallStatus.split('_').join(' ')}</Badge>
                </div>
                <p className="mt-3 text-sm text-slate-700">{review.summary}</p>
                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  <span className="font-semibold">Recommendation:</span> {review.recommendation}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>Implementation: {review.implementationRating.split('_').join(' ')}</span>
                  {review.blending && <span>• Blending: {review.blending}</span>}
                  {review.segmenting && <span>• Segmenting: {review.segmenting}</span>}
                  {review.decoding && <span>• Decoding: {review.decoding}</span>}
                  {review.nextReviewAt && <span>• Next review: {dateText(review.nextReviewAt)}</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function MasterySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ReviewMastery | '';
  onChange: (value: ReviewMastery | '') => void;
}) {
  return (
    <label className="text-xs text-slate-500">{label}
      <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={value} onChange={(event) => onChange(event.target.value as ReviewMastery | '')}>
        <option value="">Not rated</option>
        <option value="emerging">Emerging</option>
        <option value="developing">Developing</option>
        <option value="proficient">Proficient</option>
        <option value="mastered">Mastered</option>
      </select>
    </label>
  );
}
